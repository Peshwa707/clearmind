import os
import json
from anthropic import Anthropic
from pathlib import Path

# Load distortions data
data_dir = Path(__file__).parent.parent / "data"
with open(data_dir / "distortions.json", "r") as f:
    DISTORTIONS_DATA = json.load(f)

DISTORTIONS = {d["id"]: d for d in DISTORTIONS_DATA["distortions"]}


def get_anthropic_client():
    """Get Anthropic client, returns None if API key not configured."""
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key or api_key == "your_api_key_here":
        return None
    return Anthropic(api_key=api_key)


def create_analysis_prompt(thought: str) -> str:
    """Create the prompt for analyzing a thought."""
    distortions_list = "\n".join([
        f"- {d['id']}: {d['name']} - {d['description']}"
        for d in DISTORTIONS_DATA["distortions"]
    ])

    return f"""You are a compassionate cognitive behavioral therapy (CBT) assistant. Analyze the following thought and identify any cognitive distortions present.

THOUGHT TO ANALYZE:
"{thought}"

COGNITIVE DISTORTIONS TO CHECK FOR:
{distortions_list}

Please respond in the following JSON format:
{{
    "identified_distortions": [
        {{
            "distortion_id": "the_distortion_id",
            "confidence": 0.0 to 1.0,
            "explanation": "Brief explanation of why this distortion applies to this thought"
        }}
    ],
    "reframes": [
        {{
            "perspective": "A healthier way to view this situation",
            "explanation": "Why this perspective is more balanced"
        }}
    ],
    "compassionate_response": "A warm, supportive message acknowledging the person's feelings while gently encouraging a different perspective",
    "suggested_exercises": ["exercise_id_1", "exercise_id_2"]
}}

Guidelines:
- Only identify distortions that are clearly present (confidence > 0.6)
- Provide 2-3 reframes that are realistic and achievable
- Be warm and non-judgmental in your compassionate response
- Suggest 1-3 exercises that would be most helpful
- Focus on validation first, then gentle reframing

Respond ONLY with valid JSON, no additional text."""


async def analyze_thought_with_ai(thought: str) -> dict:
    """
    Analyze a thought using Claude API to identify cognitive distortions
    and generate reframes.
    """
    client = get_anthropic_client()

    if client is None:
        # Fallback to rule-based analysis if no API key
        return analyze_thought_rule_based(thought)

    try:
        message = client.messages.create(
            model="claude-3-haiku-20240307",
            max_tokens=1024,
            messages=[
                {
                    "role": "user",
                    "content": create_analysis_prompt(thought)
                }
            ]
        )

        response_text = message.content[0].text
        result = json.loads(response_text)

        # Enrich with full distortion data
        enriched_distortions = []
        for d in result.get("identified_distortions", []):
            distortion_id = d.get("distortion_id")
            if distortion_id in DISTORTIONS:
                enriched_distortions.append({
                    **DISTORTIONS[distortion_id],
                    "confidence": d.get("confidence", 0.7),
                    "specific_explanation": d.get("explanation", "")
                })

        return {
            "success": True,
            "original_thought": thought,
            "identified_distortions": enriched_distortions,
            "reframes": result.get("reframes", []),
            "compassionate_response": result.get("compassionate_response", ""),
            "suggested_exercises": result.get("suggested_exercises", []),
            "analysis_method": "ai"
        }

    except json.JSONDecodeError:
        # If AI response isn't valid JSON, fall back to rule-based
        return analyze_thought_rule_based(thought)
    except Exception as e:
        print(f"AI analysis error: {e}")
        return analyze_thought_rule_based(thought)


def analyze_thought_rule_based(thought: str) -> dict:
    """
    Fallback rule-based analysis using keyword matching.
    Used when AI is unavailable or fails.
    """
    thought_lower = thought.lower()
    identified = []

    for distortion in DISTORTIONS_DATA["distortions"]:
        for keyword in distortion.get("keywords", []):
            if keyword.lower() in thought_lower:
                identified.append({
                    **distortion,
                    "confidence": 0.6,
                    "specific_explanation": f"Your thought contains '{keyword}', which may indicate {distortion['name'].lower()}."
                })
                break

    # Generate simple reframes based on identified distortions
    reframes = []
    for d in identified[:2]:  # Max 2 reframes
        reframes.append({
            "perspective": d.get("reframe_prompt", "Consider an alternative perspective."),
            "explanation": f"This helps counter {d['name'].lower()}."
        })

    # Suggest exercises based on what distortions were found
    suggested_exercises = set()
    for d in identified:
        # This would ideally reference exercises.json, but keeping it simple
        if d["id"] in ["all_or_nothing", "overgeneralization"]:
            suggested_exercises.add("thought_record")
        if d["id"] in ["magnification", "emotional_reasoning"]:
            suggested_exercises.add("grounding_54321")
        if d["id"] in ["should_statements"]:
            suggested_exercises.add("should_to_could")
        if d["id"] == "personalization":
            suggested_exercises.add("responsibility_pie")

    return {
        "success": True,
        "original_thought": thought,
        "identified_distortions": identified[:3],  # Max 3
        "reframes": reframes if reframes else [{
            "perspective": "Consider whether there might be another way to look at this situation.",
            "explanation": "Taking a step back can help us see things more clearly."
        }],
        "compassionate_response": "It's understandable to have thoughts like this. Many people experience similar thinking patterns. Remember, thoughts are not facts, and you have the power to examine and reshape them.",
        "suggested_exercises": list(suggested_exercises)[:3],
        "analysis_method": "rule_based"
    }
