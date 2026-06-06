# GetTheJob

A production-ready SaaS application for software engineers to discover jobs from multiple sources and track application progress in one place.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 + Shadcn UI |
| Tables | TanStack Table v8 |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (Google OAuth) |
| Validation | Zod |
| Toasts | Sonner |

## Project Structure

```
get-the-job/
├── apps/
│   └── web/                     # Next.js application
│       └── src/
│           ├── app/
│           │   ├── (app)/       # Authenticated route group
│           │   │   ├── dashboard/
│           │   │   ├── jobs/
│           │   │   ├── tracker/
│           │   │   └── preferences/
│           │   ├── auth/
│           │   │   ├── login/
│           │   │   └── callback/
│           │   └── api/
│           │       └── jobs/
│           │           └── import/  # Job import endpoint
│           ├── components/
│           │   ├── ui/          # Shadcn UI primitives
│           │   ├── shared/      # Sidebar, Header, EmptyState, etc.
│           │   └── features/    # Feature-specific components
│           │       ├── auth/
│           │       ├── dashboard/
│           │       ├── jobs/
│           │       ├── tracker/
│           │       └── preferences/
│           ├── lib/
│           │   ├── supabase/    # Browser, server, middleware clients
│           │   ├── services/    # Business logic (jobs service)
│           │   ├── actions/     # Server actions
│           │   └── validations/ # Zod schemas
│           ├── types/           # TypeScript types + DB schema
│           └── middleware.ts    # Route protection
├── collector/                   # (Future) job collector scripts
├── supabase/
│   └── migrations/              # SQL migrations
└── .github/workflows/           # CI pipeline
```

## Quick Start

### 1. Create a Supabase Project

- Go to [supabase.com](https://supabase.com) and create a new project
- Note your project URL and API keys from **Settings → API**

### 2. Configure Google OAuth

In your Supabase dashboard:
1. Go to **Authentication → Providers → Google**
2. Enable Google provider
3. Add your OAuth credentials from [Google Cloud Console](https://console.cloud.google.com)
4. Set redirect URL to: `https://your-project.supabase.co/auth/v1/callback`

### 3. Run Migrations

Run the SQL files in order in your Supabase SQL editor:

```bash
# 1. Schema
supabase/migrations/001_initial_schema.sql

# 2. RLS Policies
supabase/migrations/002_rls_policies.sql
```

Or use the Supabase CLI:

```bash
supabase db push
```

### 4. Set Environment Variables

```bash
cp frontend/.env.local.example frontend/.env.local
```

Edit `frontend/.env.local` with your values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
COLLECTOR_API_KEY=your-secret-api-key
```

### 5. Run the App

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Features

### Dashboard
- Stat cards: Total Jobs, New, Saved, Applied, Interviews, Offers
- Recent jobs table with status indicators

### Jobs Page
- TanStack Table with sorting, filtering, pagination
- Global search + status filter
- Per-job actions: Save, Apply, Interview, Reject, Hide, Add Notes
- External job link

### Application Tracker
- All tracked applications in one table
- Bulk status updates (select multiple → update all)
- Search + filter by status
- Notes view

### Preferences
- Skills tag input with suggestions
- Preferred locations with Remote Only toggle
- Job title keywords

## Job Import API

External collectors push jobs via the REST endpoint:

```
POST /api/jobs/import
Content-Type: application/json
X-API-Key: your-collector-api-key
```

Request body:
```json
[
  {
    "external_id": "linkedin_123",
    "title": "Frontend Engineer",
    "company": "Atlassian",
    "location": "Bangalore",
    "url": "https://example.com/job/123",
    "source": "linkedin",
    "posted_at": "2026-06-01T00:00:00Z"
  }
]
```

Response:
```json
{
  "success": true,
  "summary": {
    "total": 1,
    "inserted": 1,
    "skipped": 0,
    "errors": 0
  }
}
```

Duplicate detection uses:
- `external_id` — primary dedup key  
- `job_hash` — derived from `company + title + location` to catch cross-source duplicates

## Database Schema

```
profiles        — user profile (auto-created on signup)
preferences     — per-user search preferences
jobs            — shared job listings (global)
user_jobs       — per-user application tracking
```

Row Level Security is enabled on all tables. The `jobs` table is read-only for authenticated users; only the service role (used by the import API) can write to it.

## Deployment

### Vercel

1. Connect your GitHub repository to Vercel
2. Set the root directory to `frontend`
3. Add environment variables in the Vercel dashboard
4. Deploy

Add your Vercel domain to Supabase's allowed redirect URLs in **Authentication → URL Configuration**.

## Environment Variables Reference

| Variable | Description | Required |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (public) | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (server-only) | Yes |
| `COLLECTOR_API_KEY` | Secret key for the import endpoint | Yes |
| `NEXT_PUBLIC_APP_URL` | Full app URL (used in redirects) | Optional |
