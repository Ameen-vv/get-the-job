alter table public.preferences
  add column if not exists max_job_age_hours integer not null default 72;
