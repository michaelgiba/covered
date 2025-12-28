import uuid
import random
from datetime import datetime, timedelta
from typing import List
from models.data import Email

class EmailService:
    def generate_mock_emails(self, count: int = 50) -> List[Email]:
        topics = [
            ("AI Agents", "The new agentic coding capabilities are amazing. I built a whole app in minutes."),
            ("New React Features", "Have you seen the new React Compiler? It simplifies everything."),
            ("Coffee Brewing", "I'm trying to perfect my V60 pour over technique. Any tips?"),
            ("Space Exploration", "SpaceX just landed another booster. The future is wild."),
            ("Gardening", "My tomatoes are finally turning red. Homegrown tastes so much better."),
            ("Rust Programming", "The borrow checker is driving me crazy but I love the safety."),
            ("Indie Hacking", "Just launched my SaaS. Getting first users is the hardest part."),
            ("Minimalism", "Decluttering my digital life. Feels good to delete old files."),
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
                body=f"{topic_body} {random.randint(1, 100)}", # Add randomness to body
                sender=f"user{random.randint(1, 100)}@example.com",
                timestamp=(datetime.now() - timedelta(hours=random.randint(0, 24))).isoformat()
            )
            emails.append(email)
            
        return emails
