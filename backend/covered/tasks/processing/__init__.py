"""
Processing loop's primary function is to accept topics which do not have playback
content yet and create playback objects for them.
"""

import asyncio
import os
import uuid
import logging
from typing import Dict

from covered.config import PLAYBACK_DIR, MEDIA_DIR, BASE_URL, DATA_DIR, ROOT_DIR
from covered.models.data import PlaybackContent
from covered.models.database import Database
from covered.utils.headless_browser import HeadlessBrowserService
from covered.utils.tts import TTSService
from covered.tasks.processing._playback import generate_audio_and_transcript
from covered.tasks.processing import _script_ops

logger = logging.getLogger("PROCESSING")


async def process_topic(topic, services: Dict) -> PlaybackContent:
    """Orchestrates the processing of a single topic."""
    logger.info(f"Processing topic: {topic.processed_input.title} ({topic.id})")

    headless_service = services["headless"]
    tts_service = services["tts"]

    # 1. Generate Playback ID and Directory

    playback_id = str(uuid.uuid4())
    playback_dir = os.path.join(MEDIA_DIR, playback_id)
    os.makedirs(playback_dir, exist_ok=True)

    # 2. Get snapshot and content
    snapshot_url, raw_content = await asyncio.to_thread(
        headless_service.get_snapshot_and_content,
        topic.processed_input.extracted_link,
        topic.id,
        output_dir=playback_dir,
    )

    # 3. Make a script
    script_text = await asyncio.to_thread(_script_ops.polish, raw_content)

    # 4. Convert to audio
    audio_url, script_json_url = await generate_audio_and_transcript(
        tts_service,
        script_text,
        topic.id,
        output_dir=playback_dir,
    )

    playback_content = PlaybackContent(
        id=playback_id,
        processed_input_id=topic.id,
        page_snapshot_url=os.path.join(BASE_URL, os.path.relpath(snapshot_url, ROOT_DIR)),
        script_json_url=os.path.join(BASE_URL, os.path.relpath(script_json_url, ROOT_DIR)),
        m4a_file_url=os.path.join(BASE_URL, os.path.relpath(audio_url, ROOT_DIR)),
    )

    logger.info(f"Completed processing for {topic.id}")
    return playback_content


async def processing_loop():
    logger.info("Starting Processing Loop...")
    db = Database()

    # Instantiate services once
    services = {"headless": HeadlessBrowserService(MEDIA_DIR), "tts": TTSService()}

    while True:
        topics_without_playback_content = db.get_topics_without_playback_content()

        if not topics_without_playback_content:
            await asyncio.sleep(5)
            continue

        topic = topics_without_playback_content[0]

        try:
            playback_content = await process_topic(topic, services)
            db.upsert_topic_playback(topic.id, playback_content)
        except Exception as e:
            logger.error(f"Error processing topic {topic.id}: {e}", exc_info=True)
            await asyncio.sleep(5)  # Backoff on error
