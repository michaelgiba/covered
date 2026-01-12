import os
import time
import json
from typing import Any
from functools import cache
from covered.utils.llm import LLMService
from covered.models.data import ScriptOutput
from covered.config import BASE_DIR

DEBUG_DIR = os.path.join(BASE_DIR, "debug_scripts")
os.makedirs(DEBUG_DIR, exist_ok=True)

@cache
def _get_llm_service():
    return LLMService()


def polish(text: str) -> str:
    # Convert parts to a string representation for the LLM
    transcript_parts = [{"speaker": "main", "content": text}]
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
    result = _get_llm_service().prompt_without_search(prompt, ScriptOutput)
    return result.script

