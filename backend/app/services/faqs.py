"""Load and search the curated policy and FAQ knowledge base."""

import json
import re
from functools import lru_cache
from pathlib import Path


@lru_cache
def all_faqs() -> list[dict]:
    path = Path(__file__).parent.parent / "data" / "faqs.json"
    return json.loads(path.read_text())


def search_faqs(question: str, limit: int = 3) -> list[tuple[float, dict]]:
    terms = set(re.findall(r"[a-z0-9]+", question.lower()))
    ranked: list[tuple[float, dict]] = []
    for faq in all_faqs():
        searchable = " ".join([faq["question"], faq["answer"], *faq["keywords"]]).lower()
        matches = sum(term in searchable for term in terms)
        phrase_bonus = sum(2 for keyword in faq["keywords"] if keyword in question.lower())
        score = (matches + phrase_bonus) / max(len(terms), 1)
        if score > 0:
            ranked.append((min(score, 1.0), faq))
    return sorted(ranked, key=lambda item: item[0], reverse=True)[:limit]
