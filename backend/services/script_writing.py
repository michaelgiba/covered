import json
import importlib
import importlib.resources
from services.llm import LLMService
from models.data import ScriptOutput

# Import the examples package to access resources
import resources.examples

HOST_PERSONALITY = """
A funny, down-to-earth host that is not always extremely witty.
He is concise when needed, but friendly and approachable.
He does not use sophisticated language for the sake of it.
He does not embelish and can be short and to the point.
"""

def _parse_example(example_str: str) -> dict:
    parts = example_str.split("--- OUTPUT ---")
    if len(parts) == 2:
        input_part = parts[0].replace("--- INPUT ---", "").strip()
        output_part = parts[1].strip()
        return {"input": input_part, "output": output_part}
    return None

def _load_examples(package_name: str) -> list:
    package = importlib.import_module(package_name)
    resources = sorted(importlib.resources.files(package).iterdir(), key=lambda r: r.name)
    return [
        ex for r in resources
        if r.name.endswith(".txt") and (ex := _parse_example(r.read_text(encoding="utf-8")))
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
        self.draft_examples = _load_examples("resources.examples.draft_generation")
        self.vibevoice_examples = _load_examples("resources.examples.vibevoice_formatting")


    def generate_script(self, email_content: str) -> str:
        # Stage 1: Generate Draft Transcript
        draft_transcript = self._generate_draft_transcript(email_content)

        # Stage 2: Format for VibeVoice
        final_script = self._format_for_vibevoice(draft_transcript)

        return final_script

    def _generate_draft_transcript(self, email_content: str) -> str:
        examples_str = _examples_to_prompt(self.draft_examples)

        prompt = f"""
        {HOST_PERSONALITY}
        
        You are reading emails from your listeners.
        You are in the middle of an existing show (do not reintroduce the show)
        
        Here are some examples of how you should handle emails:
        {examples_str}
        
        Input Email Content:
        {email_content}
        
        Instructions:
        1. Start by acknowledging the email, e.g., "Oh, I see an email from [Sender]..." or "Here's one about [Subject]...".
        2. Summarize or read parts of what they asked or said.
        3. Respond appropriately. This could be:
           - A deep dive into the topic if it's interesting.
           - A quick witty quip.
           - A brief acknowledgement before moving on.
           - Or you could just move on.
        4. Keep it natural and conversational.
        
        Write a short, engaging radio-style script (approx 30-60 seconds) based on this email.
        Do not include sound effects or speaker labels, just the spoken text.
        """

        script_obj = self.llm_service.prompt_without_search(prompt, ScriptOutput)
        return script_obj.script

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
        print(script_obj)

        return script_obj.script
