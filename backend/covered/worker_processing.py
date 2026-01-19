import asyncio
import contextlib
import json
import logging
import os
import tempfile
import time
import uuid
from functools import cache
from typing import Any, Dict, Tuple

import requests

from covered.config import (
    BASE_URL,
    GEMINI_API_KEY,
    MEDIA_DIR,
    ROOT_DIR,
    configure_logging,
)
from covered.models.data import PlaybackContent, ProcessedInput, ScriptOutput
from covered.utils.queue import QueueService
from covered.utils.audio import convert_to_m4a
from covered.utils.gemini_tts import generate_audio_gemini
from covered.utils.headless_browser import HeadlessBrowserService
from covered.utils.llm import LLMService
from covered.utils.transcription import TranscriptionService

configure_logging()
logger = logging.getLogger("PROCESSING_WORKER")


@contextlib.contextmanager
def temporary_wav_file(suffix: str):
    """Context manager for creating and cleaning up a temporary wav file."""
    fd, path = tempfile.mkstemp(suffix=suffix)
    os.close(fd)
    try:
        yield path
    finally:
        if os.path.exists(path):
            os.remove(path)


async def generate_audio_and_transcript(
    transcription_service: TranscriptionService,
    script_text: str,
    topic_id: str,
    output_dir: str,
) -> Tuple[str, Dict]:
    m4a_filename = "audio.m4a"
    os.makedirs(output_dir, exist_ok=True)
    m4a_path = os.path.join(output_dir, m4a_filename)

    with temporary_wav_file(suffix=f"_{topic_id}.wav") as wav_path:
        await asyncio.to_thread(generate_audio_gemini, script_text, wav_path, GEMINI_API_KEY)
        await asyncio.to_thread(convert_to_m4a, wav_path, m4a_path)

    # Generate Transcript JSON using WhisperX
    transcript_json = await asyncio.to_thread(transcription_service.transcribe, m4a_path)

    script_content = {"transcript": transcript_json, "text": script_text}
    script_filename = "script.json"
    script_path = os.path.join(output_dir, script_filename)
    with open(script_path, "w") as f:
        json.dump(script_content, f)

    return m4a_path, script_path


@cache
def _get_llm_service():
    return LLMService()


def polish_script(text: str) -> str:
    # Convert parts to a string representation for the LLM
    transcript_parts = [{"speaker": "main", "content": text}]
    transcript_str = "\n\n".join(
        [f"Speaker ({p['speaker']}):\n{p['content']}" for p in transcript_parts]
    )

    prompt = f"""
    You are being presented with a transcript that is intended to be read aloud to an audience.
    Your task is to take the transcript and do the minimal amount of editing to make it flow naturally as a monologue.
    You should not add an intro or outro, summarize, or change ANYTHING in the substance of the transcript.

    You may make the following changes:
    - Add punctuation to guide natural pausing and intonation.
    - Add minor transitions between segments only if necessary.
    - Correct obvious typos or errors.        
    
    Here is the transcript:
    {transcript_str}

    Respond only with the polished transcript no additional text.
    """
    result = _get_llm_service().prompt_without_search(prompt, ScriptOutput)
    return result.script


async def process_topic(processed_input: ProcessedInput, services: Dict) -> PlaybackContent:
    """Orchestrates the processing of a single topic."""
    logger.info(f"Processing topic: {processed_input.title} ({processed_input.id})")

    headless_service = services["headless"]
    transcription_service = services['transcription']

    # 1. Generate Playback ID and Directory
    logger.info("1. Generating Playback ID and Directory...")
    playback_id = str(uuid.uuid4())
    playback_dir = os.path.join(MEDIA_DIR, playback_id)
    os.makedirs(playback_dir, exist_ok=True)

    # 2. Get snapshot and content
    logger.info("2. Fetching snapshot and content...")
    page_content = await asyncio.to_thread(
        headless_service.get_snapshot_and_content,
        processed_input.extracted_link,
        processed_input.id,
        output_dir=playback_dir,
    )
    
    snapshot_url = page_content.snapshot_path
    raw_content = page_content.extracted_text

    # 3. Make a script
    logger.info("3. Polishing script...")
    script_text = await asyncio.to_thread(polish_script, raw_content)

    # 4. Convert to audio
    logger.info("4. Generating audio and transcript...")
    audio_url, script_json_url = await generate_audio_and_transcript(
        transcription_service=transcription_service,
        script_text=script_text,
        topic_id=processed_input.id,
        output_dir=playback_dir,
    )

    logger.info("5. Saving PlaybackContent...")
    playback_content = PlaybackContent(
        id=playback_id,
        processed_input_id=processed_input.id,
        page_snapshot_url=os.path.join(BASE_URL, os.path.relpath(snapshot_url, ROOT_DIR)),
        thumbnail_url=os.path.join(BASE_URL, os.path.relpath(page_content.thumbnail_path, ROOT_DIR)) if page_content.thumbnail_path else None,
        script_json_url=os.path.join(BASE_URL, os.path.relpath(script_json_url, ROOT_DIR)),
        m4a_file_url=os.path.join(BASE_URL, os.path.relpath(audio_url, ROOT_DIR)),
    )

    logger.info(f"Completed processing for {processed_input.id}")
    return playback_content


async def processing_loop():
    logger.info("Starting Processing Loop...")
    queue = QueueService()

    # Instantiate services once
    services = {
        "headless": HeadlessBrowserService(MEDIA_DIR),
        "transcription": TranscriptionService()
    }

    while True:
        try:
            input_id = queue.pop()
            
            if not input_id:
                await asyncio.sleep(5)
                continue
            
            logger.info(f"Picked up input {input_id} from queue.")
            
            # Fetch ProcessedInput from API
            resp = requests.get(f"{BASE_URL}/processed-inputs/{input_id}")
            if resp.status_code == 404:
                logger.error(f"Input {input_id} not found in API.")
                continue
            resp.raise_for_status()
            
            p_input = ProcessedInput(**resp.json())

            playback_content = await process_topic(p_input, services)
            
            # Post PlaybackContent to API
            resp = requests.post(f"{BASE_URL}/playback-contents", json=playback_content.model_dump())
            resp.raise_for_status()
            
        except Exception as e:
            logger.error(f"Error in processing loop: {e}", exc_info=True)
            await asyncio.sleep(5)  # Backoff on error


def main():
    logger.info("Starting Processing Worker")
    try:
        asyncio.run(processing_loop())
    except KeyboardInterrupt:
        logger.info("Processing Worker stopped by user.")
    except Exception as e:
        logger.critical(f"Processing Worker crashed: {e}", exc_info=True)

if __name__ == "__main__":
    main()
