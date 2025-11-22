import os
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

openai_llm = ChatOpenAI(model_name="gpt-4o", temperature=0)
genai_client= genai.Client(api_key=os.getenv('GEMINI_API_KEY'))
gemini_config = types.GenerateContentConfig(
    temperature=1,
    top_p=0.95,
)


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
    `image` can be an http(s) URL or a local file path.
    """
    class OutfitWornResponse(BaseModel):
        worn: bool

    prompt = """If a real person is wearing the garment in this image, output true; otherwise (product-only, hanger/mannequin/flat-lay), output false. Respond with only true or false."""

    content_block = _content_block_for_image(image)
    llm_with_structured_output = openai_llm.with_structured_output(OutfitWornResponse)
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


def get_outfit_photo(images :str)-> Image.Image:

    prompt="""Get the outfit from the image and generate a  image of the outfit laid flat on a neutral surface.The output image should have a transparent background and be suitable for online retail display.RULES:1.If there is any cutlary on model or person please do not include that with garments."""

    dress_image = Image.open(images)

    response = genai_client.models.generate_content(
        model="gemini-2.5-flash-image-preview",
        contents=[dress_image, prompt],
        config=gemini_config,
    )
    # print(response)
    image_parts = [
        part.inline_data.data
        for part in response.candidates[0].content.parts
        if part.inline_data
    ]
    if image_parts:
        image = Image.open(BytesIO(image_parts[0]))
        filename = "extracted_outfit.png"
        image.save(filename)
        image.show()
        return image



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


def img_generator(person_img, garment_img):
    from pathlib import Path

    garment_description = generate_garment_description(garment_img)

    dress_image = Image.open(garment_img)
    model_image = Image.open(person_img)

    gemini_prompt="""Create a professional e-commerce fashion photo.{garment_desc} from the first image and let the person from the second image wear it. Generate a realistic, full-body shot of the person wearing the whole garment, with the lighting and shadows adjusted to match the person's environment.Person's pose and background should remain unchanged and body should not be changed."""

    gemini_prompt = gemini_prompt.format(garment_desc=garment_description)

    response = genai_client.models.generate_content(
        model="gemini-2.5-flash-image-preview",
        contents=[dress_image, model_image, gemini_prompt],
        config=gemini_config
    )

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
        image = Image.open(BytesIO(image_parts[0]))
        image.save(DIR / file_name)

    return file_name, garment_description


def try_on_me(state: AgentState):

    DIR=Path('generated_images')
    extracted_outfit_file_name = "extracted_outfit.png"
    person_img = state['person_img']
    garment_img = state['garment_img']

    is_worn = _is_outfit_worn(garment_img)
    logger.info(f"is worn : {is_worn}")
    if not is_worn:
        logger.info("Getting inference ....")
        generated_img, germent_desc = img_generator(person_img, garment_img)
        logger.info("Inference finished ....")
    else:
        logger.info("Getting inference ....")
        garment_img = get_outfit_photo(garment_img)
        file_path = "extracted_outfit.png"
        logger.info(file_path)
        generated_img, germent_desc = img_generator(person_img, file_path)
        logger.info("Inference finished ....")
    return {"generated_image":generated_img, "garment_description":germent_desc}





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
