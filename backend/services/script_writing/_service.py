import os
import time
import json
from typing import Any
from services.llm import LLMService
from models.data import ScriptOutput
from ._handlers import handle_read_aloud

DEBUG_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "debug_scripts"
)
os.makedirs(DEBUG_DIR, exist_ok=True)


class ScriptWritingService:
    def __init__(self):
        self.llm_service = LLMService()

    def _save_debug_script(self, filename: str, content: Any):
        try:
            path = os.path.join(DEBUG_DIR, filename)
            if filename.endswith(".json"):
                with open(path, "w", encoding="utf-8") as f:
                    json.dump(content, f, indent=2, ensure_ascii=False)
            else:
                with open(path, "w", encoding="utf-8") as f:
                    f.write(str(content))
        except Exception as e:
            print(f"Failed to save debug script {filename}: {e}")

    def generate_script(self, email_content: str) -> str:
        # Stage 1: Generate Draft Transcript (The Construction Layer)
        draft_transcript = self._generate_draft_transcript(email_content)

        # Debug: Save Post-Polish
        timestamp = int(time.time())
        # Wrap in list of objects to maintain structure
        post_polish_data = [{"speaker": "main", "content": draft_transcript}]
        self._save_debug_script(f"{timestamp}_post_polish.json", post_polish_data)

        return draft_transcript

    def _generate_draft_transcript(self, email_content: str) -> str:
        # a. Start with empty segment transcript
        transcript_parts = []

        # b. Handle Read Aloud
        # This replaces the categorization and multiple handlers logic
        read_aloud_part = handle_read_aloud(email_content)
        transcript_parts.append(read_aloud_part)

        # Debug: Save Pre-Polish
        timestamp = int(time.time())
        self._save_debug_script(f"{timestamp}_pre_polish.json", transcript_parts)

        # c. Final pass to fix discontinuities
        polished_draft = self._polish_transcript(transcript_parts)

        return polished_draft

    def _polish_transcript(self, transcript_parts: list) -> str:
        # Convert parts to a string representation for the LLM
        transcript_str = "\n\n".join([f"Speaker ({p['speaker']}):\n{p['content']}" for p in transcript_parts])

        prompt = f"""
        You are being presented with a transcript that is intended to be read aloud to an audience.
        Your task is to take the transcript and do the minimal amount of editing to make it flow naturally as a monologue.
        You should not add an intro or outro, summarize, or change ANYTHING in the substance of the transcript.

        You may make the following changes:
        - Add punctuation to guide natural pausing and intonation.
        - Add minor transitions between segments only if necessary.
        - Correct obvious typos or errors.        
        
        Here is the transcript:
        {transcript_str}

        Respond only with the polished transcript no additional text.
        """
        result = self.llm_service.prompt_without_search(prompt, ScriptOutput)
        return result.script
