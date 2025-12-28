from pydantic import BaseModel
from typing import List, Optional

class Email(BaseModel):
    id: str
    subject: str
    body: str
    sender: str
    timestamp: str

class Topic(BaseModel):
    id: str
    title: str
    context: str
    sender: Optional[str] = None

class TopicList(BaseModel):
    topics: List[Topic]

class ScriptOutput(BaseModel):
    script: str
