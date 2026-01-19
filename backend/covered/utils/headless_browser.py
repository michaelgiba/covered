import os
import requests
from typing import Tuple, Optional
from functools import cache
from playwright.sync_api import sync_playwright
from dataclasses import dataclass

READABILITY_JS_URL = (
    "https://cdn.jsdelivr.net/npm/@mozilla/readability@0.5.0/Readability.js"
)
USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36"


@cache
def _get_readability_library() -> str:
    response = requests.get(READABILITY_JS_URL)
    response.raise_for_status()
    return response.text


@dataclass
class PageContent:
    snapshot_path: Optional[str]
    thumbnail_path: Optional[str]
    extracted_text: str


class HeadlessBrowserService:
    def __init__(self, output_dir: str):
        self.output_dir = output_dir
        os.makedirs(self.output_dir, exist_ok=True)

    def get_snapshot_and_content(
        self, url: str, topic_id: str, output_dir: Optional[str] = None
    ) -> PageContent:
        """
        Navigates to the URL, takes a full page screenshot, and extracts text content using Readability.
        Also attempts to capture the favicon as a thumbnail.
        Returns PageContent object.
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

            # Prepare output paths
            if output_dir:
                os.makedirs(output_dir, exist_ok=True)
                snapshot_filename = "snapshot.png"
                thumbnail_filename = "thumbnail.png"
                snapshot_path = os.path.join(output_dir, snapshot_filename)
                thumbnail_path = os.path.join(output_dir, thumbnail_filename)
            else:
                snapshot_filename = f"snapshot_{topic_id}.png"
                thumbnail_filename = f"thumbnail_{topic_id}.png"
                snapshot_path = os.path.join(self.output_dir, snapshot_filename)
                thumbnail_path = os.path.join(self.output_dir, thumbnail_filename)

            # Full page screenshot
            page.screenshot(path=snapshot_path, full_page=True)

            # Attempt to find and capture favicon
            found_thumbnail_path = None
            # 1. Try to find the favicon URL from the DOM
            favicon_url = page.evaluate("""() => {
                let link = document.querySelector("link[rel~='icon']");
                if (!link) {
                    return window.location.origin + "/favicon.ico";
                }
                return link.href;
            }""")

            if favicon_url:
                icon_page = browser.new_page(viewport={"width": 128, "height": 128})
                # If it's an image, we can just goto it.
                try:
                    icon_page.goto(favicon_url, timeout=10000)
                    # We just take a screenshot of the visible area
                    icon_page.screenshot(path=thumbnail_path)
                    found_thumbnail_path = thumbnail_path
                finally:
                    icon_page.close()

            # Extract content using Readability
            article_content = page.evaluate("""() => {
                const documentClone = document.cloneNode(true);
                const reader = new Readability(documentClone);
                const article = reader.parse();
                return article ? article.textContent : document.body.innerText;
            }""")

            browser.close()
            return PageContent(
                snapshot_path=snapshot_path,
                thumbnail_path=found_thumbnail_path,
                extracted_text=article_content,
            )
