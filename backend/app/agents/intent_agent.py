import re

from ..models import IntentResult


class IntentAgent:
    """Fast deterministic router; ambiguous requests remain with shopping."""

    def detect(self, message: str) -> IntentResult:
        text = message.lower()
        rules = [
            ("return", r"\b(return|refund)\s+(?:my\s+)?order\b"),
            ("order_tracking", r"\b(track|tracking|where is|order status)\b"),
            ("comparison", r"\b(compare|versus|vs\.?|difference between)\b"),
            ("support", r"\b(policy|shipping|delivery|faq|warranty|help|return|refund)\b"),
        ]
        for intent, pattern in rules:
            if re.search(pattern, text):
                return IntentResult(intent=intent, confidence=0.9)
        return IntentResult(intent="shopping", confidence=0.75)
