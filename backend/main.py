import argparse
import os
import json
import time
import subprocess
import shutil
from services.email import EmailService
from services.script_writing import ScriptWritingService
from services.tts import TTSService
from models.data import Topic

# Determine absolute paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.abspath(os.path.join(BASE_DIR, "../data"))
AUDIO_DIR = os.path.join(DATA_DIR, "audio")
SEGMENTS_DIR = os.path.join(DATA_DIR, "segments")
FEED_DIR = os.path.abspath(os.path.join(BASE_DIR, "../frontend/public/data/feed"))

def ensure_directories():
    os.makedirs(DATA_DIR, exist_ok=True)
    os.makedirs(AUDIO_DIR, exist_ok=True)
    os.makedirs(SEGMENTS_DIR, exist_ok=True)
    os.makedirs(FEED_DIR, exist_ok=True)

def curate_command(args):
    ensure_directories()
    print("1. Generating Mock Emails...")
    email_service = EmailService()
    emails = email_service.generate_mock_emails(50)
    
    print("2. Processing Emails (FIFO)...")
    # Sort emails by timestamp (oldest first)
    emails.sort(key=lambda x: x.timestamp)
    
    topics = []
    for email in emails:
        topics.append(Topic(
            id=email.id,
            title=email.subject,
            context=email.body,
            sender=email.sender
        ))

    # Save topics
    # Note: This currently overwrites topics.json. 
    # If the intention is to append, we should load existing first.
    # But per current logic, it seems to be a fresh fetch.
    with open(os.path.join(DATA_DIR, "topics.json"), "w") as f:
        json.dump([t.model_dump() for t in topics], f, indent=2)
        
    print(f"Saved {len(topics)} topics to data/topics.json")

def broadcast_command(args):
    ensure_directories()
    
    # Load topics
    topics_path = os.path.join(DATA_DIR, "topics.json")
    if not os.path.exists(topics_path):
        print("No topics found. Run 'curate' first.")
        return

    with open(topics_path, "r") as f:
        topics_data = json.load(f)
        topics = [Topic(**t) for t in topics_data]

    if not topics:
        print("No topics available.")
        return

    # Load processed topics
    processed_path = os.path.join(DATA_DIR, "processed_topics.json")
    processed_ids = set()
    if os.path.exists(processed_path):
        with open(processed_path, "r") as f:
            processed_ids = set(json.load(f))

    # Select next unprocessed topic (FIFO)
    top_topic = next((t for t in topics if t.id not in processed_ids), None)
    
    if not top_topic:
        print("No new topics to process.")
        return
    
    print(f"Processing Topic: {top_topic.title}")
    
    # Generate Script
    script_writing_service = ScriptWritingService()
    script_text = script_writing_service.generate_script(top_topic.title, top_topic.context)

    # Generate Audio
    print("Generating Audio...")
    tts_service = TTSService()
    audio_filename = f"{top_topic.id}.wav"
    audio_path = os.path.join(AUDIO_DIR, audio_filename)
    tts_result = tts_service.generate_audio(script_text, audio_path)
    duration = tts_result["duration"]
    
    # Generate HLS Segments for this topic
    print(f"Generating segments for {top_topic.id}...")
    
    # We generate to a temporary playlist first
    timestamp = int(time.time())
    temp_playlist_path = os.path.join(FEED_DIR, f"temp_{top_topic.id}.m3u8")
    segment_filename_pattern = os.path.join(FEED_DIR, f"{timestamp}_{top_topic.id}_%03d.m4a")
    
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
    except subprocess.CalledProcessError as e:
        print(f"Error generating HLS: {e}")
        print(e.stderr.decode())
        return

    # Now we merge this into the master stream.m3u8
    master_playlist_path = os.path.join(FEED_DIR, "stream.m3u8")
    
    # 1. Parse Temp Playlist to get new segments
    new_segments = []
    with open(temp_playlist_path, "r") as f:
        lines = f.readlines()
        for i, line in enumerate(lines):
            if line.startswith("#EXTINF:"):
                # The next line is the filename
                # We need to extract just the basename because the master playlist 
                # should reference files relative to itself (in the same dir)
                # We also inject the Topic ID into the title field of EXTINF
                # Format: #EXTINF:duration,title
                # We will make it: #EXTINF:duration,ID:{id}
                
                parts = line.strip().split(",")
                duration_part = parts[0]
                # We ignore any existing title and force our ID
                inf_line = f"{duration_part},ID:{top_topic.id}"
                
                file_line = lines[i+1].strip()
                filename = os.path.basename(file_line)
                new_segments.append((inf_line, filename))

    # 2. Read Master Playlist (if exists)
    current_sequence = 0
    existing_segments = []
    
    if os.path.exists(master_playlist_path):
        with open(master_playlist_path, "r") as f:
            lines = f.readlines()
            for line in lines:
                if line.startswith("#EXT-X-MEDIA-SEQUENCE:"):
                    current_sequence = int(line.split(":")[1].strip())
                elif line.startswith("#EXTINF:") or line.startswith("#EXT-X-DISCONTINUITY"):
                    # We store the line as is. If it's EXTINF, we expect next line to be file.
                    # But to simplify sliding window, let's store structured data.
                    # Actually, we just need to preserve the lines.
                    pass
            
            # Re-parsing for structured list to handle sliding window
            # Structure: {'type': 'segment'|'discontinuity', 'lines': [...]}
            i = 0
            while i < len(lines):
                line = lines[i].strip()
                if line.startswith("#EXTINF:"):
                    existing_segments.append({
                        'type': 'segment',
                        'lines': [line, lines[i+1].strip()]
                    })
                    i += 2
                elif line.startswith("#EXT-X-DISCONTINUITY"):
                    existing_segments.append({
                        'type': 'discontinuity',
                        'lines': [line]
                    })
                    i += 1
                else:
                    i += 1

    # 3. Add discontinuity before the new batch
    if existing_segments:
        existing_segments.append({'type': 'discontinuity', 'lines': ["#EXT-X-DISCONTINUITY"]})

    # Cleanup temp playlist
    os.remove(temp_playlist_path)

    # Update processed topics immediately
    processed_ids.add(top_topic.id)
    with open(processed_path, "w") as f:
        json.dump(list(processed_ids), f, indent=2)

    # 4. Real-time publishing: add segments one at a time with delay
    print(f"Broadcasting {len(new_segments)} segments in real-time...")
    
    for i, (inf, filename) in enumerate(new_segments):
        # Add this segment
        existing_segments.append({
            'type': 'segment',
            'lines': [inf, filename]
        })
        
        # Write updated playlist
        with open(master_playlist_path, "w") as f:
            f.write("#EXTM3U\n")
            f.write("#EXT-X-VERSION:3\n")
            f.write("#EXT-X-TARGETDURATION:5\n")
            f.write(f"#EXT-X-MEDIA-SEQUENCE:{current_sequence}\n")
            for item in existing_segments:
                for line in item['lines']:
                    f.write(f"{line}\n")
        
        # Extract segment duration from EXTINF line (format: "#EXTINF:4.123456,ID:...")
        segment_duration = float(inf.split(":")[1].split(",")[0])
        print(f"  Segment {i+1}/{len(new_segments)}: {filename} ({segment_duration:.2f}s)")
        
        # Wait before publishing next segment
        # Publish next segment 2s early so frontend can fetch/decode before current ends
        if i < len(new_segments) - 1:
            wait_time = max(0, segment_duration - 2.0)
            time.sleep(wait_time)
    
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
