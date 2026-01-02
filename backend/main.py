import argparse
import os
import json
import time
import subprocess
import shutil
import m3u8
import contextlib
import tempfile
import asyncio
import logging
from services.script_writing import ScriptWritingService
from services.tts import TTSService
from services.topic_service import TopicService
from models.data import Topic

# Configure Logging
logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] [%(name)s] %(message)s",
    datefmt="%H:%M:%S",
)

curator_logger = logging.getLogger("CURATOR")
audio_gen_logger = logging.getLogger("AUDIO_GEN")
broadcaster_logger = logging.getLogger("BROADCAST")
system_logger = logging.getLogger("SYSTEM")

# Determine absolute paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.abspath(os.path.join(BASE_DIR, "../data"))
FEED_DIR = os.path.abspath(os.path.join(BASE_DIR, "../frontend/public/data/feed"))


def ensure_directories():
    os.makedirs(DATA_DIR, exist_ok=True)
    os.makedirs(FEED_DIR, exist_ok=True)


def curate_step():
    ensure_directories()
    curator_logger.info("1. Generating and Curating Topics...")
    topic_service = TopicService()
    topics = topic_service.curate_from_emails(3)

    curator_logger.info(f"Saved {len(topics)} topics to data/topics_on_deck.json")


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


@contextlib.contextmanager
def generate_hls_context(topic: Topic, audio_path: str):
    with tempfile.TemporaryDirectory() as temp_dir:
        timestamp = int(time.time())
        temp_playlist_path = os.path.join(temp_dir, f"temp_{topic.id}.m3u8")
        segment_filename_pattern = os.path.join(
            temp_dir, f"{timestamp}_{topic.id}_%03d.m4a"
        )

        cmd = [
            "ffmpeg",
            "-y",
            "-i",
            audio_path,
            "-c:a",
            "aac",
            "-b:a",
            "128k",
            "-f",
            "segment",
            "-segment_time",
            "10",
            "-segment_list",
            temp_playlist_path,
            "-segment_list_type",
            "m3u8",
            "-segment_format",
            "mp4",
            segment_filename_pattern,
        ]

        subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        yield temp_playlist_path


async def merge_and_broadcast(temp_playlist_path, master_playlist_path, topic_id):
    # 1. Parse Temp Playlist
    temp_m3u8 = m3u8.load(temp_playlist_path)

    # 2. Load or Initialize Master Playlist
    if os.path.exists(master_playlist_path):
        master_m3u8 = m3u8.load(master_playlist_path)
    else:
        master_m3u8 = m3u8.M3U8()
        master_m3u8.version = 3
        master_m3u8.target_duration = 5
        master_m3u8.media_sequence = 0

    # 3. Prepare new segments
    new_segments = temp_m3u8.segments

    # Handle Discontinuity: If master has segments, the first new segment is a discontinuity
    if master_m3u8.segments:
        new_segments[0].discontinuity = True

    # 4. Real-time publishing
    broadcaster_logger.info(
        f"Broadcasting {len(new_segments)} segments in real-time..."
    )

    for i, segment in enumerate(new_segments):
        # Move segment file from temp dir to FEED_DIR
        temp_segment_path = os.path.join(
            os.path.dirname(temp_playlist_path), segment.uri
        )
        final_segment_filename = os.path.basename(segment.uri)
        final_segment_path = os.path.join(FEED_DIR, final_segment_filename)

        shutil.move(temp_segment_path, final_segment_path)

        # Update metadata
        # Ensure URI is relative (basename)
        segment.uri = final_segment_filename
        # Set Title to ID:{id}
        segment.title = f"ID:{topic_id}"

        # Add to master
        master_m3u8.segments.append(segment)

        # Update Target Duration if needed
        if segment.duration > master_m3u8.target_duration:
            master_m3u8.target_duration = int(segment.duration + 0.99)

        # Write updated playlist
        with open(master_playlist_path, "w") as f:
            f.write(master_m3u8.dumps())

        broadcaster_logger.info(
            f"  Segment {i + 1}/{len(new_segments)}: {segment.uri} ({segment.duration:.2f}s)"
        )

        # Wait before publishing next segment
        if i < len(new_segments) - 1:
            wait_time = max(0, segment.duration - 2.0)
            await asyncio.sleep(wait_time)


async def audio_generation_loop(queue: asyncio.Queue, processing_ids: set):
    system_logger.info("Starting Audio Generation Loop...")
    topic_service = TopicService()

    while True:
        # Check if queue is full
        if queue.full():
            await asyncio.sleep(1)
            continue

        # Get available topics
        available_topics = topic_service.get_available_topics()

        # Filter out topics already being processed
        candidates = [t for t in available_topics if t.id not in processing_ids]

        if not candidates:
            await asyncio.sleep(5)
            continue

        topic = candidates[0]
        processing_ids.add(topic.id)

        # Generate audio (blocking operation in thread)
        audio_gen_logger.info(f"Generating Audio for {topic.title}")

        script_text, audio_path = await asyncio.to_thread(generate_audio_file, topic)

        # Put into queue
        await queue.put((topic, script_text, audio_path))
        audio_gen_logger.info(
            f"Audio ready for {topic.title}. Queue size: {queue.qsize()}"
        )


async def publishing_loop(queue: asyncio.Queue, processing_ids: set):
    system_logger.info("Starting Publishing Loop...")
    topic_service = TopicService()

    while True:
        topic, script_text, audio_path = await queue.get()

        broadcaster_logger.info(f"Publishing Topic: {topic.title}")

        # Now we merge this into the master stream.m3u8
        master_playlist_path = os.path.join(FEED_DIR, "stream.m3u8")

        with generate_hls_context(topic, audio_path) as temp_playlist_path:
            # Mark topic as active
            topic_service.mark_topic_active(topic.id)

            await merge_and_broadcast(
                temp_playlist_path, master_playlist_path, topic.id
            )

            # Mark topic as processed (removes from on deck)
            topic_service.mark_topics_processed([topic.id])

        if os.path.exists(audio_path):
            os.remove(audio_path)

        # Remove from processing set
        if topic.id in processing_ids:
            processing_ids.remove(topic.id)

        queue.task_done()

        broadcaster_logger.info("Broadcast complete.")


async def curation_loop():
    system_logger.info("Starting Curation Loop...")
    while True:
        try:
            # Run blocking curation in a separate thread
            await asyncio.to_thread(curate_step)
        except Exception as e:
            curator_logger.error(f"Error in curation loop: {e}")

        # Wait before next curation cycle (e.g., 60 seconds)
        await asyncio.sleep(5)


async def run_loop(min_duration: int | None):
    start_time = time.time()

    # Shared state
    audio_queue = asyncio.Queue(maxsize=3)
    processing_ids = set()

    # Create tasks
    curation_task = asyncio.create_task(curation_loop())
    audio_gen_task = asyncio.create_task(
        audio_generation_loop(audio_queue, processing_ids)
    )
    publishing_task = asyncio.create_task(publishing_loop(audio_queue, processing_ids))

    tasks = [curation_task, audio_gen_task, publishing_task]

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
