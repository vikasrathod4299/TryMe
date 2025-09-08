from pydantic import BaseModel, Field
from langgraph.graph import StateGraph
from typing import TypedDict


class AgentState(TypedDict):
    person_img: str
    garment_img: str
    garment_description: str
    generated_image: str
    is_outfit_worn: bool



