import sqlite3
import json
import os
from typing import List, Optional
from covered.models.data import Topic, ProcessedInput, PlaybackContent
from covered.config import DATA_DIR


class Database:
    def __init__(self):
        self.db_path = os.path.join(DATA_DIR, "topics.db")
        self._ensure_db()

    def _ensure_db(self):
        os.makedirs(DATA_DIR, exist_ok=True)
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        # Create processed_inputs table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS processed_inputs (
                id TEXT PRIMARY KEY,
                timestamp TEXT,
                data TEXT
            )
        """)

        # Create playback_content table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS playback_content (
                id TEXT PRIMARY KEY,
                processed_input_id TEXT,
                data TEXT,
                FOREIGN KEY(processed_input_id) REFERENCES processed_inputs(id)
            )
        """)

        conn.commit()
        conn.close()

    def _get_connection(self):
        return sqlite3.connect(self.db_path)

    def upsert_processed_input(self, p_input: ProcessedInput):
        """Stores a processed input record."""
        conn = self._get_connection()
        cursor = conn.cursor()

        cursor.execute(
            """
            INSERT OR REPLACE INTO processed_inputs (id, timestamp, data)
            VALUES (?, ?, ?)
        """,
            (p_input.id, p_input.timestamp, json.dumps(p_input.model_dump())),
        )

        conn.commit()
        conn.close()

    def upsert_topic_playback(self, topic_id: str, playback: PlaybackContent):
        """Stores playback content for a topic."""
        conn = self._get_connection()
        cursor = conn.cursor()

        cursor.execute(
            """
            INSERT OR REPLACE INTO playback_content (id, processed_input_id, data)
            VALUES (?, ?, ?)
        """,
            (playback.id, topic_id, json.dumps(playback.model_dump())),
        )

        conn.commit()
        conn.close()

    def get_topics_without_playback_content(self) -> List[Topic]:
        """Returns topics that don't have associated playback content."""
        conn = self._get_connection()
        cursor = conn.cursor()

        # Join to find inputs without playback
        # We need to return Topic objects.
        # Select processed_inputs where id not in playback_content.processed_input_id

        cursor.execute("""
            SELECT pi.data
            FROM processed_inputs pi
            LEFT JOIN playback_content pc ON pi.id = pc.processed_input_id
            WHERE pc.id IS NULL
            ORDER BY pi.timestamp ASC
        """)

        rows = cursor.fetchall()
        topics = []
        for row in rows:
            p_input_data = json.loads(row[0])
            p_input = ProcessedInput(**p_input_data)
            topics.append(
                Topic(
                    id=p_input.id,
                    timestamp=p_input.timestamp,
                    processed_input=p_input,
                    playback_content=None,
                )
            )

        conn.close()
        return topics

    def get_all_topics(self) -> List[Topic]:
        """Returns all topics, joining with playback content if available."""
        conn = self._get_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT pi.data, pc.data
            FROM processed_inputs pi
            LEFT JOIN playback_content pc ON pi.id = pc.processed_input_id
            ORDER BY pi.timestamp DESC
        """)

        rows = cursor.fetchall()
        topics = []
        for row in rows:
            p_input_data = json.loads(row[0])
            p_input = ProcessedInput(**p_input_data)

            playback = None
            if row[1]:
                playback_data = json.loads(row[1])
                playback = PlaybackContent(**playback_data)

            topics.append(
                Topic(
                    id=p_input.id,
                    timestamp=p_input.timestamp,
                    processed_input=p_input,
                    playback_content=playback,
                )
            )

        conn.close()
        return topics
