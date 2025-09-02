import os
import logging
from enum import StrEnum


LOG_FORMAT_DEBUG = "%(levelname)s: %(message)s - %(filename)s - %(funcName)s - %(lineno)d"
LOG_FORMAT_DEFAULT = "%(levelname)s: %(message)s"


class LogLevel(StrEnum):
    debug = "DEBUG"
    info = "INFO"
    warning = "WARNING"
    error = "ERROR"


def setup_logging(level: LogLevel = LogLevel.error) -> logging.Logger:
    """Set up logging configuration and return a logger instance."""
    logger = logging.getLogger("app")
    logger.setLevel(getattr(logging, level))

    # Prevent duplicate handlers if setup_logging is called multiple times
    if logger.handlers:
        return logger

    handler = logging.StreamHandler()

    if level == LogLevel.debug:
        formatter = logging.Formatter(LOG_FORMAT_DEBUG)
    else:
        formatter = logging.Formatter(LOG_FORMAT_DEFAULT)

    handler.setFormatter(formatter)
    logger.addHandler(handler)

    return logger


_level = os.getenv("LOG_LEVEL", "DEBUG").upper()
# Global logger ready to import
logger = setup_logging(_level)
