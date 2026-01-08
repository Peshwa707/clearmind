import os
import json
from anthropic import Anthropic
from typing import List, Dict, Optional

COACH_SYSTEM_PROMPT = """You are a practical life coach helping someone process racing thoughts. Your style:
- Acknowledge their feelings briefly, then focus on understanding the core issue
- Ask clarifying questions to break down vague worries into specific concerns
- Help identify what's in their control vs. what isn't
- Suggest small, actionable next steps when appropriate
- Keep responses concise (2-3 sentences typical, max 4)
- End with a question to keep the conversation going, unless they seem ready to wrap up

Important: Be warm but practical. Don't be overly therapeutic or use clinical language. Talk like a supportive friend who's good at problem-solving."""

SUMMARY_SYSTEM_PROMPT = """You are analyzing a conversation between a user and a life coach. The user was processing racing thoughts or worries.

Analyze the conversation and provide a structured summary in JSON format:
{
    "summary": "A 1-2 sentence summary of what the user was working through",
    "themes": ["theme1", "theme2"],
    "emotions": ["emotion1", "emotion2"],
    "action_items": ["action1", "action2"]
}

Theme categories to use: work, relationships, health, finance, self, family, social, future, past, other
Emotion categories to use: anxious, overwhelmed, sad, angry, frustrated, confused, hopeful, relieved, other

Action items should be specific, actionable steps discussed or implied in the conversation.
If no clear action items emerged, provide 1-2 gentle suggestions based on what was discussed.

Respond ONLY with valid JSON."""


def get_anthropic_client():
    """Get Anthropic client, returns None if API key not configured."""
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key or api_key == "your_api_key_here":
        return None
    return Anthropic(api_key=api_key)


async def get_chat_response(
    message: str,
    conversation_history: List[Dict[str, str]]
) -> Dict:
    """
    Get a coaching response from Claude based on the user's message
    and conversation history.
    """
    client = get_anthropic_client()

    if client is None:
        return get_fallback_response(message, conversation_history)

    try:
        # Build messages list from history
        messages = []
        for msg in conversation_history:
            messages.append({
                "role": msg["role"],
                "content": msg["content"]
            })

        # Add current message
        messages.append({
            "role": "user",
            "content": message
        })

        response = client.messages.create(
            model="claude-3-haiku-20240307",
            max_tokens=300,
            system=COACH_SYSTEM_PROMPT,
            messages=messages
        )

        bot_response = response.content[0].text

        # Detect emotion and themes from the message
        metadata = await analyze_message_metadata(message, bot_response)

        return {
            "success": True,
            "response": bot_response,
            "metadata": metadata
        }

    except Exception as e:
        print(f"Chat error: {e}")
        return get_fallback_response(message, conversation_history)


async def analyze_message_metadata(user_message: str, bot_response: str) -> Dict:
    """Analyze the message for emotion and theme metadata."""
    # Simple keyword-based detection for real-time metadata
    message_lower = user_message.lower()

    # Emotion detection
    emotions = []
    emotion_keywords = {
        "anxious": ["anxious", "worried", "nervous", "stress", "panic", "fear"],
        "overwhelmed": ["overwhelmed", "too much", "can't handle", "drowning", "exhausted"],
        "sad": ["sad", "depressed", "down", "unhappy", "hopeless", "crying"],
        "angry": ["angry", "mad", "furious", "annoyed", "irritated", "frustrated"],
        "frustrated": ["frustrated", "stuck", "blocked", "can't", "impossible"],
        "confused": ["confused", "don't know", "uncertain", "lost", "unclear"],
    }

    for emotion, keywords in emotion_keywords.items():
        if any(kw in message_lower for kw in keywords):
            emotions.append(emotion)

    if not emotions:
        emotions = ["processing"]

    # Theme detection
    themes = []
    theme_keywords = {
        "work": ["work", "job", "boss", "colleague", "deadline", "project", "career", "office"],
        "relationships": ["relationship", "partner", "boyfriend", "girlfriend", "spouse", "dating"],
        "family": ["family", "parent", "mom", "dad", "sibling", "child", "kid"],
        "health": ["health", "sick", "doctor", "tired", "sleep", "exercise", "body"],
        "finance": ["money", "bills", "debt", "afford", "salary", "pay", "financial"],
        "social": ["friend", "social", "lonely", "people", "party", "gathering"],
        "future": ["future", "tomorrow", "plan", "goal", "dream", "someday"],
        "self": ["myself", "self", "worth", "confidence", "identity", "purpose"],
    }

    for theme, keywords in theme_keywords.items():
        if any(kw in message_lower for kw in keywords):
            themes.append(theme)

    if not themes:
        themes = ["general"]

    return {
        "detected_emotions": emotions[:2],
        "themes": themes[:2],
        "is_complete": False
    }


