-- Resume/bio text for AI relevance matching
alter table public.preferences
  add column if not exists resume_text text;

-- Job description + AI match reasoning
alter table public.jobs
  add column if not exists description text,
  add column if not exists match_reason text;
