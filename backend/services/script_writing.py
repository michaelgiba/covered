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
            return (
                f"Moving on to our next segment, we're taking a look at {title}. "
                f"To give you some background on this, {context}. "
                "It's a really interesting development that's been making waves in the tech community "
                "recently. We're seeing a lot of discussion around the potential impact of this, "
                "and it's definitely something that warrants a deeper dive. As we continue to "
                "explore the latest trends and breakthroughs, stories like this remind us just how "
                "quickly things are changing. We'll be sure to keep you updated as more information "
                "comes to light. For now, that's the latest on this topic. Stay tuned for more "
                "insights and analysis coming up next."
            )
