#!/usr/bin/env python3
"""JobSpy collector — scrapes Indeed and LinkedIn via python-jobspy."""

import os
import sys
from datetime import datetime

from dotenv import load_dotenv

load_dotenv()

for var in ("APP_URL", "COLLECTOR_API_KEY"):
    if not os.environ.get(var):
        print(f"ERROR: {var} is not set")
        sys.exit(1)

from config import LOCATIONS, SITES, TITLES
from scraper import collect


def main() -> None:
    print(f"JobSpy Collector — {datetime.now().isoformat()}")
    print(f"Target: {os.environ['APP_URL'].rstrip('/')}/api/jobs/import\n")

    total_imported = 0

    for site in SITES:
        print(f"=== {site.capitalize()} ===")
        for title in TITLES:
            for location in LOCATIONS:
                imported, _ = collect(site, title, location)
                total_imported += imported
        print()

    print(f"Done — {total_imported} new jobs imported.")


if __name__ == "__main__":
    main()
