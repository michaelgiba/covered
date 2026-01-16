import os
import json
import base64
import requests
import subprocess
import logging

logger = logging.getLogger(__name__)

def generate_audio_gemini(text: str, output_path: str, api_key: str) -> None:
    """
    Generates audio for the given text using Gemini 2.5 TTS.
    Saves the audio to the specified output_path.
    """
    if not api_key:
        raise ValueError("GEMINI_API_KEY is not set.")

    url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent"
    headers = {
        "x-goog-api-key": api_key,
        "Content-Type": "application/json",
    }
    
    payload = {
        "contents": [{
            "parts": [{
                "text": f"Say: {text}"
            }]
        }],
        "generationConfig": {
            "responseModalities": ["AUDIO"],
            "speechConfig": {
                "voiceConfig": {
                    "prebuiltVoiceConfig": {
                        "voiceName": "Kore"
                    }
                }
            }
        },
        "model": "gemini-2.5-flash-preview-tts",
    }

    try:
        response = requests.post(url, headers=headers, json=payload)
        response.raise_for_status()
        
        data = response.json()
        
        # Extract base64 audio data
        # Structure: .candidates[0].content.parts[0].inlineData.data
        try:
            audio_base64 = data["candidates"][0]["content"]["parts"][0]["inlineData"]["data"]
        except (KeyError, IndexError) as e:
            logger.error(f"Unexpected response structure from Gemini TTS: {data}")
            raise RuntimeError(f"Failed to parse Gemini TTS response: {e}")

        pcm_data = base64.b64decode(audio_base64)
        
        # Save temporary PCM file
        temp_pcm_path = output_path + ".pcm"
        with open(temp_pcm_path, "wb") as f:
            f.write(pcm_data)
            
        # Convert PCM to output format (likely WAV or M4A based on extension) using ffmpeg
        # Input format from snippet: -f s16le -ar 24000 -ac 1
        
        # Ensure directory exists
        os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)

        cmd = [
            "ffmpeg",
            "-y", # Overwrite output
            "-f", "s16le",
            "-ar", "24000",
            "-ac", "1",
            "-i", temp_pcm_path,
            output_path
        ]
        
        logger.info(f"Running ffmpeg command: {' '.join(cmd)}")
        subprocess.run(cmd, check=True, capture_output=True)
        
        # Cleanup temp file
        if os.path.exists(temp_pcm_path):
            os.remove(temp_pcm_path)
            
    except requests.exceptions.RequestException as e:
        logger.error(f"Gemini TTS API Request failed: {e}")
        if e.response is not None:
             logger.error(f"Response content: {e.response.text}")
        raise
    except subprocess.CalledProcessError as e:
        logger.error(f"ffmpeg conversion failed: {e.stderr.decode()}")
        raise
    except Exception as e:
        logger.error(f"An error occurred during Gemini TTS generation: {e}")
        raise
