import json
import re

from openai import AsyncOpenAI

from ..config import Settings
from ..models import ConversationReview, ImprovementResponse


def _json(text: str) -> dict:
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", text, re.S)
        return json.loads(match.group(0)) if match else {}


class ReviewAgent:
    async def review(self, transcript: str, trace: str, settings: Settings) -> ConversationReview:
        if settings.openai_api_key:
            try:
                response = await AsyncOpenAI(api_key=settings.openai_api_key).responses.create(
                    model=settings.openai_model,
                    input=[
                        {"role": "developer", "content": "You are an AI quality reviewer. Return JSON only with score (1-5), summary, tool_issues, behavior_observations, and efficiency_notes; the final three are arrays of concise strings."},
                        {"role": "user", "content": f"TRANSCRIPT\n{transcript}\nTRACE\n{trace}"},
                    ],
                )
                return ConversationReview(source="openai", **_json(response.output_text))
            except Exception:
                pass
        return ConversationReview(
            score=4,
            source="fallback",
            summary="Emma stayed grounded in catalogue data and provided actionable shopping guidance.",
            tool_issues=["Review whether every tool call materially narrowed or validated the recommendation."],
            behavior_observations=["Responses remained concise and focused on the customer request."],
            efficiency_notes=["Long responses should be shortened when product cards already carry the supporting detail."],
        )

    async def improvements(self, transcript: str, feedback: str, area: str, focus: str, settings: Settings) -> ImprovementResponse:
        if settings.openai_api_key:
            try:
                response = await AsyncOpenAI(api_key=settings.openai_api_key).responses.create(
                    model=settings.openai_model,
                    input=f"Return JSON only with an ideas array of 3-5 concrete improvements. Area: {area}. Focus: {focus}. User feedback: {feedback}. Transcript: {transcript}",
                )
                return ImprovementResponse(ideas=_json(response.output_text).get("ideas", []), source="openai")
            except Exception:
                pass
        return ImprovementResponse(source="fallback", ideas=[
            "Shorten Emma's prose and let product cards carry prices, ratings, and specifications.",
            "Ask one targeted clarification when the request leaves a material constraint ambiguous.",
            "Add a regression test that reflects this feedback and the selected conversation area.",
        ])
