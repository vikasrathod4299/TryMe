from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage
from urllib.parse import urlparse
import base64, mimetypes
from google import genai
from PIL import Image
from io import BytesIO
from datetime import datetime, timezone
from .state import AgentState
from langgraph.graph import StateGraph, START, END
from app import logger

desciber = ChatOpenAI(model_name="gpt-4o", temperature=0)
genai_client= genai.Client()


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
    resp = desciber.invoke(messages)
    return resp.content


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


def generate_garment_description(state: AgentState) -> AgentState:
    garment_img=state['garment_img']
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
    return {"garment_description":garment_description}


def img_generator(state: AgentState) -> AgentState:
    from pathlib import Path
    garment_img=state['garment_img']
    person_img=state['person_img']
    person_desc=state['person_description']
    garment_desc=state['garment_description']

    TRYON_PROMPT_TEMPLATE = (
        "Create a realistic try-on photo.\n"
        "Take the {garment_desc} from the first image and put it on the person from the second image ({person_desc}).\n"
        "Keep the person’s original background, perspective, pose, and lighting unchanged.\n"
        "Ensure the garment fits naturally to the body shape (align shoulders, neckline, sleeves/waist/hem) and preserves fabric texture and proportions.\n"
    )

    dress_image = Image.open(garment_img)
    model_image = Image.open(person_img)

    gemini_prompt=TRYON_PROMPT_TEMPLATE.format(garment_desc=garment_desc, person_desc=person_desc)

    response = genai_client.models.generate_content(
        model="gemini-2.5-flash-image-preview",
        contents=[dress_image, model_image, gemini_prompt],
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

    return {"generated_image":file_name}



# define graph
graph = StateGraph(AgentState)


# Construct the nodes
graph.add_node("generate_person_description", generate_person_description)
graph.add_node("generate_garment_description", generate_garment_description)
graph.add_node("img_generator", img_generator)
logger.info("Nodes added to the graph.")

# Define edges
graph.add_edge(START, "generate_person_description")
graph.add_edge(START, "generate_garment_description")
graph.add_edge("generate_person_description", "img_generator")
graph.add_edge("generate_garment_description", "img_generator")
graph.add_edge("img_generator", END)
logger.info("Edges added to the graph.")


# Compile the graph
workflow = graph.compile()
logger.info("Graph compiled successfully.")





