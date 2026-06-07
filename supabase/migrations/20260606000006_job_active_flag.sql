alter table public.jobs
  add column if not exists is_active boolean not null default true;

create index if not exists idx_jobs_is_active on public.jobs(is_active);

-- Marks jobs older than 3 days as inactive — called by the collector after each run
create or replace function public.deactivate_old_jobs()
returns void
language sql
security definer
as $$
  update public.jobs
  set is_active = false
  where is_active = true
    and created_at < now() - interval '3 days';
$$;
