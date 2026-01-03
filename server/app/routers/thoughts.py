from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
from app.services.ai_analyzer import analyze_thought_with_ai

router = APIRouter()


class ThoughtInput(BaseModel):
    """Input model for thought analysis."""
    thought: str = Field(
        ...,
        min_length=10,
        max_length=2000,
        description="The thought or feeling to analyze"
    )


class AnalysisResponse(BaseModel):
    """Response model for thought analysis."""
    success: bool
    original_thought: str
    identified_distortions: list
    reframes: list
    compassionate_response: str
    suggested_exercises: list
    analysis_method: str


@router.post("/analyze", response_model=AnalysisResponse)
async def analyze_thought(input_data: ThoughtInput):
    """
    Analyze a thought for cognitive distortions and provide reframes.

    This endpoint uses AI (Claude) to identify cognitive distortions,
    generate healthier perspectives, and suggest CBT exercises.

    Falls back to rule-based analysis if AI is unavailable.
    """
    try:
        result = await analyze_thought_with_ai(input_data.thought)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error analyzing thought: {str(e)}"
        )


@router.get("/distortions")
async def list_distortions():
    """
    Get a list of all cognitive distortions with descriptions.
    """
    import json
    from pathlib import Path

    data_dir = Path(__file__).parent.parent / "data"
    with open(data_dir / "distortions.json", "r") as f:
        data = json.load(f)

    return {
        "distortions": [
            {
                "id": d["id"],
                "name": d["name"],
                "description": d["description"],
                "examples": d["examples"]
            }
            for d in data["distortions"]
        ]
    }
