import uuid
import random
import os
import json
import logging
from datetime import datetime, timedelta
from typing import List, Optional
from covered.models.data import Email, ProcessedInput
from covered.utils.llm import LLMService
from covered.config import DATA_DIR
from imap_tools import MailBox

EMAIL_APP_PASSWORD = "xgqq brvh hshg hcdv"
EMAIL_ADDRESS = "coveredappinbox@gmail.com"

logger = logging.getLogger("EMAIL_SERVICE")


class EmailService:
    def __init__(self):
        self.cursor_path = os.path.join(DATA_DIR, "email_cursor.json")
        os.makedirs(DATA_DIR, exist_ok=True)

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

    def _email_to_processed_input(self, email: Email) -> ProcessedInput:
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

    def download_emails(self) -> List[Email]:
        emails = []
        try:
            with MailBox("imap.gmail.com").login(
                EMAIL_ADDRESS, EMAIL_APP_PASSWORD, initial_folder="INBOX"
            ) as mailbox:
                logger.info(f"Connected to {mailbox.folder.get()}")

                # Fetch all emails explicitly
                # We fetch a limit to avoid overwhelming, but we should rely on cursor logic
                fetched_msgs = list(
                    mailbox.fetch(criteria="ALL", limit=20, reverse=True)
                )
                logger.info(f"Found {len(fetched_msgs)} emails.")

                for msg in fetched_msgs:
                    # Handle potential missing body
                    body = msg.text or msg.html or "No content"

                    email = Email(
                        id=msg.uid,
                        subject=msg.subject,
                        body=body,
                        sender=msg.from_,
                        timestamp=msg.date.isoformat(),
                    )
                    emails.append(email)
        except Exception as e:
            logger.error(f"Error downloading emails: {e}")

        return emails

    def fetch_new(self) -> List[ProcessedInput]:
        """
        Fetches new emails, filters by cursor, and converts to ProcessedInput objects.
        Updates the cursor after successful processing.
        """
        emails = self.download_emails()

        # Sort emails by timestamp (oldest first) so we process in order
        emails.sort(key=lambda x: x.timestamp)

        cursor = self._load_cursor()
        new_processed_inputs = []
        latest_timestamp = cursor

        for email in emails:
            # If we have a cursor, skip emails older or equal to it
            if cursor and email.timestamp <= cursor:
                continue

            processed_input = self._email_to_processed_input(email)

            processed_input.id = email.id
            processed_input.timestamp = email.timestamp

            new_processed_inputs.append(processed_input)

            if latest_timestamp is None or email.timestamp > latest_timestamp:
                latest_timestamp = email.timestamp

        # Update cursor if we processed anything
        if new_processed_inputs and latest_timestamp:
            self._save_cursor(latest_timestamp)

        return new_processed_inputs
