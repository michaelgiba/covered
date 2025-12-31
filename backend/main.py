import argparse
import os
import json
import time
import subprocess
import shutil
import m3u8
import contextlib
import tempfile
from services.script_writing import ScriptWritingService
from services.tts import TTSService
from services.topic_service import TopicService
from models.data import Topic

# Determine absolute paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.abspath(os.path.join(BASE_DIR, "../data"))
FEED_DIR = os.path.abspath(os.path.join(BASE_DIR, "../frontend/public/data/feed"))

def ensure_directories():
    os.makedirs(DATA_DIR, exist_ok=True)
    os.makedirs(FEED_DIR, exist_ok=True)

def curate_command(args):
    ensure_directories()
    print("1. Generating and Curating Topics...")
    topic_service = TopicService()
    topics = topic_service.curate_from_emails(3)
        
    print(f"Saved {len(topics)} topics to data/topics_on_deck.json")


@contextlib.contextmanager
def generate_audio_context(topic: Topic):
    with tempfile.TemporaryDirectory() as temp_dir:
        # Generate Script
        script_writing_service = ScriptWritingService()
        script_text = script_writing_service.generate_script(topic.title, topic.context)

        # Generate Audio
        print("Generating Audio...")
        tts_service = TTSService()
        audio_filename = f"{topic.id}.wav"
        audio_path = os.path.join(temp_dir, audio_filename)
        tts_result = tts_service.generate_audio(script_text, audio_path)
        duration = tts_result["duration"]
        
        yield script_text, audio_path, duration


@contextlib.contextmanager
def generate_hls_context(topic: Topic, audio_path: str):
    with tempfile.TemporaryDirectory() as temp_dir:
        timestamp = int(time.time())
        temp_playlist_path = os.path.join(temp_dir, f"temp_{topic.id}.m3u8")
        segment_filename_pattern = os.path.join(temp_dir, f"{timestamp}_{topic.id}_%03d.m4a")    
        
        cmd = [
            "ffmpeg",
            "-y",
            "-i", audio_path,
            "-c:a", "aac",
            "-b:a", "128k",
            "-f", "segment",
            "-segment_time", "10",
            "-segment_list", temp_playlist_path,
            "-segment_list_type", "m3u8",
            "-segment_format", "mp4",
            segment_filename_pattern
        ]
        
        try:
            subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            yield temp_playlist_path
        except subprocess.CalledProcessError as e:
            print(f"Error generating HLS: {e}")
            print(e.stderr.decode())
            raise e


def merge_and_broadcast(temp_playlist_path, master_playlist_path, topic_id):
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
    print(f"Broadcasting {len(new_segments)} segments in real-time...")
    
    for i, segment in enumerate(new_segments):
        # Move segment file from temp dir to FEED_DIR
        temp_segment_path = os.path.join(os.path.dirname(temp_playlist_path), segment.uri)
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
            
        print(f"  Segment {i+1}/{len(new_segments)}: {segment.uri} ({segment.duration:.2f}s)")
        
        # Wait before publishing next segment
        if i < len(new_segments) - 1:
            wait_time = max(0, segment.duration - 2.0)
            time.sleep(wait_time)
            

def broadcast_command(args):
    ensure_directories()
    
    topic_service = TopicService()
    available_topics = topic_service.get_available_topics()
    
    if not available_topics:
        print("No new topics to process.")
        return
    
    top_topic = available_topics[0]
    
    print(f"Processing Topic: {top_topic.title}")


    with generate_audio_context(top_topic) as (script_text, audio_path, duration):
        # Now we merge this into the master stream.m3u8
        master_playlist_path = os.path.join(FEED_DIR, "stream.m3u8")
        
        with generate_hls_context(top_topic, audio_path) as temp_playlist_path:
            # Mark topic as active
            topic_service.mark_topic_active(top_topic.id)

            merge_and_broadcast(temp_playlist_path, master_playlist_path, top_topic.id)
            
            # Mark topic as processed (removes from on deck)
            topic_service.mark_topics_processed([top_topic.id])
    
    print("Broadcast complete.")

def main():
    parser = argparse.ArgumentParser(description="Covered Backend CLI")
    subparsers = parser.add_subparsers(dest="command", required=True)

    # Curate command
    curate_parser = subparsers.add_parser("curate", help="Curate topics from emails")
    curate_parser.set_defaults(func=curate_command)

    # Broadcast command
    broadcast_parser = subparsers.add_parser("broadcast", help="Process next topic and broadcast")
    broadcast_parser.set_defaults(func=broadcast_command)

    args = parser.parse_args()
    args.func(args)

if __name__ == "__main__":
    main()
