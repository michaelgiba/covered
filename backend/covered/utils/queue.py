import sqlite3
import os
import json
from covered.config import DATA_DIR


class QueueService:
    def __init__(self):
        self.db_path = os.path.join(DATA_DIR, "queue.db")
        self._ensure_db()

    def _ensure_db(self):
        os.makedirs(DATA_DIR, exist_ok=True)
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS queue (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                topic_id TEXT,
                status TEXT DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        conn.commit()
        conn.close()

    def _get_connection(self):
        return sqlite3.connect(self.db_path)

    def push(self, topic_id: str):
        conn = self._get_connection()
        cursor = conn.cursor()
        cursor.execute("INSERT INTO queue (topic_id) VALUES (?)", (topic_id,))
        conn.commit()
        conn.close()

    def pop(self):
        """Returns the next pending topic_id or None."""
        conn = self._get_connection()
        cursor = conn.cursor()

        # Simple transaction to get and mark as processing/done
        # For this simple implementation, we just delete it when popped or we could have a status.
        # Let's just select one and delete it for now to simulate a simple queue,
        # or better, return it and let the worker delete it?
        # The prompt says: "Receives messages from a pubsub queue".
        # Let's just do a simple pop (select + delete).

        try:
            cursor.execute("BEGIN IMMEDIATE")
            cursor.execute("SELECT id, topic_id FROM queue ORDER BY id ASC LIMIT 1")
            row = cursor.fetchone()

            if row:
                queue_id, topic_id = row
                cursor.execute("DELETE FROM queue WHERE id = ?", (queue_id,))
                conn.commit()
                return topic_id
            else:
                conn.commit()
                return None
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()
