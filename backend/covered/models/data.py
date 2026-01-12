from pydantic import BaseModel
from typing import List, Optional


class Email(BaseModel):
    id: str
    subject: str
    body: str
    sender: str
    timestamp: str


class ProcessedInput(BaseModel):
    id: str
    timestamp: str
    title: str
    content: str
    extracted_link: Optional[str] = None
    sender: Optional[str] = None


class PlaybackContent(BaseModel):
    id: str  # generated uuid
    processed_input_id: str
    page_snapshot_url: str
    script_json_url: str
    m4a_file_url: str


class Topic(BaseModel):
    id: str
    timestamp: str
    processed_input: ProcessedInput
    playback_content: Optional[PlaybackContent] = None


class TopicList(BaseModel):
    topics: List[Topic]


class ScriptOutput(BaseModel):
    script: str


class UrlExtraction(BaseModel):
    urls: List[str]
