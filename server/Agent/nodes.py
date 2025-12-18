import os
import numpy as np
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage
from urllib.parse import urlparse
import base64, mimetypes
from google import genai
from google.genai import types
from PIL import Image
from io import BytesIO
from datetime import datetime, timezone
from .state import AgentState
from langgraph.graph import StateGraph, START, END
from pydantic import BaseModel
from app import logger
from pathlib import Path

# GPT-4o for complex tasks (image description)
openai_llm = ChatOpenAI(model_name="gpt-4o", temperature=0)
# GPT-4o-mini for simple classification tasks (faster & cheaper)
openai_llm_fast = ChatOpenAI(model_name="gpt-4o-mini", temperature=0)

genai_client = genai.Client(api_key=os.getenv('GEMINI_API_KEY'))
gemini_config = types.GenerateContentConfig(
    temperature=0.8,  # Lower temperature for more consistent results
    top_p=0.95,
)


def _compute_phash(image: Image.Image, hash_size: int = 16) -> np.ndarray:
    """
    Compute perceptual hash (pHash) of an image.
    Returns a binary array that can be compared for similarity.
    """
    # Resize to hash_size x hash_size and convert to grayscale
    img = image.convert('L').resize((hash_size, hash_size), Image.Resampling.LANCZOS)
    pixels = np.array(img, dtype=np.float64)
    
    # Compute DCT (using simple average-based approach for efficiency)
    # Compare each pixel to the mean
    mean = pixels.mean()
    return pixels > mean


def _calculate_image_similarity(img1: Image.Image, img2: Image.Image) -> float:
    """
    Calculate visual similarity between two images using perceptual hashing.
    Returns a similarity score from 0.0 (completely different) to 1.0 (identical).
    """
    hash1 = _compute_phash(img1)
    hash2 = _compute_phash(img2)
    
    # Calculate Hamming distance (number of different bits)
    total_bits = hash1.size
    different_bits = np.sum(hash1 != hash2)
    
    # Convert to similarity (1.0 = identical, 0.0 = completely different)
    similarity = 1.0 - (different_bits / total_bits)
    return similarity


def _verify_outfit_changed(original_img_path: str, generated_img: Image.Image, similarity_threshold: float = 0.85) -> bool:
    """
    Verify that the generated image shows a different outfit than the original.
    Returns True if the outfit appears to have changed, False if images are too similar.
    
    Args:
        original_img_path: Path to the original person image
        generated_img: The generated PIL Image
        similarity_threshold: If similarity is above this, consider it unchanged (default 0.85)
                              A successful try-on typically has similarity around 0.70-0.80
                              since the pose/background stay same but clothing changes.
    """
    original_img = Image.open(original_img_path)
    
    # Resize both to same size for comparison
    compare_size = (256, 256)
    original_resized = original_img.resize(compare_size, Image.Resampling.LANCZOS)
    generated_resized = generated_img.resize(compare_size, Image.Resampling.LANCZOS)
    
    similarity = _calculate_image_similarity(original_resized, generated_resized)
    logger.info(f"Image similarity score: {similarity:.4f} (threshold: {similarity_threshold})")
    
    if similarity >= similarity_threshold:
        logger.warning(f"Generated image is too similar to input (similarity: {similarity:.4f}). Outfit may not have changed.")
        return False
    
    return True


def _content_block_for_image(image: str):
    """Return an OpenAI-compatible content block for either a URL or a local file."""
    is_url = urlparse(image).scheme in {"http", "https"}
    if is_url:
        return {"type": "image_url", "image_url": {"url": image}}
    # local file -> data URL
    mime, _ = mimetypes.guess_type(image)
    mime = mime or "image/png"
    with open(image, "rb") as f:
        b64 = base64.b64encode(f.read()).decode("utf-8")
    return {
        "type": "image_url",
        "image_url": {"url": f"data:{mime};base64,{b64}"}
    }


def _describe_images(image: str, system_prompt: str, human_prompt: str):
    """
    Describe an image in simple language.
    `image` can be an http(s) URL or a local file path.
    """
    SYS_PROMPT=SystemMessage(content=system_prompt)

    content_block = _content_block_for_image(image)

    messages = [
        SYS_PROMPT,
        HumanMessage(
            content=[
                {"type": "text", "text": human_prompt},
                content_block,
            ]
        ),
    ]
    resp = openai_llm.invoke(messages)
    return resp.content


def _is_outfit_worn(image: str) -> bool:
    """
    Determine if the outfit in the image is being worn by a person.
    Uses GPT-4o-mini for faster classification.
    `image` can be an http(s) URL or a local file path.
    """
    class OutfitWornResponse(BaseModel):
        worn: bool

    prompt = """If a real person is wearing the garment in this image, output true; otherwise (product-only, hanger/mannequin/flat-lay), output false. Respond with only true or false."""

    content_block = _content_block_for_image(image)
    # Use faster model for this simple classification task
    llm_with_structured_output = openai_llm_fast.with_structured_output(OutfitWornResponse)
    messages = [
        HumanMessage(
            content=[
                {"type": "text", "text": prompt},
                content_block,
            ]
        ),
    ]
    resp = llm_with_structured_output.invoke(messages)
    return resp.worn


