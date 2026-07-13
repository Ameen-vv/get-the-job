import { createClient, createServiceClient } from "@/lib/supabase/server";
import { generateJobHash } from "@/lib/utils";
import type { ImportJobInput, ImportSummary, JobStatus } from "@/types";
import { importJobsSchema } from "@/lib/validations/jobs";
import { subDays } from "date-fns";
import {
  PAGE_SIZE,
  RECENCY_DAYS,
  type JobsFilters,
} from "@/lib/jobs-filters";
import type { JobRow } from "@/components/features/jobs/jobs-shared";

export async function upsertJobs(jobs: ImportJobInput[]): Promise<ImportSummary> {
  const parsed = importJobsSchema.safeParse(jobs);
  if (!parsed.success) {
    throw new Error(`Invalid job data: ${parsed.error.message}`);
  }

  const supabase = await createServiceClient();
  const summary: ImportSummary = { total: jobs.length, inserted: 0, skipped: 0, errors: 0 };

  for (const job of parsed.data) {
    try {
      const job_hash = generateJobHash(
        job.company,
        job.title,
        job.location ?? ""
      );

      const jobInsert = {
        external_id: job.external_id,
        job_hash,
        title: job.title,
        company: job.company,
        location: job.location ?? null,
        url: job.url ?? null,
        source: job.source,
        score: job.score ?? 0,
        posted_at: job.posted_at ?? null,
        description: job.description ?? null,
        match_reason: job.match_reason ?? null,
      };

      const { error } = await supabase.from("jobs").upsert(jobInsert, {
        onConflict: "external_id",
        ignoreDuplicates: false,
      });

      if (error) {
        if (error.code === "23505") {
          summary.skipped++;
        } else {
          console.error(`Failed to upsert job ${job.external_id}:`, error);
          summary.errors++;
        }
      } else {
        summary.inserted++;
      }
    } catch (err) {
      console.error(`Unexpected error for job ${job.external_id}:`, err);
      summary.errors++;
    }
  }

  return summary;
}

export async function getDashboardStats(userId: string) {
  const supabase = await createServiceClient();

  const { count: total } = await supabase
    .from("jobs")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true);

  const { data: userJobCounts } = await supabase
    .from("user_jobs")
    .select("status")
    .eq("user_id", userId);

  const counts = (userJobCounts ?? []).reduce(
    (acc, row) => {
      const s = String(row.status ?? "");
      acc[s] = (acc[s] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return {
    total: total ?? 0,
    newJobs: counts["NEW"] ?? 0,
    saved: counts["SAVED"] ?? 0,
    applied: counts["APPLIED"] ?? 0,
    interviews: counts["INTERVIEW"] ?? 0,
    offers: counts["OFFER"] ?? 0,
  };
}

/**
 * Fetches one already-filtered, sorted, and paginated page of jobs for the
 * current user, plus the total match count and the distinct list of active
 * sources. The join, status-pill filter, and pagination all happen inside
 * the get_jobs_for_user() Postgres function (see
 * supabase/migrations/20260713010000_jobs_query_rpc.sql) — it scales with
 * how many jobs match the filters, not with how many jobs the user has
 * ever touched, since no id list is ever built or shipped over HTTP.
 */
export async function getJobsForUser(
  filters: JobsFilters,
  minScorePref: number,
): Promise<{ jobs: JobRow[]; totalCount: number; sources: string[] }> {
  const supabase = await createClient();

  const pageSize = PAGE_SIZE[filters.view];
  const effectiveMinScore = Math.max(minScorePref, filters.scoreFloor);
  const recencyCutoff =
    filters.recency !== "any"
      ? subDays(new Date(), RECENCY_DAYS[filters.recency]).toISOString()
      : null;

  const [{ data: rows, error }, { data: sourceRows }] = await Promise.all([
    supabase.rpc("get_jobs_for_user", {
      p_status: filters.status,
      p_min_score: effectiveMinScore,
      p_recency_cutoff: recencyCutoff,
      p_source: filters.source !== "all" ? filters.source : null,
      p_remote: filters.remote,
      p_search: filters.q || null,
      p_sort: filters.sort,
      p_dir: filters.dir,
      p_limit: pageSize,
      p_offset: (filters.page - 1) * pageSize,
    }),
    supabase.from("active_job_sources").select("source"),
  ]);

  if (error) {
    console.error("getJobsForUser error:", error);
    return { jobs: [], totalCount: 0, sources: [] };
  }

  const jobs: JobRow[] = (rows ?? []).map((row) => ({
    id: row.id,
    external_id: row.external_id,
    job_hash: row.job_hash,
    title: row.title,
    company: row.company,
    location: row.location,
    url: row.url,
    source: row.source,
    score: row.score,
    is_active: row.is_active,
    posted_at: row.posted_at,
    description: row.description,
    match_reason: row.match_reason,
    created_at: row.created_at,
    user_job: row.user_job_id
      ? {
          id: row.user_job_id,
          status: row.user_job_status as JobStatus,
          notes: row.user_job_notes,
          updated_at: row.user_job_updated_at!,
        }
      : null,
  }));

  const sources = (sourceRows ?? []).map((r) => r.source);
  const totalCount = rows?.[0]?.total_count ?? 0;

  return { jobs, totalCount, sources };
}
