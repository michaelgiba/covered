import uuid
import random
from datetime import datetime, timedelta
from typing import List
from covered.models.data import Email
from imap_tools import MailBox

EMAIL_APP_PASSWORD = "xgqq brvh hshg hcdv"
EMAIL_ADDRESS = "coveredappinbox@gmail.com"


class EmailService:
    def download_emails(self) -> List[Email]:
        emails = []
        
        with MailBox("imap.gmail.com").login(
            EMAIL_ADDRESS, EMAIL_APP_PASSWORD, initial_folder="INBOX"
        ) as mailbox:
            print(f"Connected to {mailbox.folder.get()}")

            # Fetch all emails explicitly
            fetched_msgs = list(
                mailbox.fetch(criteria="ALL", limit=10, reverse=True)
            )
            print(f"Found {len(fetched_msgs)} emails.")

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

        return emails
