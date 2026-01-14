import os
import requests
from typing import Tuple, Optional
from functools import cache
from playwright.sync_api import sync_playwright

READABILITY_JS_URL = (
    "https://cdn.jsdelivr.net/npm/@mozilla/readability@0.5.0/Readability.js"
)
USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36"


@cache
def _get_readability_library() -> str:
    response = requests.get(READABILITY_JS_URL)
    response.raise_for_status()
    return response.text


class HeadlessBrowserService:
    def __init__(self, output_dir: str):
        self.output_dir = output_dir
        os.makedirs(self.output_dir, exist_ok=True)

    def get_snapshot_and_content(
        self, url: str, topic_id: str, output_dir: Optional[str] = None
    ) -> Tuple[Optional[str], str]:
        """
        Navigates to the URL, takes a full page screenshot, and extracts text content using Readability.
        Returns (snapshot_filename, extracted_text).
        """
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            # Spoof User-Agent
            page = browser.new_page(
                viewport={"width": 1280, "height": 720},
                user_agent=USER_AGENT,
                locale="en-US",
            )

            # Navigate
            page.goto(url, wait_until="domcontentloaded", timeout=60000)

            # Inject Readability
            page.add_script_tag(content=_get_readability_library())

            # Generate snapshot filename
            if output_dir:
                os.makedirs(output_dir, exist_ok=True)
                snapshot_filename = "snapshot.png"
                snapshot_path = os.path.join(output_dir, snapshot_filename)
            else:
                snapshot_filename = f"snapshot_{topic_id}.png"
                snapshot_path = os.path.join(self.output_dir, snapshot_filename)

            # Full page screenshot
            page.screenshot(path=snapshot_path, full_page=True)

            # Extract content using Readability
            article_content = page.evaluate("""() => {
                const documentClone = document.cloneNode(true);
                const reader = new Readability(documentClone);
                const article = reader.parse();
                return article ? article.textContent : document.body.innerText;
            }""")

            browser.close()
            return snapshot_path, article_content
