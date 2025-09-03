from app import logger
from .nodes import workflow
from pathlib import Path

if __name__ == "__main__":
    initial_state = {
        "person_img": "D:/TryMe/server/experiements/p4.jpg",
        "garment_img": "D:/TryMe/server/experiements/g4.jpg",
    }
    result = workflow.invoke(initial_state)