async def summarize_session(conversation_history: List[Dict[str, str]]) -> Dict:
    """
    Generate a summary of the conversation session including
    themes, emotions, and action items.
    """
    client = get_anthropic_client()

    if client is None:
        return get_fallback_summary(conversation_history)

    try:
        # Format conversation for analysis
        conversation_text = "\n".join([
            f"{'User' if msg['role'] == 'user' else 'Coach'}: {msg['content']}"
            for msg in conversation_history
        ])

        response = client.messages.create(
            model="claude-3-haiku-20240307",
            max_tokens=500,
            system=SUMMARY_SYSTEM_PROMPT,
            messages=[{
                "role": "user",
                "content": f"Please analyze this conversation:\n\n{conversation_text}"
            }]
        )

        result = json.loads(response.content[0].text)

        return {
            "success": True,
            "summary": result.get("summary", "Session completed."),
            "themes": result.get("themes", ["general"]),
            "emotions": result.get("emotions", ["processing"]),
            "action_items": result.get("action_items", [])
        }

    except json.JSONDecodeError:
        return get_fallback_summary(conversation_history)
    except Exception as e:
        print(f"Summary error: {e}")
        return get_fallback_summary(conversation_history)


def get_fallback_response(message: str, history: List[Dict]) -> Dict:
    """Fallback response when AI is unavailable."""
    # Simple rule-based responses
    message_lower = message.lower()

    if len(history) == 0:
        response = "I hear you. That sounds like a lot to deal with. What feels like the most pressing concern right now?"
    elif any(word in message_lower for word in ["don't know", "not sure", "confused"]):
        response = "That's okay - sometimes things feel unclear. Can you describe what you're feeling in your body right now? Sometimes that helps us understand what's really going on."
    elif any(word in message_lower for word in ["stressed", "overwhelmed", "too much"]):
        response = "It makes sense you're feeling that way. Let's try to break this down. If you could only focus on one thing today, what would have the biggest impact?"
    elif any(word in message_lower for word in ["can't", "impossible", "stuck"]):
        response = "I understand it feels that way right now. What's one small step - even tiny - that might move things forward?"
    else:
        response = "Thanks for sharing that. What do you think is the core issue here? Sometimes naming it specifically helps."

    return {
        "success": True,
        "response": response,
        "metadata": {
            "detected_emotions": ["processing"],
            "themes": ["general"],
            "is_complete": False
        }
    }


async def categorize_thought(thought: str) -> Dict:
    """
    Categorize a single thought/rambling into themes and emotions.
    Used for ambient listening mode.
    """
    client = get_anthropic_client()

    if client is None or len(thought.strip()) < 10:
        return get_fallback_categorization(thought)

    try:
        response = client.messages.create(
            model="claude-3-haiku-20240307",
            max_tokens=200,
            messages=[{
                "role": "user",
                "content": f"""Categorize this thought snippet. Respond in JSON only:
{{
    "themes": ["theme1"],
    "emotions": ["emotion1"],
    "key_phrase": "short summary phrase"
}}

Themes: work, relationships, family, health, finance, social, future, self, past, other
Emotions: anxious, overwhelmed, sad, angry, frustrated, confused, hopeful, relieved, neutral

Thought: "{thought}"

JSON:"""
            }]
        )

        result = json.loads(response.content[0].text)
        return {
            "success": True,
            "themes": result.get("themes", ["general"])[:2],
            "emotions": result.get("emotions", ["neutral"])[:2],
            "key_phrase": result.get("key_phrase", thought[:50])
        }

    except Exception as e:
        print(f"Categorization error: {e}")
        return get_fallback_categorization(thought)


