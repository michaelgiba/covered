import asyncio
import contextlib
import os
import tempfile
import uuid
from typing import Dict, Tuple
import json

from covered.config import MEDIA_DIR
from covered.utils.audio import convert_to_m4a
from covered.utils.tts import TTSService
from covered.utils.transcription import TranscriptionService


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
    tts_service: TTSService,
    transcription_service: TranscriptionService,
    script_text: str,
    topic_id: str,
    output_dir: str,
) -> Tuple[str, Dict]:
    m4a_filename = "audio.m4a"
    os.makedirs(output_dir, exist_ok=True)
    m4a_path = os.path.join(output_dir, m4a_filename)

    with temporary_wav_file(suffix=f"_{topic_id}.wav") as wav_path:
        await asyncio.to_thread(tts_service.generate_audio, script_text, wav_path)
        await asyncio.to_thread(convert_to_m4a, wav_path, m4a_path)

    # Step 4: Generate Transcript JSON using WhisperX
    transcript_json = await asyncio.to_thread(transcription_service.transcribe, m4a_path)

    script_content = {"transcript": transcript_json, "text": script_text}
    script_filename = "script.json"
    script_path = os.path.join(output_dir, script_filename)
    with open(script_path, "w") as f:
        json.dump(script_content, f)

    return m4a_path, script_path
