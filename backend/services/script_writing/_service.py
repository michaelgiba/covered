import importlib
import importlib.resources
import os
import time
from services.llm import LLMService
from models.data import ScriptOutput
from ._categorization import (
    categorize_email,
    ExternalArticle,
    TopicResearch,
    QuestionAnswer,
    UnknownInput,
)
from ._handlers import (
    handle_article,
    handle_topic_research,
    handle_question_with_context,
    handle_unknown,
)
from ._personality import HOST_PERSONALITY
import resources.examples

DEBUG_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "debug_scripts"
)
os.makedirs(DEBUG_DIR, exist_ok=True)


def _parse_example(example_str: str) -> dict:
    parts = example_str.split("--- OUTPUT ---")
    if len(parts) == 2:
        input_part = parts[0].replace("--- INPUT ---", "").strip()
        output_part = parts[1].strip()
        return {"input": input_part, "output": output_part}
    return None


def _load_examples(package_name: str) -> list:
    package = importlib.import_module(package_name)
    resources = sorted(
        importlib.resources.files(package).iterdir(), key=lambda r: r.name
    )
    return [
        ex
        for r in resources
        if r.name.endswith(".txt")
        and (ex := _parse_example(r.read_text(encoding="utf-8")))
    ]


def _examples_to_prompt(examples: list) -> str:
    return "\n".join(
        [
            f"Example {i + 1}:\nInput:\n{ex['input']}\nOutput:\n{ex['output']}\n"
            for i, ex in enumerate(examples)
        ]
    )


class ScriptWritingService:
    def __init__(self):
        self.llm_service = LLMService()
        self.vibevoice_examples = _load_examples(
            "resources.examples.vibevoice_formatting"
        )

    def _save_debug_script(self, filename: str, content: str):
        try:
            with open(os.path.join(DEBUG_DIR, filename), "w", encoding="utf-8") as f:
                f.write(content)
        except Exception as e:
            print(f"Failed to save debug script {filename}: {e}")

    def generate_script(self, email_content: str) -> str:
        # Stage 1: Generate Draft Transcript (The Construction Layer)
        draft_transcript = self._generate_draft_transcript(email_content)

        # Stage 2: Format for VibeVoice
        final_script = self._format_for_vibevoice(draft_transcript)

        # Debug: Save Pre-TTS
        timestamp = int(time.time())
        self._save_debug_script(f"{timestamp}_pre_tts.txt", final_script)

        return final_script

    def _generate_draft_transcript(self, email_content: str) -> str:
        # a. Start with empty segment transcript
        transcript_parts = []

        # b. Restate the email
        restate_part = self._restate_email(email_content)
        transcript_parts.append(restate_part)

        # c. Categorize
        category = categorize_email(email_content)
        print(f"Categorized as: {category}")

        # d. Processing functions
        content_part = ""
        if isinstance(category, ExternalArticle):
            content_part = handle_article(
                category.link, category.why_is_it_worth_reading
            )
        elif isinstance(category, TopicResearch):
            content_part = handle_topic_research(
                category.topic, category.why_is_it_worth_researching
            )
        elif isinstance(category, QuestionAnswer):
            content_part = handle_question_with_context(email_content)
        elif isinstance(category, UnknownInput):
            content_part = handle_unknown()

        transcript_parts.append(content_part)

        # Combine parts
        full_draft = "\n\n".join(transcript_parts)

        # Debug: Save Pre-Polish
        timestamp = int(time.time())
        self._save_debug_script(f"{timestamp}_pre_polish.txt", full_draft)

        # e. Final pass to fix discontinuities
        polished_draft = self._polish_transcript(full_draft)

        return polished_draft

    def _restate_email(self, email_content: str) -> str:
        prompt = f"""
        You are a host. You just received this email. Here is your personality: 

        {HOST_PERSONALITY}
        
        and here is the email:
        {email_content}
        
        Task:
        Introduce the email to the audience. 
        Acknowledge who it is from (speaking their email address or name) and read it aloud, nearly verbatim.
        Do not answer it yet.
        """
        result = self.llm_service.prompt_without_search(prompt, ScriptOutput)
        return result.script

    def _polish_transcript(self, draft_transcript: str) -> str:
        prompt = f"""
        {HOST_PERSONALITY}
        
        Here is a draft transcript for a radio segment. It was constructed from parts and might feel disjointed.
        More importantly it might diverge from the host's personality slightly.
        
        Draft:
        {draft_transcript}
        
        Task:
        Smooth out the transitions. Make it flow naturally as one cohesive monologue.
        Keep the content as close to the original as possible, just fix the flow and tone.
        If there is some content that was being read aloud or verbatim, keep it that way 
        as the host often will need to read content.

        """
        result = self.llm_service.prompt_without_search(prompt, ScriptOutput)
        return result.script

    def _format_for_vibevoice(self, draft_transcript: str) -> str:
        examples_str = _examples_to_prompt(self.vibevoice_examples)

        prompt = f"""
        Take the following radio script transcript and format it for a Text-to-Speech system (VibeVoice).
        
        Here are some examples:
        {examples_str}
        
        Rules:
        1. Remove any remaining speaker labels (e.g., "Host:", "Speaker:").
        2. Ensure punctuation is used to guide natural pausing and intonation.        
        3. Keep the text exactly as spoken, just cleaned up.
        4. Transcribe things like emojis and other special characters.
        
        Transcript:
        {draft_transcript}
        """

        script_obj = self.llm_service.prompt_without_search(prompt, ScriptOutput)
        return script_obj.script
