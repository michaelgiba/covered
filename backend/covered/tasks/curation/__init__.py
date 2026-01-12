
"""
The primary purpose of the curation task is to convert data from messy 
sources into new Topic objects that are stored in a JSON file.

These do not have playback content at this point.
"""
import logging
import asyncio
from ._service import TopicService
from covered.config import DATA_DIR
import os

logger = logging.getLogger("CURATION")

def curate_step():
    # Ensure data dir exists
    os.makedirs(DATA_DIR, exist_ok=True)

    logger.info("1. Generating and Curating Topics...")
    topic_service = TopicService()
    topics = topic_service.curate_from_emails(3)

    logger.info(f"Saved {len(topics)} topics to data/topics.json")

async def curation_loop():
    logger.info("Starting Curation Loop...")
    while True:
        try:
            # Run blocking curation in a separate thread
            await asyncio.to_thread(curate_step)
        except Exception as e:
            logger.error(f"Error in curation loop: {e}")

        # Wait before next curation cycle
        await asyncio.sleep(60)
