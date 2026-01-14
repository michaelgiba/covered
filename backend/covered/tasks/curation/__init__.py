"""
The primary purpose of the curation task is to convert data from messy
sources into new Topic objects that are stored in the database.

These do not have playback content at this point.
"""

import logging
import asyncio
from covered.models.database import Database
from ._email import EmailService
from covered.config import DATA_DIR
import os

logger = logging.getLogger("CURATION")


def curate_step():
    # Ensure data dir exists (handled by services, but good to have)
    os.makedirs(DATA_DIR, exist_ok=True)

    logger.info("1. Fetching and Curating Emails...")
    email_service = EmailService()
    db = Database()

    new_inputs = email_service.fetch_new()

    if new_inputs:
        logger.info(f"Found {len(new_inputs)} new inputs. Storing...")
        for p_input in new_inputs:
            db.upsert_processed_input(p_input)
        logger.info(f"Stored {len(new_inputs)} new processed inputs.")
    else:
        logger.info("No new emails found.")


async def curation_loop():
    logger.info("Starting Curation Loop...")
    while True:
        try:
            # Run blocking curation in a separate thread
            await asyncio.to_thread(curate_step)
        except Exception as e:
            logger.error(f"Error in curation loop: {e}", exc_info=True)

        # Wait before next curation cycle
        await asyncio.sleep(60)
