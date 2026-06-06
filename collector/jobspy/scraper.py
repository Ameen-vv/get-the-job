import hashlib
import time
from datetime import datetime, timezone

import pandas as pd
from jobspy import scrape_jobs

from config import BATCH_SIZE, DELAY_SECONDS, HOURS_OLD, RESULTS_PER_SEARCH
from poster import post_batch
from scoring import is_worth_importing


def _make_external_id(site: str, row: pd.Series) -> str:
    job_id = str(row.get("id", "")).strip()
    if job_id and job_id != "nan":
        return f"{site}_{job_id}"
    url = str(row.get("job_url", "")).strip()
    if url and url != "nan":
        return f"{site}_{hashlib.md5(url.encode()).hexdigest()[:16]}"
    fingerprint = f"{row.get('title', '')}{row.get('company', '')}{row.get('location', '')}"
    return f"{site}_{hashlib.md5(fingerprint.encode()).hexdigest()[:16]}"


def _to_iso(val) -> str | None:
    if val is None:
        return None
    if isinstance(val, float) and pd.isna(val):
        return None
    if isinstance(val, str):
        try:
            return datetime.fromisoformat(val).replace(tzinfo=timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
        except Exception:
            return None
    if hasattr(val, "isoformat"):
        if isinstance(val, datetime):
            dt = val if val.tzinfo else val.replace(tzinfo=timezone.utc)
            return dt.strftime("%Y-%m-%dT%H:%M:%SZ")
        return f"{val.year:04d}-{val.month:02d}-{val.day:02d}T00:00:00Z"
    return None


def _row_to_job(site: str, row: pd.Series) -> dict | None:
    title = str(row.get("title", "")).strip()
    company = str(row.get("company", "")).strip()
    url = str(row.get("job_url", "")).strip()

    if not title or not company or title == "nan" or company == "nan":
        return None
    if not url or url == "nan":
        return None

    location = str(row.get("location", "")).strip()
    if location == "nan":
        location = ""
    if row.get("is_remote") is True and not location:
        location = "Remote"

    return {
        "external_id": _make_external_id(site, row),
        "title": title,
        "company": company,
        "location": location or None,
        "url": url,
        "source": site,
        "posted_at": _to_iso(row.get("date_posted")),
    }


def collect(site: str, title: str, location: str) -> tuple[int, int]:
    """Returns (imported, filtered_out) counts."""
    print(f"  [{site}] '{title}' @ {location}")
    try:
        df = scrape_jobs(
            site_name=[site],
            search_term=title,
            location=location,
            results_wanted=RESULTS_PER_SEARCH,
            hours_old=HOURS_OLD,
            country_indeed="India",
            verbose=0,
        )
    except Exception as exc:
        print(f"    scrape error: {exc}")
        return 0, 0

    if df is None or df.empty:
        print("    no results")
        return 0, 0

    jobs, filtered = [], 0
    for _, row in df.iterrows():
        job = _row_to_job(site, row)
        if job is None or not is_worth_importing(job):
            filtered += 1
            continue
        jobs.append(job)

    if not jobs:
        print(f"    all {filtered} jobs filtered out")
        return 0, filtered

    imported = 0
    for i in range(0, len(jobs), BATCH_SIZE):
        batch = jobs[i : i + BATCH_SIZE]
        try:
            result = post_batch(batch)
            summary = result.get("summary", {})
            n = summary.get("inserted", 0)
            imported += n
            print(
                f"    +{n} new, {summary.get('skipped', 0)} dupes "
                f"({filtered} filtered) of {len(df)} scraped"
            )
        except Exception as exc:
            print(f"    post error: {exc}")

    time.sleep(DELAY_SECONDS)
    return imported, filtered
