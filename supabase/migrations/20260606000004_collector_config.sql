-- Add relevance score to jobs
alter table public.jobs
  add column if not exists score integer not null default 0;

create index if not exists idx_jobs_score on public.jobs(score desc);

-- Add collector config fields to preferences
alter table public.preferences
  add column if not exists top_companies jsonb not null default '[]',
  add column if not exists excluded_keywords jsonb not null default '[]',
  add column if not exists min_score integer not null default 4;
