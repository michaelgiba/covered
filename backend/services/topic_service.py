import os
import json
import threading
from typing import List, Set, Optional
from models.data import Topic
from services.email import EmailService


class TopicService:
    _file_lock = threading.Lock()

    def __init__(self):
        # Determine absolute paths
        # This file is in backend/services/
        self.base_dir = os.path.dirname(
            os.path.dirname(os.path.abspath(__file__))
        )  # backend/
        self.data_dir = os.path.abspath(os.path.join(self.base_dir, "../data"))
        self.state_dir = os.path.join(self.data_dir, "topic_service_state")

        self.topics_path = os.path.join(self.data_dir, "topics.json")
        self.cursor_path = os.path.join(self.state_dir, "cursor.json")

        self._ensure_directories()

    def _ensure_directories(self):
        os.makedirs(self.data_dir, exist_ok=True)
        os.makedirs(self.state_dir, exist_ok=True)

    def _load_all_topics(self) -> List[Topic]:
        if not os.path.exists(self.topics_path):
            return []

        try:
            with open(self.topics_path, "r") as f:
                topics_data = json.load(f)
                valid_topics = []
                for t in topics_data:
                    try:
                        # Handle migration: if timestamp is missing, use current time or skip?
                        # If status is present, it's ignored.
                        # If timestamp is missing, Pydantic raises error.
                        valid_topics.append(Topic(**t))
                    except Exception:
                        continue
                return valid_topics
        except json.JSONDecodeError:
            return []

    def _save_topics(self, topics: List[Topic]):
        with open(self.topics_path, "w") as f:
            json.dump([t.model_dump() for t in topics], f, indent=2)

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

    def get_available_topics(self) -> List[Topic]:
        """
        Returns a list of topics that have not been processed yet.
        """
        with self._file_lock:
            all_topics = self._load_all_topics()
            return [t for t in all_topics if t.playback_content is None]

    def update_topic_playback(self, topic_id: str, playback_content):
        """
        Updates the topic with the given playback content.
        """
        with self._file_lock:
            all_topics = self._load_all_topics()
            for topic in all_topics:
                if topic.id == topic_id:
                    topic.playback_content = playback_content
                    break
            self._save_topics(all_topics)

    def curate_from_emails(self, count: int = 50) -> List[Topic]:
        """
        Fetches emails using EmailService, filters by cursor, converts to Topics, and saves.
        Returns the list of newly created topics.
        """
        # Note: Email fetching is network bound and doesn't need the lock.
        # We only lock when we are reading/writing our local state.
        email_service = EmailService()
        emails = email_service.download_emails()

        # Sort emails by timestamp (oldest first)
        emails.sort(key=lambda x: x.timestamp)

        with self._file_lock:
            cursor = self._load_cursor()
            new_topics = []
            latest_timestamp = cursor

            for email in emails:
                # If we have a cursor, skip emails older or equal to it
                if cursor and email.timestamp <= cursor:
                    continue

                new_topics.append(
                    Topic(
                        id=email.id,
                        title=email.subject.strip() or "(No Subject)",
                        context=email.body,
                        sender=email.sender,
                        timestamp=email.timestamp,
                    )
                )

                # Update latest timestamp
                if latest_timestamp is None or email.timestamp > latest_timestamp:
                    latest_timestamp = email.timestamp

            # Append new topics to existing ones
            if new_topics:
                all_topics = self._load_all_topics()
                all_topics.extend(new_topics)
                self._save_topics(all_topics)

                if latest_timestamp:
                    self._save_cursor(latest_timestamp)

            return new_topics
