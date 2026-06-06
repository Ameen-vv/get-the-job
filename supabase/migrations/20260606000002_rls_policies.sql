-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.preferences enable row level security;
alter table public.jobs enable row level security;
alter table public.user_jobs enable row level security;

-- ============================================================
-- PROFILES POLICIES
-- ============================================================
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = user_id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Service role can insert profiles (via trigger)
create policy "Service role can insert profiles"
  on public.profiles for insert
  with check (true);

-- ============================================================
-- PREFERENCES POLICIES
-- ============================================================
create policy "Users can view their own preferences"
  on public.preferences for select
  using (auth.uid() = user_id);

create policy "Users can insert their own preferences"
  on public.preferences for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own preferences"
  on public.preferences for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- JOBS POLICIES
-- ============================================================
-- All authenticated users can read jobs
create policy "Authenticated users can view jobs"
  on public.jobs for select
  to authenticated
  using (true);

-- Only service role can insert/update/delete jobs
create policy "Service role can manage jobs"
  on public.jobs for all
  using (auth.role() = 'service_role');

-- ============================================================
-- USER_JOBS POLICIES
-- ============================================================
create policy "Users can view their own job applications"
  on public.user_jobs for select
  using (auth.uid() = user_id);

create policy "Users can insert their own job applications"
  on public.user_jobs for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own job applications"
  on public.user_jobs for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own job applications"
  on public.user_jobs for delete
  using (auth.uid() = user_id);
