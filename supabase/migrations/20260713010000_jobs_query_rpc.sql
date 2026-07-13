-- Moves jobs-list filtering/sorting/pagination into the database.
--
-- Previously the app fetched a user's *entire* user_jobs history into JS,
-- turned the active status filter into an id allow/deny list, and shipped
-- that list back to Postgres via .in()/.notIn(). That list grows with every
-- job a user has ever touched (hidden jobs especially, since the default
-- view excludes them forever) — at a few thousand rows it produces a query
-- string too large for normal HTTP infra. This does the join and filter in
-- SQL instead, so it scales with how many jobs match the filters, not with
-- how many jobs the user has ever interacted with.

-- ============================================================
-- INDEX — supports "is_active = true AND score >= X" + ORDER BY score
-- ============================================================
create index if not exists idx_jobs_active_score
  on public.jobs(is_active, score desc);

-- ============================================================
-- VIEW — distinct sources among active jobs, for the source filter dropdown
-- ============================================================
create or replace view public.active_job_sources as
  select distinct source
  from public.jobs
  where is_active = true
  order by source;

grant select on public.active_job_sources to authenticated;

-- ============================================================
-- FUNCTION — one paginated, filtered, sorted page of jobs for the caller
-- ============================================================
-- Runs as SECURITY INVOKER (the default) and uses auth.uid() directly rather
-- than accepting a user id argument, so RLS on user_jobs still applies and
-- there's no way to pass another user's id to read their statuses.
create or replace function public.get_jobs_for_user(
  p_status text default 'ALL',
  p_min_score integer default 0,
  p_recency_cutoff timestamptz default null,
  p_source text default null,
  p_remote boolean default false,
  p_search text default null,
  p_sort text default 'score',
  p_dir text default 'desc',
  p_limit integer default 12,
  p_offset integer default 0
)
returns table (
  id uuid,
  external_id text,
  job_hash text,
  title text,
  company text,
  location text,
  url text,
  source text,
  score integer,
  is_active boolean,
  posted_at timestamptz,
  description text,
  match_reason text,
  created_at timestamptz,
  user_job_id uuid,
  user_job_status public.job_status,
  user_job_notes text,
  user_job_updated_at timestamptz,
  total_count bigint
)
language sql
stable
set search_path = public
as $$
  select
    j.id, j.external_id, j.job_hash, j.title, j.company, j.location, j.url,
    j.source, j.score, j.is_active, j.posted_at, j.description, j.match_reason,
    j.created_at,
    uj.id, uj.status, uj.notes, uj.updated_at,
    count(*) over() as total_count
  from public.jobs j
  left join public.user_jobs uj
    on uj.job_id = j.id and uj.user_id = auth.uid()
  where j.is_active = true
    and j.score >= p_min_score
    and (
      (p_status = 'ALL' and coalesce(uj.status::text, 'NEW') not in ('HIDDEN', 'APPLIED', 'INTERVIEW', 'OFFER'))
      or (p_status = 'NEW' and coalesce(uj.status::text, 'NEW') = 'NEW')
      or (p_status not in ('ALL', 'NEW') and uj.status::text = p_status)
    )
    and (p_recency_cutoff is null or coalesce(j.posted_at, j.created_at) >= p_recency_cutoff)
    and (p_source is null or j.source = p_source)
    and (p_remote is false or j.location ilike '%remote%')
    and (
      p_search is null
      or j.title ilike '%' || p_search || '%'
      or j.company ilike '%' || p_search || '%'
      or j.location ilike '%' || p_search || '%'
    )
  order by
    case when p_sort = 'score' and p_dir = 'asc' then j.score end asc nulls last,
    case when p_sort = 'score' and p_dir = 'desc' then j.score end desc nulls last,
    case when p_sort = 'job' and p_dir = 'asc' then j.company end asc nulls last,
    case when p_sort = 'job' and p_dir = 'desc' then j.company end desc nulls last,
    case when p_sort = 'job' and p_dir = 'asc' then j.title end asc,
    case when p_sort = 'job' and p_dir = 'desc' then j.title end desc,
    case when p_sort = 'posted' and p_dir = 'asc' then j.posted_at end asc nulls last,
    case when p_sort = 'posted' and p_dir = 'desc' then j.posted_at end desc nulls last,
    j.created_at desc
  limit p_limit
  offset p_offset;
$$;

grant execute on function public.get_jobs_for_user(
  text, integer, timestamptz, text, boolean, text, text, text, integer, integer
) to authenticated;
