import os
import logging

# Base Directories
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(BASE_DIR)
DATA_DIR = os.path.abspath(os.path.join(ROOT_DIR, "data"))
PLAYBACK_DIR = os.path.join(DATA_DIR, "playback-content")
MEDIA_DIR = os.path.join(PLAYBACK_DIR, "media")

# Server Configuration
SERVER_HOST = "0.0.0.0"
SERVER_PORT = 8000
BASE_URL = f"http://192.168.1.23:{SERVER_PORT}"

# TTS Configuration
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Logging Configuration
LOG_FORMAT = "[%(asctime)s] [%(name)s] %(message)s"
DATE_FORMAT = "%H:%M:%S"


def configure_logging():
    logging.basicConfig(
        level=logging.INFO,
        format=LOG_FORMAT,
        datefmt=DATE_FORMAT,
    )
