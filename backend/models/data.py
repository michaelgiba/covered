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
    timestamp: Optional[str] = None
    status: str = "pending"


class TopicList(BaseModel):
    topics: List[Topic]


class ScriptOutput(BaseModel):
    script: str
