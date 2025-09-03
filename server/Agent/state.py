from langgraph.graph import StateGraph
from typing import TypedDict


class AgentState(TypedDict):
    person_img: str
    garment_img: str
    person_description: str
    garment_description: str
    generated_image: str



