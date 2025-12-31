import os
import json
from typing import List, Set, Optional
from models.data import Topic
from services.email import EmailService

class TopicService:
    def __init__(self):
        # Determine absolute paths
        # This file is in backend/services/
        self.base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__))) # backend/
        self.data_dir = os.path.abspath(os.path.join(self.base_dir, "../data"))
        self.state_dir = os.path.join(self.data_dir, "topic_service_state")
        
        self.topics_path = os.path.join(self.data_dir, "topics_on_deck.json")
        self.processed_history_path = os.path.join(self.state_dir, "processed_history.json")
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
                return [Topic(**t) for t in topics_data]
        except json.JSONDecodeError:
            return []

    def _save_topics(self, topics: List[Topic]):
        with open(self.topics_path, "w") as f:
            json.dump([t.model_dump() for t in topics], f, indent=2)

    def _load_processed_history(self) -> Set[str]:
        if not os.path.exists(self.processed_history_path):
            return set()
        
        try:
            with open(self.processed_history_path, "r") as f:
                return set(json.load(f))
        except json.JSONDecodeError:
            return set()

    def _save_processed_history(self, history: Set[str]):
        with open(self.processed_history_path, "w") as f:
            json.dump(list(history), f, indent=2)

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
        all_topics = self._load_all_topics()
        return [t for t in all_topics if t.status == "pending"]

    def mark_topic_active(self, topic_id: str):
        """
        Marks the given topic ID as active.
        """
        all_topics = self._load_all_topics()
        for topic in all_topics:
            if topic.id == topic_id:
                topic.status = "active"
                break
        self._save_topics(all_topics)

    def mark_topics_processed(self, topic_ids: List[str]):
        """
        Marks the given topic IDs as processed, updates history, and removes from topics file.
        """
        all_topics = self._load_all_topics()
        processed_history = self._load_processed_history()
        
        # Update history
        processed_history.update(topic_ids)
        self._save_processed_history(processed_history)
        
        # Remove processed topics from the list
        final_topics = [t for t in all_topics if t.id not in topic_ids]
                
        self._save_topics(final_topics)

    def curate_from_emails(self, count: int = 50) -> List[Topic]:
        """
        Fetches emails using EmailService, filters by cursor, converts to Topics, and saves.
        Returns the list of newly created topics.
        """
        email_service = EmailService()
        emails = email_service.generate_mock_emails(count)
        
        # Sort emails by timestamp (oldest first)
        emails.sort(key=lambda x: x.timestamp)
        
        cursor = self._load_cursor()
        new_topics = []
        latest_timestamp = cursor
        
        for email in emails:
            # If we have a cursor, skip emails older or equal to it
            if cursor and email.timestamp <= cursor:
                continue
            
            new_topics.append(Topic(
                id=email.id,
                title=email.subject,
                context=email.body,
                sender=email.sender,
                status="pending"
            ))
            
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
