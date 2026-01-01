import uuid
import random
from datetime import datetime, timedelta
from typing import List
from models.data import Email
from imap_tools import MailBox

EMAIL_APP_PASSWORD = "xgqq brvh hshg hcdv"
EMAIL_ADDRESS = "coveredappinbox@gmail.com"


class EmailService:
    def generate_mock_emails(self, count: int = 50) -> List[Email]:
        topics = [
            (
                "AI Agents",
                "The new agentic coding capabilities are amazing. I built a whole app in minutes.",
            ),
            (
                "New React Features",
                "Have you seen the new React Compiler? It simplifies everything.",
            ),
            (
                "Coffee Brewing",
                "I'm trying to perfect my V60 pour over technique. Any tips?",
            ),
            (
                "Space Exploration",
                "SpaceX just landed another booster. The future is wild.",
            ),
            (
                "Gardening",
                "My tomatoes are finally turning red. Homegrown tastes so much better.",
            ),
            (
                "Rust Programming",
                "The borrow checker is driving me crazy but I love the safety.",
            ),
            (
                "Indie Hacking",
                "Just launched my SaaS. Getting first users is the hardest part.",
            ),
            (
                "Minimalism",
                "Decluttering my digital life. Feels good to delete old files.",
            ),
        ]

        emails = []
        for _ in range(count):
            topic_name, topic_body = random.choice(topics)
            # Add some variation
            variations = [
                f"Regarding {topic_name}",
                f"Thoughts on {topic_name}",
                f"Question about {topic_name}",
                f"{topic_name} is interesting",
            ]

            email = Email(
                id=str(uuid.uuid4()),
                subject=random.choice(variations),
                body=f"{topic_body} {random.randint(1, 100)}",  # Add randomness to body
                sender=f"user{random.randint(1, 100)}@example.com",
                timestamp=(
                    datetime.now() - timedelta(hours=random.randint(0, 24))
                ).isoformat(),
            )
            emails.append(email)

        return emails

    def download_emails(self) -> List[Email]:
        emails = []
        print("Downloading emails...")
        try:
            with MailBox("imap.gmail.com").login(
                EMAIL_ADDRESS, EMAIL_APP_PASSWORD, initial_folder="INBOX"
            ) as mailbox:
                print(f"Connected to {mailbox.folder.get()}")
                
                # Fetch all emails explicitly
                fetched_msgs = list(mailbox.fetch(criteria="ALL", limit=10, reverse=True))
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
        except Exception as e:
            print(f"Error downloading emails: {e}")

        return emails
