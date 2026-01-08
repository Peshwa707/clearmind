from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional

from app.services.chat_service import (
    get_chat_response,
    summarize_session,
    categorize_thought,
    analyze_cognitive_distortions,
    generate_action_plan,
    create_reminder
)

router = APIRouter()


class Message(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    message: str
    conversation_history: List[Message] = []


class SummarizeRequest(BaseModel):
    conversation_history: List[Message]


class CategorizeRequest(BaseModel):
    thought: str


class AnalyzeDistortionsRequest(BaseModel):
    thought: str


class ActionPlanRequest(BaseModel):
    thought: str
    context: Optional[str] = ""


class ReminderRequest(BaseModel):
    thought: str
    note: Optional[str] = ""


@router.post("/chat")
async def chat(request: ChatRequest):
    """
    Send a message to the coaching bot and get a response.
    Maintains conversation context through history.
    """
    if not request.message or not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    # Convert Pydantic models to dicts
    history = [{"role": msg.role, "content": msg.content} for msg in request.conversation_history]

    result = await get_chat_response(request.message, history)

    if not result.get("success"):
        raise HTTPException(status_code=500, detail="Failed to generate response")

    return result


@router.post("/chat/summarize")
async def summarize(request: SummarizeRequest):
    """
    Generate a summary of the conversation session.
    Called when user ends the session.
    """
    if not request.conversation_history:
        raise HTTPException(status_code=400, detail="No conversation to summarize")

    # Convert Pydantic models to dicts
    history = [{"role": msg.role, "content": msg.content} for msg in request.conversation_history]

    result = await summarize_session(history)

    if not result.get("success"):
        raise HTTPException(status_code=500, detail="Failed to generate summary")

    return result


@router.post("/chat/categorize")
async def categorize(request: CategorizeRequest):
    """
    Categorize a thought snippet into themes and emotions.
    Used for ambient listening mode.
    """
    if not request.thought or len(request.thought.strip()) < 5:
        raise HTTPException(status_code=400, detail="Thought too short to categorize")

    result = await categorize_thought(request.thought)

    return result


@router.post("/chat/analyze-distortions")
async def analyze_distortions(request: AnalyzeDistortionsRequest):
    """
    Analyze a thought for cognitive distortions and provide reframes.
    """
    if not request.thought or len(request.thought.strip()) < 10:
        raise HTTPException(status_code=400, detail="Thought too short to analyze")

    result = await analyze_cognitive_distortions(request.thought)

    return result


@router.post("/chat/action-plan")
async def action_plan(request: ActionPlanRequest):
    """
    Generate an action plan from a thought or concern.
    """
    if not request.thought or len(request.thought.strip()) < 10:
        raise HTTPException(status_code=400, detail="Thought too short for action plan")

    result = await generate_action_plan(request.thought, request.context or "")

    return result


@router.post("/chat/reminder")
async def reminder(request: ReminderRequest):
    """
    Generate a reminder suggestion for a thought.
    """
    if not request.thought or len(request.thought.strip()) < 5:
        raise HTTPException(status_code=400, detail="Thought too short for reminder")

    result = await create_reminder(request.thought, request.note or "")

    return result
