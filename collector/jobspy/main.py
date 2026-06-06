#!/usr/bin/env python3
"""JobSpy collector — scrapes Indeed and LinkedIn via python-jobspy."""

import os
import sys
from datetime import datetime

from dotenv import load_dotenv

load_dotenv()

for var in ("APP_URL", "COLLECTOR_API_KEY", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"):
    if not os.environ.get(var):
        print(f"ERROR: {var} is not set")
        sys.exit(1)

from config import SITES
from db import fetch_collector_config
from scraper import collect


def main() -> None:
    print(f"JobSpy Collector — {datetime.now().isoformat()}")
    print(f"Target: {os.environ['APP_URL'].rstrip('/')}/api/jobs/import\n")

    print("[db] Fetching collector config from Supabase...")
    cfg = fetch_collector_config()

    print(f"[db] {len(cfg['titles'])} titles, {len(cfg['locations'])} locations, "
          f"{len(cfg['top_companies'])} companies, hours_old={cfg['hours_old']}\n")

    total_imported = 0

    for site in SITES:
        print(f"=== {site.capitalize()} ===")
        for title in cfg["titles"]:
            for location in cfg["locations"]:
                imported, _ = collect(site, title, location, cfg)
                total_imported += imported
        print()

    print(f"Done — {total_imported} new jobs imported.")


if __name__ == "__main__":
    main()