def get_outfit_photo(images: str) -> str:
    """
    Extract outfit from an image where a person is wearing it.
    Returns the file path to the extracted outfit image.
    """
    prompt="""Get the outfit from the image and generate a  image of the outfit laid flat on a neutral surface.The output image should have a transparent background and be suitable for online retail display.RULES:1.If there is any cutlary on model or person please do not include that with garments."""

    dress_image = Image.open(images)
    logger.info(f"Extracting outfit from worn image: {images}")

    response = genai_client.models.generate_content(
        model="gemini-2.5-flash-image-preview",
        contents=[dress_image, prompt],
        config=gemini_config,
    )
    
    # Log response details for debugging
    if response.candidates:
        logger.info(f"Gemini response candidates count: {len(response.candidates)}")
        if response.candidates[0].content.parts:
            logger.info(f"Response parts count: {len(response.candidates[0].content.parts)}")
            for i, part in enumerate(response.candidates[0].content.parts):
                if hasattr(part, 'text') and part.text:
                    logger.info(f"Part {i} text response: {part.text[:200]}...")
                if part.inline_data:
                    logger.info(f"Part {i} has inline_data with mime_type: {part.inline_data.mime_type}")
    else:
        logger.warning("No candidates in Gemini response for outfit extraction")
    
    image_parts = [
        part.inline_data.data
        for part in response.candidates[0].content.parts
        if part.inline_data
    ]
    if image_parts:
        image = Image.open(BytesIO(image_parts[0]))
        # Use unique filename with timestamp to avoid conflicts between jobs
        ts = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S%fZ")
        extracted_dir = Path("generated_images")
        extracted_dir.mkdir(parents=True, exist_ok=True)
        filename = extracted_dir / f"extracted_outfit_{ts}.png"
        image.save(filename)
        logger.info(f"Extracted outfit saved to: {filename}")
        return str(filename)
    else:
        logger.error("Failed to extract outfit from image - no image data returned by Gemini")
        raise Exception("Failed to extract outfit from worn image - Gemini returned no image data")


# Node initialization functions
def generate_person_description(state: AgentState) -> AgentState:
    person_img=state['person_img']
    system_prompt="""
        You are a portrait describer.
        Describe the PERSON image in one short, simple sentence (max ~18 words).
        Mention shot type (full-body/mid/portrait), facing direction if clear, and background style (plain/neutral/indoor).
        Do NOT mention identity, race, age, or sensitive traits.
        Example: 'A full-body photo of a woman standing front-facing against a neutral grey studio background.'
    """
    human_prompt="""
        Describe this person photo briefly.
    """

    person_description=_describe_images(person_img, system_prompt, human_prompt)
    return {"person_description":person_description}


def generate_garment_description(garment_img):
    # garment_img=state['garment_img']
    system_prompt="""
        You are a product photo describer.
        Describe the GARMENT image in one short, simple sentence (max ~18 words).
        Focus on color, type, key details (e.g., hood/zip/buttons/pockets), and material if obvious.
        No brand/speculation. No background description unless plain/neutral.
        Examples: 'A blue floral summer dress on a plain white background.'
        'A black cotton hoodie with a front pocket and hood, photographed on a neutral surface.'
    """
    human_prompt="""
        Describe this garment briefly.
    """
    garment_description=_describe_images(garment_img, system_prompt, human_prompt)
    return garment_description


