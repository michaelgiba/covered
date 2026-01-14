"""
Processing loop's primary function is to accept topics which do not have playback
content yet and create playback objects for them.
"""

import asyncio
import os
import logging
from typing import Dict

from covered.config import PLAYBACK_DIR, MEDIA_DIR, BASE_URL
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
    import uuid

    playback_id = str(uuid.uuid4())
    playback_dir = os.path.join(MEDIA_DIR, playback_id)
    os.makedirs(playback_dir, exist_ok=True)

    # 2. Get snapshot and content
    snapshot_filename, raw_content = await asyncio.to_thread(
        headless_service.get_snapshot_and_content,
        topic.processed_input.extracted_link,
        topic.id,
        output_dir=playback_dir,
    )

    # 3. Make a script
    script_text = await asyncio.to_thread(_script_ops.polish, raw_content)

    # 4. Convert to audio
    m4a_filename, transcript_json, _ = await generate_audio_and_transcript(
        tts_service,
        script_text,
        topic.id,
        output_dir=playback_dir,
        playback_id=playback_id,
    )

    # 5. Save script/transcript JSON
    script_content = {"transcript": transcript_json, "text": script_text}
    script_filename = "script.json"
    script_path = os.path.join(playback_dir, script_filename)
    with open(script_path, "w") as f:
        import json

        json.dump(script_content, f)

    # Construct URLs (Assuming web server serves /data/playback-content/media/)
    snapshot_url = (
        f"{BASE_URL}/data/playback-content/media/{playback_id}/{snapshot_filename}"
    )
    audio_url = f"{BASE_URL}/data/playback-content/media/{playback_id}/{m4a_filename}"
    script_json_url = (
        f"{BASE_URL}/data/playback-content/media/{playback_id}/{script_filename}"
    )

    playback_content = PlaybackContent(
        id=playback_id,
        processed_input_id=topic.id,
        page_snapshot_url=snapshot_url,
        script_json_url=script_json_url,
        m4a_file_url=audio_url,
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
