from services.llm import LLMService
from models.data import ScriptOutput

class ScriptWritingService:
    def __init__(self):
        self.llm_service = LLMService()

    def generate_script(self, title: str, context: str) -> str:
        prompt = f"""
        Write a short, engaging radio-style script (approx 30-60 seconds) 
        for a host covering the following topic:
        
        Title: {title}
        Context: {context}
        
        The tone should be professional but conversational, like a tech podcast.
        Do not include sound effects or speaker labels, just the spoken text.
        """
        
        try:
            script_obj = self.llm_service.prompt_without_search(prompt, ScriptOutput)
            return script_obj.script
        except Exception as e:
            print(f"LLM Script Gen failed: {e}. Using fallback script.")
            return f"Next - {title}. {context} So cool."
