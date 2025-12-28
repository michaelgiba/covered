import argparse
import os
import json
import uuid
from services.email import EmailService
from services.script_writing import ScriptWritingService
from services.tts import TTSService
from models.data import Topic, TopicList

# Determine absolute paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.abspath(os.path.join(BASE_DIR, "../data"))
AUDIO_DIR = os.path.join(DATA_DIR, "audio")
SEGMENTS_DIR = os.path.join(DATA_DIR, "segments")

def ensure_directories():
    os.makedirs(DATA_DIR, exist_ok=True)
    os.makedirs(AUDIO_DIR, exist_ok=True)
    os.makedirs(SEGMENTS_DIR, exist_ok=True)

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
    with open(os.path.join(DATA_DIR, "topics.json"), "w") as f:
        json.dump([t.model_dump() for t in topics], f, indent=2)
        
    print(f"Saved {len(topics)} topics to data/topics.json")

def segment_command(args):
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

    # Select topic
    if args.topic_id:
        top_topic = next((t for t in topics if t.id == args.topic_id), None)
        if not top_topic:
            print(f"Topic with ID {args.topic_id} not found.")
            return
    else:
        # Default to first unprocessed topic (FIFO)
        top_topic = next((t for t in topics if t.id not in processed_ids), None)
        if not top_topic:
            print("No new topics to process.")
            return
    
    print(f"3. Processing Topic: {top_topic.title}")
    
    script_writing_service = ScriptWritingService()
    script_text = script_writing_service.generate_script(top_topic.title, top_topic.context)

    # Generate Audio
    print("4. Generating Audio...")
    tts_service = TTSService()
    audio_filename = f"{top_topic.id}.wav"
    audio_path = os.path.join(AUDIO_DIR, audio_filename)
    
    tts_result = tts_service.generate_audio(script_text, audio_path)
    
    # Create Segment JSON
    segment_data = {
        "id": top_topic.id,
        "title": top_topic.title,
        "audio_url": f"/data/audio/{audio_filename}", 
        "transcript": tts_result["transcript"],
        "duration": tts_result["duration"]
    }
    
    with open(os.path.join(SEGMENTS_DIR, f"{top_topic.id}.json"), "w") as f:
        json.dump(segment_data, f, indent=2)
        
    # Set Current Segment
    with open(os.path.join(DATA_DIR, "current_segment.json"), "w") as f:
        json.dump({"id": top_topic.id}, f, indent=2)
        
    # Update processed topics
    processed_ids.add(top_topic.id)
    with open(processed_path, "w") as f:
        json.dump(list(processed_ids), f, indent=2)

    print(f"Generated segment for {top_topic.title}")

def main():
    parser = argparse.ArgumentParser(description="Covered Backend CLI")
    subparsers = parser.add_subparsers(dest="command", required=True)

    # Curate command
    curate_parser = subparsers.add_parser("curate", help="Curate topics from emails")
    curate_parser.set_defaults(func=curate_command)

    # Segment command
    segment_parser = subparsers.add_parser("segment", help="Generate segment for a topic")
    segment_parser.add_argument("--topic-id", help="ID of the topic to generate segment for")
    segment_parser.set_defaults(func=segment_command)

    args = parser.parse_args()
    args.func(args)

if __name__ == "__main__":
    main()
