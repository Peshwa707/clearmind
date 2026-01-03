from fastapi import APIRouter, HTTPException
import json
from pathlib import Path

router = APIRouter()

# Load exercises data
data_dir = Path(__file__).parent.parent / "data"
with open(data_dir / "exercises.json", "r") as f:
    EXERCISES_DATA = json.load(f)

EXERCISES = {e["id"]: e for e in EXERCISES_DATA["exercises"]}
CATEGORIES = {c["id"]: c for c in EXERCISES_DATA["categories"]}


@router.get("/exercises")
async def list_exercises(category: str = None, distortion: str = None):
    """
    Get all CBT exercises, optionally filtered by category or distortion.

    Query Parameters:
    - category: Filter by exercise category (e.g., 'cognitive_restructuring', 'mindfulness')
    - distortion: Filter by distortion the exercise helps with (e.g., 'all_or_nothing')
    """
    exercises = EXERCISES_DATA["exercises"]

    if category:
        exercises = [e for e in exercises if e.get("category") == category]

    if distortion:
        exercises = [e for e in exercises if distortion in e.get("helpful_for", [])]

    return {
        "exercises": exercises,
        "categories": EXERCISES_DATA["categories"],
        "total": len(exercises)
    }


@router.get("/exercises/{exercise_id}")
async def get_exercise(exercise_id: str):
    """
    Get detailed information about a specific exercise.
    """
    if exercise_id not in EXERCISES:
        raise HTTPException(
            status_code=404,
            detail=f"Exercise '{exercise_id}' not found"
        )

    exercise = EXERCISES[exercise_id]
    category = CATEGORIES.get(exercise.get("category"), {})

    return {
        "exercise": exercise,
        "category": category
    }


@router.get("/exercises/for-distortion/{distortion_id}")
async def get_exercises_for_distortion(distortion_id: str):
    """
    Get exercises recommended for a specific cognitive distortion.
    """
    matching = [
        e for e in EXERCISES_DATA["exercises"]
        if distortion_id in e.get("helpful_for", [])
    ]

    if not matching:
        return {
            "exercises": [],
            "message": f"No specific exercises found for '{distortion_id}'. Here are some general exercises.",
            "fallback": EXERCISES_DATA["exercises"][:3]
        }

    return {
        "distortion_id": distortion_id,
        "exercises": matching,
        "total": len(matching)
    }


@router.get("/categories")
async def list_categories():
    """
    Get all exercise categories.
    """
    return {
        "categories": EXERCISES_DATA["categories"]
    }
