import os
import json
import threading
from typing import List, Optional
from covered.models.data import Topic, ProcessedInput, PlaybackContent
from covered.utils.llm import LLMService
from covered.config import DATA_DIR
from ._email import EmailService

class TopicService:
    _file_lock = threading.Lock()

    def __init__(self):
        self.data_dir = DATA_DIR
        self.state_dir = os.path.join(self.data_dir, "topic_service_state")
        self.processed_inputs_dir = os.path.join(self.data_dir, "processed-inputs")
        self.playback_content_dir = os.path.join(self.data_dir, "playback-content")

        self.topics_path = os.path.join(self.data_dir, "topics.json")
        self.cursor_path = os.path.join(self.state_dir, "curator_cursor.json")

        self._ensure_directories()

    def _ensure_directories(self):
        os.makedirs(self.data_dir, exist_ok=True)
        os.makedirs(self.state_dir, exist_ok=True)
        os.makedirs(self.processed_inputs_dir, exist_ok=True)
        os.makedirs(self.playback_content_dir, exist_ok=True)

    def _load_all_topics(self) -> List[Topic]:
        if not os.path.exists(self.topics_path):
            return []

        with open(self.topics_path, "r") as f:
            topics_data = json.load(f)
            valid_topics = []
            for t in topics_data:
                valid_topics.append(Topic(**t))
            return valid_topics

    def rebuild_topics_index(self):
        """
        Rebuilds topics.json from the file system.
        """
        topics = []
        # List all processed inputs
        input_files = [f for f in os.listdir(self.processed_inputs_dir) if f.endswith(".json")]
        
        for filename in input_files:
            # Load ProcessedInput
            with open(os.path.join(self.processed_inputs_dir, filename), "r") as f:
                p_input_data = json.load(f)
                p_input = ProcessedInput(**p_input_data)
            
            # Check for PlaybackContent
            playback = None
            playback_path = os.path.join(self.playback_content_dir, filename) # Same filename
            if os.path.exists(playback_path):
                with open(playback_path, "r") as f:
                    playback_data = json.load(f)
                    from covered.models.data import PlaybackContent # Local import to avoid circular dependency if any
                    playback = PlaybackContent(**playback_data)

            # Create Topic
            topics.append(Topic(
                id=p_input.id,
                timestamp=p_input.timestamp,
                processed_input=p_input,
                playback_content=playback
            ))
        
        # Sort by timestamp, newest first usually, or oldest first? Original was oldest first sort in curate, but let's sort by timestamp descending for feed usually, but original curate sorted oldest first. 
        # Existing `topics.json` order was append, so oldest first.
        topics.sort(key=lambda t: t.timestamp)

        with open(self.topics_path, "w") as f:
            json.dump([t.model_dump() for t in topics], f, indent=2)

    def _save_processed_input(self, p_input: ProcessedInput):
        filename = f"{p_input.id}.json"
        with open(os.path.join(self.processed_inputs_dir, filename), "w") as f:
            json.dump(p_input.model_dump(), f, indent=2)

    def _save_playback_content(self, playback: PlaybackContent, input_id: str):
        filename = f"{input_id}.json"
        with open(os.path.join(self.playback_content_dir, filename), "w") as f:
             json.dump(playback.model_dump(), f, indent=2)

    def _load_cursor(self) -> Optional[str]:
        if not os.path.exists(self.cursor_path):
            return None

        try:
            with open(self.cursor_path, "r") as f:
                data = json.load(f)
                return data.get("timestamp")
        except json.JSONDecodeError:
            return None

    def _save_cursor(self, timestamp: str):
        with open(self.cursor_path, "w") as f:
            json.dump({"timestamp": timestamp}, f, indent=2)

    def get_topics_without_playback_content(self) -> List[Topic]:
        """
        Returns a list of Topics (constructed from ProcessedInputs) that do not have playback content.
        This scans the file system.
        """
        candidates = []
        input_files = [f for f in os.listdir(self.processed_inputs_dir) if f.endswith(".json")]
        
        for filename in input_files:
            playback_path = os.path.join(self.playback_content_dir, filename)
            if not os.path.exists(playback_path):
                with open(os.path.join(self.processed_inputs_dir, filename), "r") as f:
                    p_input_data = json.load(f)
                    p_input = ProcessedInput(**p_input_data)
                    
                    candidates.append(Topic(
                        id=p_input.id,
                        timestamp=p_input.timestamp,
                        processed_input=p_input,
                        playback_content=None
                    ))
        
        # Sort by timestamp
        candidates.sort(key=lambda t: t.timestamp)
        return candidates

    def update_topic_playback(self, topic_id: str, playback_content):
        """
        Updates the topic with the given playback content by saving the playback file and rebuilding index.
        """
        with self._file_lock:
            self._save_playback_content(playback_content, topic_id)
            self.rebuild_topics_index()


    def _email_to_processed_input(self, email) -> ProcessedInput:
        # Determine sender  
        sender_display = email.sender if email.sender else "Anonymous"

        # LLM Extraction
        llm_service = LLMService()

        prompt = f"""
        Analyze the following email content.
        1. Generate a concise, catchy title for this topic (max 10 words).
        2. Extract the primary URL link if present. If multiple, choose the most relevant one.
        3. Format the content into a clean string suitable for reading.
        
        Email Subject: {email.subject}
        Email Body: {email.body}
        Email Sender: {email.sender}
        """
        
        return llm_service.prompt_without_search(prompt, ProcessedInput)

    def curate_from_emails(self, count: int = 50) -> List[Topic]:
        """
        Fetches emails using EmailService, filters by cursor, converts to Topics, and saves.
        Returns the list of newly created topics.
        """
        email_service = EmailService()
        emails = email_service.download_emails()

        # Sort emails by timestamp (oldest first)
        emails.sort(key=lambda x: x.timestamp)

        with self._file_lock:
            new_topics = []
            cursor = self._load_cursor()
            latest_timestamp = cursor

            for email in emails:
                # If we have a cursor, skip emails older or equal to it
                if cursor and email.timestamp <= cursor:
                    continue
                
                processed_data = self._email_to_processed_input(email)

                self._save_processed_input(processed_data)
                
                new_topics.append(
                    Topic(
                        id=email.id,
                        timestamp=email.timestamp,
                        processed_input=processed_data,
                        playback_content=None
                    )
                )

                # Update latest timestamp
                if latest_timestamp is None or email.timestamp > latest_timestamp:
                    latest_timestamp = email.timestamp

            # Rebuild index and save cursor
            if new_topics:
                self.rebuild_topics_index()
                if latest_timestamp:
                    self._save_cursor(latest_timestamp)

            return new_topics