def img_generator(person_img, garment_img, cached_garment_description: str = None):
    """
    Generate try-on image.
    
    Args:
        person_img: Path to person image
        garment_img: Path to garment image  
        cached_garment_description: Optional cached description to skip re-generating
    """
    if cached_garment_description:
        garment_description = cached_garment_description
        logger.info(f"Using cached garment description: {garment_description}")
    else:
        garment_description = generate_garment_description(garment_img)
        logger.info(f"Generated garment description: {garment_description}")

    dress_image = Image.open(garment_img)
    model_image = Image.open(person_img)

    gemini_prompt = """Create a professional e-commerce fashion photo. Take the garment ({garment_desc}) from the first image and dress the person from the second image in it. 

IMPORTANT REQUIREMENTS:
1. Replace/change the person's current clothing with the garment from image 1
2. Keep the person's pose, face, body shape, and background exactly the same
3. Adjust lighting and shadows to make the garment look natural on the person

The output image must show the person wearing the NEW garment, not their original clothing."""

    gemini_prompt = gemini_prompt.format(garment_desc=garment_description)
    logger.info("Sending request to Gemini for try-on generation...")

    response = genai_client.models.generate_content(
        model="gemini-2.5-flash-image-preview",
        contents=[dress_image, model_image, gemini_prompt],
        config=gemini_config
    )

    # Log response details for debugging
    if response.candidates:
        logger.info(f"Gemini response candidates count: {len(response.candidates)}")
        if response.candidates[0].content.parts:
            logger.info(f"Response parts count: {len(response.candidates[0].content.parts)}")
            for i, part in enumerate(response.candidates[0].content.parts):
                if hasattr(part, 'text') and part.text:
                    logger.warning(f"Gemini returned text instead of image (Part {i}): {part.text[:300]}...")
                if part.inline_data:
                    logger.info(f"Part {i} has inline_data with mime_type: {part.inline_data.mime_type}")
        else:
            logger.error("No parts in Gemini response content")
    else:
        logger.error("No candidates in Gemini response")

    image_parts = [
        part.inline_data.data
        for part in response.candidates[0].content.parts
        if part.inline_data
    ]

    if image_parts:
        DIR=Path('generated_images')
        DIR.mkdir(parents=True, exist_ok=True)
        ts = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S%fZ")
        file_name = f"fashion_ecommerce_shot_{ts}.png"
        file_path = DIR / file_name
        generated_image = Image.open(BytesIO(image_parts[0]))
        generated_image.save(file_path)
        
        # Validate that the generated image visually differs from input using perceptual hashing
        outfit_changed = _verify_outfit_changed(person_img, generated_image)
        
        if not outfit_changed:
            logger.error("Generated image is visually too similar to input - outfit was not applied")
            raise Exception("The outfit was not applied to the image. The generated image looks the same as the input. Please try again with different images.")
        
        logger.info(f"Successfully generated try-on image with outfit change verified: {file_path}")
        return str(file_path), garment_description
    else:
        # Check if there's a text response explaining why no image was generated
        text_responses = [
            part.text for part in response.candidates[0].content.parts
            if hasattr(part, 'text') and part.text
        ]
        if text_responses:
            error_msg = f"Gemini returned text instead of image: {text_responses[0][:500]}"
            logger.error(error_msg)
            raise Exception(error_msg)
        raise Exception("No image generated by Gemini model")


def try_on_me(state: AgentState):

    person_img = state['person_img']
    garment_img = state['garment_img']

    logger.info(f"Starting try-on process - Person: {person_img}, Garment: {garment_img}")
    
    is_worn = _is_outfit_worn(garment_img)
    logger.info(f"Is outfit being worn by a person: {is_worn}")
    
    # Prepare garment image path (extract once if worn)
    effective_garment_path = garment_img
    if is_worn:
        logger.info("Extracting outfit from worn image (one-time operation)...")
        effective_garment_path = get_outfit_photo(garment_img)
        logger.info(f"Using extracted outfit: {effective_garment_path}")
    
    max_retries = 1  # Only 1 retry to avoid long waits (total 2 attempts)
    last_error = None
    cached_description = None  # Cache description between retries
    
    for attempt in range(max_retries + 1):
        try:
            logger.info(f"Attempt {attempt + 1}/{max_retries + 1}: Generating try-on image...")
            generated_img, garment_desc = img_generator(
                person_img, 
                effective_garment_path,
                cached_garment_description=cached_description
            )
            
            # Cache description for potential retry
            if not cached_description:
                cached_description = garment_desc
            
            logger.info(f"Try-on generation completed successfully: {generated_img}")
            return {"generated_image": generated_img, "garment_description": garment_desc}
            
        except Exception as e:
            last_error = e
            # Cache description even on failure to avoid re-generating
            if not cached_description and 'garment_desc' in dir():
                cached_description = garment_desc
            
            logger.warning(f"Attempt {attempt + 1} failed: {str(e)}")
            if attempt < max_retries:
                logger.info(f"Retrying... ({max_retries - attempt} retry left)")
            else:
                logger.error(f"All {max_retries + 1} attempts failed. Last error: {str(e)}")
                raise last_error


# define graph
graph = StateGraph(AgentState)

# Construct the nodes
# graph.add_node("generate_person_description", generate_person_description)
# graph.add_node("generate_garment_description", generate_garment_description)
# graph.add_node("img_generator", img_generator)
graph.add_node("img_generator", try_on_me)
logger.info("Nodes added to the graph.")

# Define edges
graph.add_edge(START, "img_generator")
# graph.add_edge(START, "generate_garment_description")
# graph.add_edge("generate_person_description", "img_generator")
# graph.add_edge("generate_garment_description", "img_generator")
graph.add_edge("img_generator", END)
logger.info("Edges added to the graph.")


# Compile the graph
workflow = graph.compile()
logger.info("Graph compiled successfully.")
