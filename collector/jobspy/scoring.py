from datetime import datetime, timezone

from config import (
    MIN_SCORE,
    PRIMARY_TITLE_KEYWORDS,
    STACK_KEYWORDS,
    TARGET_CITIES,
    TITLES,
)

_SEARCH_TITLES = {t.lower() for t in TITLES}


def score_job(job: dict) -> int:
    score = 0
    title_lower = job["title"].lower()
    location_lower = (job.get("location") or "").lower()

    if title_lower in _SEARCH_TITLES:
        score += 3
    elif any(kw in title_lower for kw in PRIMARY_TITLE_KEYWORDS):
        score += 2
    elif any(kw in title_lower for kw in STACK_KEYWORDS):
        score += 1

    if any(city in location_lower for city in TARGET_CITIES):
        score += 2
    elif "remote" in location_lower:
        score += 1

    posted_at = job.get("posted_at")
    if posted_at:
        try:
            posted = datetime.fromisoformat(posted_at.replace("Z", "+00:00"))
            hours_old = (datetime.now(timezone.utc) - posted).total_seconds() / 3600
            if hours_old <= 24:
                score += 2
            elif hours_old <= 72:
                score += 1
        except Exception:
            pass

    if job.get("url"):
        score += 1

    return score


def is_worth_importing(job: dict) -> bool:
    return score_job(job) >= MIN_SCORE
