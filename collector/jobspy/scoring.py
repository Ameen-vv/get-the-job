from datetime import datetime, timezone

def score_job(job: dict, cfg: dict) -> int:
    score = 0
    title_lower = job["title"].lower()
    location_lower = (job.get("location") or "").lower()
    company_lower = job["company"].lower()

    search_titles = {t.lower() for t in cfg.get("titles", [])}

    # Title — exact match beats partial
    if title_lower in search_titles:
        score += 3
    elif any(kw in title_lower for kw in cfg.get("primary_title_keywords", set())):
        score += 2
    elif any(kw in title_lower for kw in cfg.get("stack_keywords", set())):
        score += 1

    # Location — use user's preferred cities from DB
    target_cities = cfg.get("target_cities", set())
    if any(city in location_lower for city in target_cities):
        score += 2
    elif "remote" in location_lower:
        score += 1

    # Freshness
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

    # Has apply URL
    if job.get("url"):
        score += 1

    # Top company bonus
    top_companies = cfg.get("top_companies", set())
    if any(tc in company_lower for tc in top_companies):
        score += 2

    return score
