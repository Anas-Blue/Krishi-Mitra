"""
FastAPI AI service — port 8000.
Node authenticates via X-Service-Key header.
Stateless: no MongoDB access, no session state.
"""
from __future__ import annotations
import os
from contextlib import asynccontextmanager
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, HTTPException, Request, UploadFile, File, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

import yield_model as ym
import challenger as ch
import vision as vs


# ---------------------------------------------------------------------------
# Service-key auth middleware
# ---------------------------------------------------------------------------

_SERVICE_KEY = os.environ.get("SERVICE_KEY", "")


def verify_service_key(request: Request) -> None:
    if not _SERVICE_KEY:
        raise HTTPException(status_code=500, detail="SERVICE_KEY not configured on AI service")
    incoming = request.headers.get("X-Service-Key", "")
    if incoming != _SERVICE_KEY:
        raise HTTPException(status_code=401, detail="Invalid service key")


# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Eagerly fail if model pkl is missing
    try:
        import yield_model  # noqa: F401 — triggers the load
    except RuntimeError as exc:
        raise RuntimeError(str(exc)) from exc
    yield


app = FastAPI(title="KrishiMitra AI Service", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class YieldPredictRequest(BaseModel):
    crop: str
    season: str = "Kharif"
    state: str
    area_ha: float = Field(..., gt=0)
    annual_rainfall_mm: float = Field(default=0.0, ge=0)
    # None means "use the state's median intensity". The previous defaults of
    # 100 and 5 kg/ha were guesses, and 5 kg/ha of pesticide sits ~13x above the
    # training data's maximum, so every unspecified request was extrapolating.
    fertilizer_kg_ha: Optional[float] = Field(default=None, ge=0)
    pesticide_kg_ha: Optional[float] = Field(default=None, ge=0)
    gdd_pct: float = Field(default=0.5, ge=0, le=1)
    tmax_series: list[float] = Field(default_factory=list)
    daily_rainfall: list[float] = Field(default_factory=list)


class ChallengeRequest(BaseModel):
    recommendation: str
    evidence: dict


class ExplainRequest(BaseModel):
    language: str = "en"
    advisory: dict


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/health")
def health():
    return {"status": "ok", "service": "krishi-ai"}


@app.get("/model-info")
def model_info():
    """
    Published accuracy of the shipped model, measured on a temporal holdout the
    model never saw. Exposed so the number in the UI can be traced to a
    measurement instead of being folklore.
    """
    return {"success": True, "data": ym.model_info()}


@app.get("/crops")
def supported_crops():
    return {"success": True, "data": {"crops": ym.supported_crops()}}


@app.post("/predict-yield", dependencies=[Depends(verify_service_key)])
def predict_yield(body: YieldPredictRequest):
    try:
        result = ym.predict(
            crop=body.crop,
            season=body.season,
            state=body.state,
            area_ha=body.area_ha,
            annual_rainfall_mm=body.annual_rainfall_mm,
            fertilizer_kg_ha=body.fertilizer_kg_ha,
            pesticide_kg_ha=body.pesticide_kg_ha,
            gdd_pct=body.gdd_pct,
            tmax_series=body.tmax_series,
            daily_rainfall=body.daily_rainfall,
        )
        return {"success": True, "data": result}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.post("/challenge", dependencies=[Depends(verify_service_key)])
def challenge_recommendation(body: ChallengeRequest):
    try:
        result = ch.challenge(body.recommendation, body.evidence)
        return {"success": True, "data": result}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.post("/vision", dependencies=[Depends(verify_service_key)])
async def analyse_crop_photo(
    file: UploadFile = File(...),
    request: Request = None,
):
    verify_service_key(request)
    image_bytes = await file.read()
    if len(image_bytes) > 10 * 1024 * 1024:  # 10MB cap
        raise HTTPException(status_code=413, detail="Image too large (max 10MB)")
    result = vs.analyse_image(image_bytes)
    return {"success": True, "data": result}


@app.post("/explain", dependencies=[Depends(verify_service_key)])
def explain_advisory(body: ExplainRequest):
    """
    Generate a farmer-facing explanation in the requested language.
    Uses DeepSeek chat with a translation + simplification prompt.
    """
    import json
    import requests as req_lib

    api_key = os.environ.get("DEEPSEEK_API_KEY", "")
    if not api_key:
        return {"success": True, "data": {"explanation": _fallback_explanation(body.advisory, body.language)}}

    lang_label = "Hindi" if body.language == "hi" else "simple English"
    prompt = (
        f"You are an agricultural extension officer. Explain the following advisory to a farmer in {lang_label}. "
        f"Keep it under 80 words. Be direct and actionable. No jargon.\n\n"
        f"Advisory data:\n{json.dumps(body.advisory, ensure_ascii=False)}"
    )

    try:
        resp = req_lib.post(
            "https://api.deepseek.com/chat/completions",
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            json={
                "model": "deepseek-chat",
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.3,
                "max_tokens": 200,
            },
            timeout=20,
        )
        resp.raise_for_status()
        explanation = resp.json()["choices"][0]["message"]["content"].strip()
        return {"success": True, "data": {"explanation": explanation}}
    except Exception as exc:
        return {"success": True, "data": {"explanation": _fallback_explanation(body.advisory, body.language)}}


def _fallback_explanation(advisory: dict, language: str) -> str:
    action = advisory.get("finalAction", advisory.get("final_action", "HOLD"))
    if language == "hi":
        return f"आपके खेत की जांच पूरी हो गई। अनुशंसित कार्रवाई: {action}. अधिक जानकारी के लिए कृषि अधिकारी से संपर्क करें।"
    return f"Field check complete. Recommended action: {action}. Contact your agricultural officer for details."
