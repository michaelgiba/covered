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
    timestamp: str  # Changed to required
    playback_content: Optional["PlaybackContent"] = None


class PlaybackContent(BaseModel):
    id: str
    m4a_file_url: str


class TopicList(BaseModel):
    topics: List[Topic]


class ScriptOutput(BaseModel):
    script: str


class UrlExtraction(BaseModel):
    urls: List[str]
