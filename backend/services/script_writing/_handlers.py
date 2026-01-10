import io
import logging
from functools import cache
import requests
import markitdown
from markitdown import StreamInfo
from playwright.sync_api import sync_playwright
from services.llm import LLMService
from models.data import ScriptOutput, UrlExtraction

logger = logging.getLogger(__name__)

READABILITY_JS_URL = "https://cdn.jsdelivr.net/npm/@mozilla/readability@0.5.0/Readability.js"
USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36"


@cache
def _get_readability_library() -> str:
    response = requests.get(READABILITY_JS_URL)
    response.raise_for_status()
    return response.text


@cache
def _get_markitdown_client() -> markitdown.MarkItDown:
    return markitdown.MarkItDown()


def _extract_article_text_raw(url: str) -> dict:
    """
    Extracts an article using Playwright and Readability.js.
    """
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Spoof User-Agent to look like a real browser
        page = browser.new_page(
            bypass_csp=True,
            user_agent=USER_AGENT,
            locale="en-US",
            timezone_id="America/New_York"
        )

        # Navigate and inject the script
        page.goto(url, wait_until="domcontentloaded")
        page.add_script_tag(content=_get_readability_library())

        # Execute Readability.js and get the result
        article = page.evaluate("""() => {
            const documentClone = document.cloneNode(true);
            const reader = new Readability(documentClone);
            return reader.parse();
        }""")

        browser.close()
        return article


def _pdf_to_markdown(url: str) -> str | None:
    try:
        # Spoof User-Agent here as well
        response = requests.get(url, headers={"User-Agent": USER_AGENT})
        response.raise_for_status()
        return _get_markitdown_client().convert(response).markdown
    except Exception as e:
        logger.error(f"Failed to extract as pdf {url!r} {e!r}")
        return None


def _html_to_markdown(url: str) -> str | None:
    try:
        raw_content = _extract_article_text_raw(url)
        if not raw_content or "content" not in raw_content:
            return None
            
        raw_content_bytes = raw_content["content"].encode()
        
        base_guess = StreamInfo(
            mimetype="text/html",
            charset="utf-8",
            filename=None,
            extension=".html",
            url=url,
        )
        markdown = _get_markitdown_client().convert_stream(io.BytesIO(raw_content_bytes), stream_info=base_guess)

        return markdown.markdown
    except Exception as e:
        logger.error(f"Failed to extract as html {url!r} {e!r}")
        return None


def convert_url_content_to_markdown(url: str) -> str:
    for technique in [_html_to_markdown, _pdf_to_markdown]:
        if result := technique(url):
            return result

    raise ValueError(f"Unable to extract content from `{url}`")


def _get_llm_service():
    return LLMService()


def handle_read_aloud(email_content: str) -> dict:
    """
    Handles the 'read aloud' task.
    1. Uses LLM to check for links in the content.
    2. If links found, fetches the first one, converts to markdown using Playwright/MarkItDown.
    3. Then uses LLM to standardize the markdown to plain text.
    4. Otherwise, returns the email content itself.
    """
    print(f"Handling read aloud input")
    
    llm = _get_llm_service()
    
    # Step 1: Extract URLs using LLM
    url_prompt = f"""
    Analyze the following text and extract any URLs present.
    Return them as a list of strings. If no URLs are found, return an empty list.
    
    Text:
    {email_content}
    """
    
    try:
        url_result = llm.prompt_without_search(url_prompt, UrlExtraction)
        urls = url_result.urls
    except Exception as e:
        print(f"Error extracting URLs: {e}")
        urls = []
    
    content_to_read = email_content
    
    if urls:
        # Take the first URL found
        link = urls[0]
        print(f"Found link via LLM: {link}")
        try:
            # Step 2: Convert to markdown using the robust pipeline
            markdown_content = convert_url_content_to_markdown(link)
        
            # Step 3: Standardize to plain text using LLM
            content_prompt = f"""
            You are an expert content cleaner.
            
            Task:
            Take the following Markdown content and convert it to clean, plain text for reading aloud.
            Remove any remaining markdown artifacts (like links, image references, bold/italic markers).
            Keep the text flow natural.
            Do not summarize. Keep the full body content.
            
            Markdown Content:
            {markdown_content}
            """
            
            result = llm.prompt_without_search(content_prompt, ScriptOutput)
            content_to_read = result.script
            
        except Exception as e:
            print(f"Error fetching or parsing link {link}: {e}")
            # Fallback to original email content if fetching fails
            content_to_read = f"I tried to read the link {link}, but I couldn't access it. Here is the message: {email_content}"

    return {
        "speaker": "main",
        "content": content_to_read
    }