def get_fallback_categorization(thought: str) -> Dict:
    """Fallback categorization using keywords."""
    thought_lower = thought.lower()

    themes = []
    theme_keywords = {
        "work": ["work", "job", "boss", "deadline", "project", "meeting"],
        "relationships": ["relationship", "partner", "boyfriend", "girlfriend"],
        "family": ["family", "mom", "dad", "parent", "kid", "child"],
        "health": ["health", "sick", "tired", "sleep", "doctor"],
        "finance": ["money", "bills", "pay", "afford", "debt"],
        "future": ["future", "tomorrow", "plan", "goal", "worried about"],
        "self": ["myself", "I am", "I feel", "I think", "I need"],
    }

    for theme, keywords in theme_keywords.items():
        if any(kw in thought_lower for kw in keywords):
            themes.append(theme)

    emotions = []
    emotion_keywords = {
        "anxious": ["anxious", "worried", "nervous", "stress"],
        "overwhelmed": ["overwhelmed", "too much", "can't handle"],
        "frustrated": ["frustrated", "annoyed", "stuck"],
        "sad": ["sad", "down", "depressed"],
        "confused": ["confused", "don't know", "unclear"],
    }

    for emotion, keywords in emotion_keywords.items():
        if any(kw in thought_lower for kw in keywords):
            emotions.append(emotion)

    return {
        "success": True,
        "themes": themes[:2] if themes else ["general"],
        "emotions": emotions[:2] if emotions else ["neutral"],
        "key_phrase": thought[:50] + ("..." if len(thought) > 50 else "")
    }


async def analyze_cognitive_distortions(thought: str) -> Dict:
    """
    Analyze a thought for cognitive distortions and provide reframes.
    """
    client = get_anthropic_client()

    if client is None or len(thought.strip()) < 10:
        return get_fallback_distortion_analysis(thought)

    try:
        response = client.messages.create(
            model="claude-3-haiku-20240307",
            max_tokens=500,
            messages=[{
                "role": "user",
                "content": f"""Analyze this thought for cognitive distortions. Respond in JSON only:
{{
    "distortions": [
        {{
            "type": "distortion name",
            "explanation": "brief explanation of how this distortion appears",
            "reframe": "a healthier way to think about this"
        }}
    ],
    "balanced_thought": "a more balanced version of the original thought"
}}

Common distortions: all-or-nothing thinking, catastrophizing, mind reading, fortune telling, emotional reasoning, should statements, labeling, personalization, mental filter, discounting positives

Thought: "{thought}"

JSON:"""
            }]
        )

        result = json.loads(response.content[0].text)
        return {
            "success": True,
            "distortions": result.get("distortions", []),
            "balanced_thought": result.get("balanced_thought", thought)
        }

    except Exception as e:
        print(f"Distortion analysis error: {e}")
        return get_fallback_distortion_analysis(thought)


def get_fallback_distortion_analysis(thought: str) -> Dict:
    """Fallback distortion analysis using keywords."""
    thought_lower = thought.lower()
    distortions = []

    # Simple pattern matching for common distortions
    if any(word in thought_lower for word in ["always", "never", "everyone", "no one", "everything", "nothing"]):
        distortions.append({
            "type": "All-or-Nothing Thinking",
            "explanation": "Using absolute terms like 'always' or 'never'",
            "reframe": "Consider: Are there exceptions? Is the situation more nuanced?"
        })

    if any(word in thought_lower for word in ["worst", "terrible", "disaster", "catastrophe", "ruined"]):
        distortions.append({
            "type": "Catastrophizing",
            "explanation": "Expecting the worst possible outcome",
            "reframe": "What's a more realistic outcome? What would you tell a friend?"
        })

    if any(phrase in thought_lower for phrase in ["they think", "they must think", "everyone thinks"]):
        distortions.append({
            "type": "Mind Reading",
            "explanation": "Assuming you know what others are thinking",
            "reframe": "Do you have evidence for this? Could there be other explanations?"
        })

    if any(word in thought_lower for word in ["should", "must", "have to", "ought to"]):
        distortions.append({
            "type": "Should Statements",
            "explanation": "Rigid rules about how things 'should' be",
            "reframe": "Replace 'should' with 'I would prefer' or 'It would be nice if'"
        })

    if any(word in thought_lower for word in ["i feel like", "i feel that"]):
        distortions.append({
            "type": "Emotional Reasoning",
            "explanation": "Treating feelings as facts",
            "reframe": "Feelings are valid but not always accurate reflections of reality"
        })

    if not distortions:
        distortions.append({
            "type": "None detected",
            "explanation": "No obvious cognitive distortions found",
            "reframe": "This thought seems relatively balanced"
        })

    return {
        "success": True,
        "distortions": distortions,
        "balanced_thought": "Consider the evidence and explore alternative perspectives."
    }


