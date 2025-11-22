from app.main import run
from app import logger
from .nodes import workflow
import os


if __name__ == "__main__":
    initial_state = {
        "person_img": "D:/TryMe/server/experiements/p5_revised.jpg",
        "garment_img": "D:/TryMe/server/experiements/g13.jpg",
    }
    result = workflow.invoke(initial_state)
    logger.info(f"Workflow result: {result}")
