"""
DeepSeek Vision — analyse crop photos.
Returns crop identification, growth stage, and problem detection.
"""
from __future__ import annotations
import base64
import json
import os
import requests
from io import BytesIO
from PIL import Image

_DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions"
_MODEL = "deepseek-chat"  # use deepseek-vision when available on your plan

_SYSTEM_PROMPT = """You are an agricultural image analyst. Analyse the provided crop image and return ONLY valid JSON.

OUTPUT SCHEMA:
{
  "crop": string,
  "confidence": number (0.0 to 1.0),
  "stage": "seedling" | "vegetative" | "flowering" | "grain_filling" | "mature" | "unknown",
  "problems": [string],
  "image_usable": boolean,
  "notes": string
}

If the image is too blurry or not a crop image, set image_usable to false. No markdown, no prose."""


def analyse_image(image_bytes: bytes) -> dict:
    """
    Convert image to base64 and call DeepSeek vision endpoint.
    """
    api_key = os.environ.get("DEEPSEEK_API_KEY", "")
    if not api_key:
        return _unusable("DeepSeek API key not configured")

    # Resize large images to reduce token cost
    try:
        img = Image.open(BytesIO(image_bytes))
        img.thumbnail((800, 800))
        buffer = BytesIO()
        img.save(buffer, format="JPEG", quality=85)
        encoded = base64.b64encode(buffer.getvalue()).decode("utf-8")
    except Exception as exc:
        return _unusable(f"Image processing failed: {exc}")

    payload = {
        "model": _MODEL,
        "messages": [
            {"role": "system", "content": _SYSTEM_PROMPT},
            {
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:image/jpeg;base64,{encoded}"},
                    },
                    {"type": "text", "text": "Analyse this crop image."},
                ],
            },
        ],
        "temperature": 0.1,
        "max_tokens": 512,
        "response_format": {"type": "json_object"},
    }

    try:
        resp = requests.post(
            _DEEPSEEK_API_URL,
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            json=payload,
            timeout=45,
        )
        resp.raise_for_status()
        raw = resp.json()["choices"][0]["message"]["content"]
        return json.loads(raw)
    except requests.RequestException as exc:
        return _unusable(f"API error: {exc}")
    except (KeyError, json.JSONDecodeError) as exc:
        return _unusable(f"Parse error: {exc}")


def _unusable(reason: str) -> dict:
    return {
        "crop": "unknown",
        "confidence": 0.0,
        "stage": "unknown",
        "problems": [],
        "image_usable": False,
        "notes": reason,
    }