async def generate_action_plan(thought: str, context: str = "") -> Dict:
    """
    Break down a thought/concern into actionable steps.
    """
    client = get_anthropic_client()

    if client is None or len(thought.strip()) < 10:
        return get_fallback_action_plan(thought)

    try:
        response = client.messages.create(
            model="claude-3-haiku-20240307",
            max_tokens=400,
            messages=[{
                "role": "user",
                "content": f"""Create an action plan for this concern. Respond in JSON only:
{{
    "goal": "the main goal or outcome",
    "steps": [
        {{
            "action": "specific action to take",
            "timeframe": "when to do it (today, this week, etc.)",
            "difficulty": "easy/medium/hard"
        }}
    ],
    "first_step": "the very first small action to take right now"
}}

Keep steps practical, specific, and achievable. Maximum 5 steps.

Concern: "{thought}"
{f"Additional context: {context}" if context else ""}

JSON:"""
            }]
        )

        result = json.loads(response.content[0].text)
        return {
            "success": True,
            "goal": result.get("goal", "Address the concern"),
            "steps": result.get("steps", []),
            "first_step": result.get("first_step", "Take a moment to reflect on what you can control")
        }

    except Exception as e:
        print(f"Action plan error: {e}")
        return get_fallback_action_plan(thought)


def get_fallback_action_plan(thought: str) -> Dict:
    """Fallback action plan generator."""
    return {
        "success": True,
        "goal": "Work through this concern step by step",
        "steps": [
            {"action": "Write down the specific concern clearly", "timeframe": "today", "difficulty": "easy"},
            {"action": "Identify what's in your control vs. what isn't", "timeframe": "today", "difficulty": "easy"},
            {"action": "Choose one small action you can take", "timeframe": "this week", "difficulty": "medium"},
            {"action": "Set a reminder to check progress", "timeframe": "next week", "difficulty": "easy"}
        ],
        "first_step": "Take 2 minutes to write down exactly what's bothering you"
    }


async def create_reminder(thought: str, note: str = "") -> Dict:
    """
    Generate a reminder suggestion based on a thought.
    """
    client = get_anthropic_client()

    if client is None:
        return {
            "success": True,
            "reminder_text": note or "Check in on this thought",
            "suggested_time": "tomorrow morning",
            "category": "reflection"
        }

    try:
        response = client.messages.create(
            model="claude-3-haiku-20240307",
            max_tokens=150,
            messages=[{
                "role": "user",
                "content": f"""Create a gentle reminder for someone who had this thought. Respond in JSON:
{{
    "reminder_text": "encouraging reminder message",
    "suggested_time": "when to remind (e.g., tomorrow morning, in 3 days)",
    "category": "reflection/action/check-in"
}}

Thought: "{thought}"
{f"User note: {note}" if note else ""}

JSON:"""
            }]
        )

        result = json.loads(response.content[0].text)
        return {
            "success": True,
            "reminder_text": result.get("reminder_text", "Check in on this thought"),
            "suggested_time": result.get("suggested_time", "tomorrow"),
            "category": result.get("category", "reflection")
        }

    except Exception as e:
        print(f"Reminder error: {e}")
        return {
            "success": True,
            "reminder_text": note or "Take a moment to reflect on your progress",
            "suggested_time": "tomorrow morning",
            "category": "reflection"
        }


def get_fallback_summary(conversation_history: List[Dict]) -> Dict:
    """Fallback summary when AI is unavailable."""
    # Count user messages to estimate themes
    user_messages = [m["content"].lower() for m in conversation_history if m["role"] == "user"]
    all_text = " ".join(user_messages)

    themes = []
    if any(word in all_text for word in ["work", "job", "boss"]):
        themes.append("work")
    if any(word in all_text for word in ["family", "parent", "kid"]):
        themes.append("family")
    if any(word in all_text for word in ["relationship", "partner"]):
        themes.append("relationships")
    if not themes:
        themes = ["general"]

    emotions = []
    if any(word in all_text for word in ["anxious", "worried", "stress"]):
        emotions.append("anxious")
    if any(word in all_text for word in ["overwhelmed", "too much"]):
        emotions.append("overwhelmed")
    if not emotions:
        emotions = ["processing"]

    return {
        "success": True,
        "summary": "You took time to process your thoughts and work through what's on your mind.",
        "themes": themes,
        "emotions": emotions,
        "action_items": [
            "Take a few deep breaths when feeling overwhelmed",
            "Write down one small step you can take tomorrow"
        ]
    }
