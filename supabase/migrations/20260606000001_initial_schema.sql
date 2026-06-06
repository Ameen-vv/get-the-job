-- ============================================================
-- PROFILES
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null references auth.users(id) on delete cascade,
  name text,
  email text,
  avatar_url text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- PREFERENCES
-- ============================================================
create table if not exists public.preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null references auth.users(id) on delete cascade,
  skills jsonb not null default '[]',
  preferred_locations jsonb not null default '[]',
  preferred_keywords jsonb not null default '[]',
  remote_only boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- JOBS
-- ============================================================
create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  external_id text unique not null,
  job_hash text unique not null,
  title text not null,
  company text not null,
  location text,
  url text,
  source text not null,
  posted_at timestamptz,
  created_at timestamptz not null default now()
);

-- ============================================================
-- USER_JOBS
-- ============================================================
create type public.job_status as enum (
  'NEW',
  'SAVED',
  'APPLIED',
  'INTERVIEW',
  'REJECTED',
  'OFFER',
  'HIDDEN'
);

create table if not exists public.user_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  status public.job_status not null default 'NEW',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, job_id)
);

-- ============================================================
-- INDEXES
-- ============================================================
create index if not exists idx_profiles_user_id on public.profiles(user_id);
create index if not exists idx_preferences_user_id on public.preferences(user_id);
create index if not exists idx_jobs_external_id on public.jobs(external_id);
create index if not exists idx_jobs_job_hash on public.jobs(job_hash);
create index if not exists idx_jobs_source on public.jobs(source);
create index if not exists idx_jobs_posted_at on public.jobs(posted_at desc);
create index if not exists idx_jobs_company on public.jobs(company);
create index if not exists idx_user_jobs_user_id on public.user_jobs(user_id);
create index if not exists idx_user_jobs_job_id on public.user_jobs(job_id);
create index if not exists idx_user_jobs_status on public.user_jobs(status);
create index if not exists idx_user_jobs_user_status on public.user_jobs(user_id, status);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger preferences_updated_at
  before update on public.preferences
  for each row execute function public.handle_updated_at();

create trigger user_jobs_updated_at
  before update on public.user_jobs
  for each row execute function public.handle_updated_at();

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (user_id, name, email, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email,
    new.raw_user_meta_data->>'avatar_url'
  );

  insert into public.preferences (user_id)
  values (new.id);

  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
