
from dotenv import load_dotenv
from pathlib import Path


# Load server/.env exactly once (works no matter where you run from)
PROJECT_ROOT = Path(__file__).resolve().parents[1]
load_dotenv(PROJECT_ROOT / ".env")


from .utils.logging import logger, setup_logging, LogLevel
__all__ = ["logger", "setup_logging", "LogLevel"]