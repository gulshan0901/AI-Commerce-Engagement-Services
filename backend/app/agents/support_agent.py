from ..models import FaqSource, SupportRequest, SupportResponse
from ..services.faqs import search_faqs


class SupportAgent:
    """Answers only from curated commerce FAQs and flags low-confidence cases."""

    def run(self, request: SupportRequest) -> SupportResponse:
        matches = search_faqs(request.question)
        if not matches or matches[0][0] < 0.25:
            return SupportResponse(
                answer="I couldn't find a reliable answer in the current support knowledge base. A human support specialist should review this question.",
                sources=[], confidence=0.0, escalate=True,
            )
        confidence, best = matches[0]
        return SupportResponse(
            answer=best["answer"],
            sources=[FaqSource(id=faq["id"], question=faq["question"]) for _, faq in matches],
            confidence=confidence,
            escalate=confidence < 0.4,
        )
