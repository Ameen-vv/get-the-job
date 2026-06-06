import os

import requests

IMPORT_URL = os.environ["APP_URL"].rstrip("/") + "/api/jobs/import"
API_KEY = os.environ["COLLECTOR_API_KEY"]


def post_batch(jobs: list[dict]) -> dict:
    resp = requests.post(
        IMPORT_URL,
        json=jobs,
        headers={"X-API-Key": API_KEY, "Content-Type": "application/json"},
        timeout=30,
    )
    if not resp.ok:
        raise Exception(f"HTTP {resp.status_code}: {resp.text[:300]}")
    if not resp.text.strip():
        raise Exception(f"HTTP {resp.status_code} but empty response body")
    return resp.json()
