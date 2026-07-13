import os

SITES = ["indeed", "linkedin", "glassdoor"]

RESULTS_PER_SEARCH = 20
BATCH_SIZE = 50
DELAY_SECONDS = 8

# AI relevance matching (optional — skipped if GEMINI_API_KEY is unset)
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-flash-lite-latest")
AI_MATCH_BATCH_SIZE = 10
AI_MATCH_DESC_CHARS = 3000
