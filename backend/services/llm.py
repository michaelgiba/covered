import requests
from pydantic import TypeAdapter, BaseModel
import json
import os

# gemini-2.0-flash-exp
MODEL = "gemini-3-flash-preview"


class LLMService:
    def prompt_without_search(self, prompt: str, output_model: BaseModel):
        GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
        if not GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY environment variable not set.")

        url = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent"
        headers = {"x-goog-api-key": GEMINI_API_KEY, "Content-Type": "application/json"}
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "responseMimeType": "application/json",
                "responseJsonSchema": TypeAdapter(output_model).json_schema(),
            },
        }
        # print(f"Gemini Payload: {payload}")
        response = requests.post(url, headers=headers, json=payload)
        response.raise_for_status()
        # print(f"Gemini Response: {response.json()}")

        # Extract the response text
        response_text = (
            response.json()
            .get("candidates", [{}])[0]
            .get("content", [{}])
            .get("parts", [{}])[0]
            .get("text")
        )
        if not response_text:
            return None

        data = json.loads(response_text)
        validated_obj = output_model(**data)
        return validated_obj
