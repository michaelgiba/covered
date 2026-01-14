import asyncio
import contextlib
import os
import tempfile
import uuid
from typing import Dict, Tuple

from covered.config import MEDIA_DIR
from covered.utils.audio import convert_to_m4a
from covered.utils.tts import TTSService


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
    script_text: str,
    topic_id: str,
    output_dir: str = None,
    playback_id: str = None,
) -> Tuple[str, Dict, str]:
    if not playback_id:
        playback_id = str(uuid.uuid4())

    m4a_filename = "audio.m4a" if output_dir else f"{playback_id}.m4a"

    if output_dir:
        os.makedirs(output_dir, exist_ok=True)
        m4a_path = os.path.join(output_dir, m4a_filename)
    else:
        os.makedirs(MEDIA_DIR, exist_ok=True)
        m4a_path = os.path.join(MEDIA_DIR, m4a_filename)

    with temporary_wav_file(suffix=f"_{topic_id}.wav") as wav_path:
        await asyncio.to_thread(tts_service.generate_audio, script_text, wav_path)
        await asyncio.to_thread(convert_to_m4a, wav_path, m4a_path)

    # Step 4: Generate Transcript JSON (Estimate timestamps)
    words = script_text.split()
    # Assuming ~150 wpm = 2.5 words per second -> 0.4s per word
    transcript_json = {"words": []}
    current_time = 0.0
    word_duration = 0.4
    for w in words:
        transcript_json["words"].append(
            {"word": w, "start": current_time, "end": current_time + word_duration}
        )
        current_time += word_duration

    return m4a_filename, transcript_json, playback_id
