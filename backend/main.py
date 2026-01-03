import argparse
import os
import json
import time
import subprocess
import contextlib
import tempfile
import asyncio
import logging
import uuid
import aiohttp_cors
from aiohttp import web
from services.script_writing import ScriptWritingService
from services.tts import TTSService
from services.topic_service import TopicService
from models.data import Topic, PlaybackContent

# Configure Logging
logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] [%(name)s] %(message)s",
    datefmt="%H:%M:%S",
)

curator_logger = logging.getLogger("CURATOR")
audio_gen_logger = logging.getLogger("AUDIO_GEN")
system_logger = logging.getLogger("SYSTEM")

# Determine absolute paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.abspath(os.path.join(BASE_DIR, "../data"))
PLAYBACK_DIR = os.path.join(DATA_DIR, "playback_content")


def ensure_directories():
    os.makedirs(DATA_DIR, exist_ok=True)
    os.makedirs(PLAYBACK_DIR, exist_ok=True)


def curate_step():
    ensure_directories()
    curator_logger.info("1. Generating and Curating Topics...")
    topic_service = TopicService()
    topics = topic_service.curate_from_emails(3)

    curator_logger.info(f"Saved {len(topics)} topics to data/topics.json")


def generate_audio_file(topic: Topic) -> tuple[str, str]:
    """
    Generates audio for a topic and returns (script_text, audio_path).
    The caller is responsible for deleting the audio_path file.
    """
    # Generate Script
    script_writing_service = ScriptWritingService()

    sender_info = (
        f"Sender: {topic.sender}\n" if topic.sender else "Sender: Anonymous Listener\n"
    )
    email_content = f"{sender_info}Subject: {topic.title}\nBody: {topic.context}"

    script_text = script_writing_service.generate_script(email_content)

    # Generate Audio
    audio_gen_logger.info(f"Generating Audio for topic: {topic.title}")
    tts_service = TTSService()

    # Create a temp file that persists until explicitly deleted
    fd, audio_path = tempfile.mkstemp(suffix=f"_{topic.id}.wav")
    os.close(fd)

    try:
        tts_service.generate_audio(script_text, audio_path)
        return script_text, audio_path
    except Exception as e:
        # Clean up if generation fails
        if os.path.exists(audio_path):
            os.remove(audio_path)
        raise e


def convert_to_m4a(wav_path: str, output_path: str):
    cmd = [
        "ffmpeg",
        "-y",
        "-i",
        wav_path,
        "-c:a",
        "aac",
        "-b:a",
        "128k",
        "-movflags",
        "+faststart",
        output_path,
    ]
    subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)


async def processing_loop(processing_ids: set):
    system_logger.info("Starting Processing Loop...")
    topic_service = TopicService()

    while True:
        # Get available topics
        available_topics = topic_service.get_available_topics()

        # Filter out topics already being processed
        candidates = [t for t in available_topics if t.id not in processing_ids]

        if not candidates:
            await asyncio.sleep(5)
            continue

        topic = candidates[0]
        processing_ids.add(topic.id)

        try:
            # Generate audio (blocking operation in thread)
            audio_gen_logger.info(f"Processing {topic.title}")

            script_text, wav_path = await asyncio.to_thread(generate_audio_file, topic)

            # Generate Playback ID and paths
            playback_id = str(uuid.uuid4())
            m4a_filename = f"{playback_id}.m4a"
            m4a_path = os.path.join(PLAYBACK_DIR, m4a_filename)
            json_path = os.path.join(PLAYBACK_DIR, f"{playback_id}.json")

            # Convert to m4a
            await asyncio.to_thread(convert_to_m4a, wav_path, m4a_path)

            # Create PlaybackContent
            # URL should be relative or absolute?
            # "m4a_file_url: str # the URL of where to find the m4a file"
            # Since we serve /data, the URL should be /data/playback_content/{filename}
            playback_content = PlaybackContent(
                id=playback_id,
                m4a_file_url=f"http://192.168.1.23:3000/data/playback_content/{m4a_filename}",
            )

            # Update Topic
            topic_service.update_topic_playback(topic.id, playback_content)

            # Cleanup wav
            if os.path.exists(wav_path):
                os.remove(wav_path)

            audio_gen_logger.info(f"Completed processing for {topic.title}")

        except Exception as e:
            audio_gen_logger.error(f"Error processing topic {topic.id}: {e}")
        finally:
            processing_ids.remove(topic.id)


async def start_server():
    app = web.Application()

    # Configure CORS
    cors = aiohttp_cors.setup(
        app,
        defaults={
            "*": aiohttp_cors.ResourceOptions(
                allow_credentials=True,
                expose_headers="*",
                allow_headers="*",
            )
        },
    )

    # Serve DATA_DIR at /data
    # Ensure directory exists
    os.makedirs(DATA_DIR, exist_ok=True)
    
    # Add static route
    resource = app.router.add_static("/data", DATA_DIR)
    
    # Add CORS to the static resource
    cors.add(resource)

    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, "0.0.0.0", 8000)
    await site.start()
    system_logger.info("HTTP Server started at http://0.0.0.0:8000/data")
    return runner


async def curation_loop():
    system_logger.info("Starting Curation Loop...")
    while True:
        try:
            # Run blocking curation in a separate thread
            await asyncio.to_thread(curate_step)
        except Exception as e:
            curator_logger.error(f"Error in curation loop: {e}")

        # Wait before next curation cycle (e.g., 60 seconds)
        await asyncio.sleep(60)


async def run_loop(min_duration: int | None):
    start_time = time.time()

    # Shared state
    processing_ids = set()

    # Create tasks
    curation_task = asyncio.create_task(curation_loop())
    processing_task = asyncio.create_task(processing_loop(processing_ids))
    
    # Start Server
    server_runner = await start_server()

    tasks = [curation_task, processing_task]

    try:
        if min_duration is not None:
            while True:
                elapsed = time.time() - start_time
                if elapsed >= min_duration:
                    system_logger.info(
                        f"Minimum duration of {min_duration}s reached. Exiting."
                    )
                    break
                await asyncio.sleep(1)

            # Cancel tasks
            for task in tasks:
                task.cancel()
            await asyncio.gather(*tasks, return_exceptions=True)

        else:
            # Run forever
            await asyncio.gather(*tasks)

    except asyncio.CancelledError:
        system_logger.info("Tasks cancelled.")
    except Exception as e:
        system_logger.error(f"Error in run_loop: {e}")


def main():
    parser = argparse.ArgumentParser(description="Covered Backend CLI")
    parser.add_argument(
        "--duration",
        type=int,
        default=None,
        help="Minimum duration to run in seconds. If not specified, runs forever.",
    )

    args = parser.parse_args()

    try:
        asyncio.run(run_loop(args.duration))
    except KeyboardInterrupt:
        system_logger.info("\nStopped by user.")


if __name__ == "__main__":
    main()
