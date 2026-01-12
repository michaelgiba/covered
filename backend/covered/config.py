import os
import logging

# Base Directories
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.abspath(os.path.join(BASE_DIR, "../data"))
PLAYBACK_DIR = os.path.join(DATA_DIR, "playback_content")

# Server Configuration
SERVER_HOST = "0.0.0.0"
SERVER_PORT = 8000
BASE_URL = f"http://192.168.1.23:{SERVER_PORT}"

# Logging Configuration
LOG_FORMAT = "[%(asctime)s] [%(name)s] %(message)s"
DATE_FORMAT = "%H:%M:%S"

def configure_logging():
    logging.basicConfig(
        level=logging.INFO,
        format=LOG_FORMAT,
        datefmt=DATE_FORMAT,
    )
