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
from covered.tasks.curation._service import TopicService
from covered.utils.headless_browser import HeadlessBrowserService
from covered.utils.tts import TTSService
from covered.tasks.processing._playback import generate_audio_and_transcript
from covered.tasks.processing import _script_ops

logger = logging.getLogger("PROCESSING")

async def process_topic(topic, services: Dict) -> PlaybackContent:
    """Orchestrates the processing of a single topic."""
    logger.info(f"Processing topic: {topic.processed_input.title} ({topic.id})")
    
    headless_service = services['headless']
    tts_service = services['tts']

    # Get snapshot and content
    snapshot_filename, raw_content = await asyncio.to_thread(
        headless_service.get_snapshot_and_content, topic.processed_input.extracted_link, topic.id
    )

    # Make a script
    script_text = await asyncio.to_thread(_script_ops.polish, raw_content)
    # Convert to audio 
    m4a_filename, transcript_json, playback_id = await generate_audio_and_transcript(tts_service, script_text, topic.id)
    
    # Save script/transcript JSON
    script_content = {
        "transcript": transcript_json,
        "text": script_text
    }
    script_filename = f"{playback_id}_script.json"
    os.makedirs(MEDIA_DIR, exist_ok=True)
    script_path = os.path.join(MEDIA_DIR, script_filename)
    with open(script_path, "w") as f:
        import json
        json.dump(script_content, f)

    # Construct URLs
    snapshot_url = f"{BASE_URL}/data/playback-content/media/{snapshot_filename}"
    audio_url = f"{BASE_URL}/data/playback-content/media/{m4a_filename}"
    script_json_url = f"{BASE_URL}/data/playback-content/media/{script_filename}"
    
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
    topic_service = TopicService()
    
    # Instantiate services once
    services = {
        'headless': HeadlessBrowserService(MEDIA_DIR),
        'tts': TTSService()
    }

    while True:
        topics_without_playback_content = topic_service.get_topics_without_playback_content()
        
        if not topics_without_playback_content:
            await asyncio.sleep(5)
            continue

        topic = topics_without_playback_content[0]

        try:
            playback_content = await process_topic(topic, services)
            topic_service.update_topic_playback(topic.id, playback_content)
        except Exception as e:
            logger.error(f"Error processing topic {topic.id}: {e}", exc_info=True)
            await asyncio.sleep(5) # Backoff on error
