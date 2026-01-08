from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional

from app.services.chat_service import get_chat_response, summarize_session

router = APIRouter()


class Message(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    message: str
    conversation_history: List[Message] = []


class SummarizeRequest(BaseModel):
    conversation_history: List[Message]


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
