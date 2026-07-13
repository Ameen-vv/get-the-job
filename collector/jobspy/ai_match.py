"""AI relevance matching — filters jobs by comparing the description against
the user's profile (resume/skills/keywords) via the Gemini API.

Fails open at every level: if no API key is configured, or a batch call
fails for any reason, the affected jobs are kept unfiltered rather than
dropped, so a misconfigured or flaky AI call never zeroes out the run.
"""

import json

import requests

from config import AI_MATCH_BATCH_SIZE, AI_MATCH_DESC_CHARS, GEMINI_API_KEY, GEMINI_MODEL

GEMINI_URL = (
    f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent"
)


def _build_prompt(profile: dict, batch: list[dict]) -> str:
    profile_lines = [
        "Candidate profile:",
        f"Resume/bio: {profile.get('resume_text') or '(not provided)'}",
        f"Skills: {', '.join(profile.get('skills', [])) or '(none listed)'}",
        f"Target roles: {', '.join(profile.get('preferred_keywords', [])) or '(none listed)'}",
    ]

    jobs_payload = [
        {
            "external_id": job["external_id"],
            "title": job["title"],
            "company": job["company"],
            "location": job.get("location", ""),
            "description": (job.get("description") or "")[:AI_MATCH_DESC_CHARS],
        }
        for job in batch
    ]

    return (
        "\n".join(profile_lines)
        + "\n\nFor each job below, decide if it's a genuinely good match for "
        "this candidate based on the job description (seniority, tech stack, "
        "role type) — not just a title keyword match. Respond with a JSON "
        "array, one object per job, each with exactly these keys: "
        "\"external_id\" (copy verbatim), \"relevant\" (boolean), "
        "\"reason\" (under 20 words explaining the verdict).\n\n"
        f"Jobs:\n{json.dumps(jobs_payload, ensure_ascii=False)}"
    )


def _classify_batch(profile: dict, batch: list[dict]) -> dict[str, dict]:
    prompt = _build_prompt(profile, batch)
    resp = requests.post(
        GEMINI_URL,
        params={"key": GEMINI_API_KEY},
        json={
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"responseMimeType": "application/json"},
        },
        timeout=30,
    )
    resp.raise_for_status()
    data = resp.json()
    text = data["candidates"][0]["content"]["parts"][0]["text"]
    results = json.loads(text)
    return {r["external_id"]: r for r in results if "external_id" in r}


def match_jobs(jobs: list[dict], profile: dict) -> list[dict]:
    """Returns the subset of jobs the AI judged relevant to the profile.

    No-op (returns jobs unchanged) if GEMINI_API_KEY isn't configured.
    """
    if not GEMINI_API_KEY or not jobs:
        return jobs

    kept: list[dict] = []
    for i in range(0, len(jobs), AI_MATCH_BATCH_SIZE):
        batch = jobs[i : i + AI_MATCH_BATCH_SIZE]
        try:
            verdicts = _classify_batch(profile, batch)
        except Exception as exc:
            print(f"    ai match error: {exc} — keeping batch unfiltered")
            kept.extend(batch)
            continue

        for job in batch:
            verdict = verdicts.get(job["external_id"])
            if verdict is None:
                # model omitted this job — fail open rather than drop it
                kept.append(job)
                continue
            if verdict.get("relevant"):
                job["match_reason"] = str(verdict.get("reason", ""))[:280]
                kept.append(job)

    return kept
