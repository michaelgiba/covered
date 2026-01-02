import requests
from bs4 import BeautifulSoup
from services.llm import LLMService
from models.data import ScriptOutput
from ._personality import HOST_PERSONALITY


def _get_llm_service():
    return LLMService()


def handle_article(link: str, why_reading: str) -> str:
    """
    Fetches article content and converts it to a verbatim draft script.
    """
    print(f"Handling article: {link}")
    try:
        # 1. Fetch content
        response = requests.get(link, timeout=10)
        response.raise_for_status()

        soup = BeautifulSoup(response.content, "html.parser")
        # Strip script and style elements
        for script in soup(["script", "style"]):
            script.extract()

        text = soup.get_text(separator=" ", strip=True)
        # Truncate if too long to avoid token limits (rough heuristic)
        text = text[:10000]

        # 2. Convert to draft script
        prompt = f"""
        {HOST_PERSONALITY}
        
        You are reading an article recommended by a listener.
        Link: {link}
        
        Article Content:
        {text}
        
        Task:

        Read the article aloud and repeat it verbatim as if you are reading it to your audience.
        That means reading the title, author name first and then reading the entire 
        article, exactly the original without any changes.
        """

        llm = _get_llm_service()
        result = llm.prompt_without_search(prompt, ScriptOutput)
        return result.script

    except requests.RequestException as e:
        print(f"Error fetching article: {e}")
        return f"I tried to check out the link but I couldn't access it."


def handle_topic_research(topic: str, why_researching: str) -> str:
    """
    Researches a topic and converts it to a topic summary.
    """
    print(f"Handling topic research: {topic}")

    prompt = f"""
    {HOST_PERSONALITY}
    
    A listener suggested researching the topic: "{topic}".
    Why: {why_researching}
    
    Task:
    Provide a deep dive or an interesting take on this topic.
    Use your knowledge to explain it, give context, or share a fun fact.
    Make it engaging for the radio audience.
    """

    llm = _get_llm_service()
    result = llm.prompt_without_search(prompt, ScriptOutput)
    return result.script


def handle_question_with_context(email_content: str) -> str:
    prompt = f"""
    {HOST_PERSONALITY}
    
    You received an email with a question.
    
    Email Content:
    {email_content}
    
    Task:
    Answer the question asked in the email.
    Be helpful but keep it within your personality.
    """

    llm = _get_llm_service()
    result = llm.prompt_without_search(prompt, ScriptOutput)
    return result.script


def handle_unknown() -> str:
    return "I'm not quite sure what to make of that, but thanks for writing in! Always good to hear from you guys."
