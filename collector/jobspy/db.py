"""
Fetches collector config from the Supabase preferences table.

MULTI-USER LIMITATIONS (acceptable for single-user, revisit when scaling):

1. EXCLUDED KEYWORDS — unioned across all users. If User A excludes "manager"
   but User B doesn't, jobs with "manager" are dropped for User B too.
   Fix: use intersection (exclude only what ALL users agree on), or move
   filtering to the Jobs page per-user.

2. JOB RECENCY (hours_old) — we use the minimum across users. If User A wants
   24h and User B wants 7 days, User B never sees jobs older than 24h.
   Fix: use the maximum instead, or make it per-user in the UI query.

3. SCORE — stored as a single value on the jobs table, calculated from the
   union of all users' preferences at collection time. A Python job might score
   high because User B has Python skills, and User A (React-only) sees it with
   an inflated score. Fix: move score to user_jobs (per-user scoring).

4. TARGET CITIES / STACK KEYWORDS in scoring — same root cause as #3. Scoring
   uses unioned preferences, so location/stack bonuses may not reflect any
   individual user's actual preferences.

5. TOP COMPANIES whitelist — union is intentionally correct here: import jobs
   from any company any user wants. No issue.
"""

import os
import sys

from supabase import create_client


def _client():
    url = os.environ["SUPABASE_URL"]
    key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
    return create_client(url, key)


def _location_to_search(loc: str) -> str:
    l = loc.strip()
    if l.lower() == "remote":
        return "Remote"
    return f"{l}, India" if not l.lower().endswith("india") else l


def fetch_collector_config() -> dict:
    """
    Returns unified collector config built from all users' preferences.
    Exits if Supabase is unreachable or no preferences are set.
    """
    try:
        result = (
            _client()
            .table("preferences")
            .select(
                "preferred_keywords, preferred_locations, remote_only, skills, "
                "top_companies, excluded_keywords, max_job_age_hours"
            )
            .execute()
        )
        rows = result.data or []
    except Exception as exc:
        print(f"[db] Could not connect to Supabase: {exc}")
        sys.exit(1)

    if not rows:
        print("[db] No user preferences found. Set your preferences in the app first.")
        sys.exit(1)

    titles: set[str] = set()
    primary_title_keywords: set[str] = set()
    locations: set[str] = set()
    target_cities: set[str] = set()
    stack_keywords: set[str] = set()
    top_companies: set[str] = set()
    excluded_keywords: set[str] = set()
    max_ages: list[int] = []

    for row in rows:
        for kw in row.get("preferred_keywords") or []:
            if kw:
                kw = kw.strip()
                titles.add(kw)
                primary_title_keywords.add(kw.lower())
                for word in kw.lower().split():
                    if len(word) > 2:
                        primary_title_keywords.add(word)

        for loc in row.get("preferred_locations") or []:
            if loc:
                locations.add(_location_to_search(loc))
                city = loc.strip().lower().split(",")[0]
                target_cities.add(city)
        if row.get("remote_only"):
            locations.add("Remote")

        for skill in row.get("skills") or []:
            if skill:
                stack_keywords.add(skill.strip().lower())

        for co in row.get("top_companies") or []:
            if co:
                top_companies.add(co.lower())

        for kw in row.get("excluded_keywords") or []:
            if kw:
                excluded_keywords.add(kw.lower())

        age = row.get("max_job_age_hours")
        if isinstance(age, int):
            max_ages.append(age)

    if not titles:
        print("[db] No job title keywords set in preferences. Add keywords in the app first.")
        sys.exit(1)

    if not locations:
        print("[db] No preferred locations set in preferences. Add locations in the app first.")
        sys.exit(1)

    return {
        "titles": sorted(titles),
        "primary_title_keywords": primary_title_keywords,
        "locations": sorted(locations),
        "target_cities": target_cities,
        "stack_keywords": stack_keywords,
        "top_companies": top_companies,
        "excluded_keywords": excluded_keywords,
        "hours_old": min(max_ages) if max_ages else 72,
    }
