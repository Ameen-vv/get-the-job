import { createServiceClient } from "@/lib/supabase/server";
import { generateJobHash } from "@/lib/utils";
import type { ImportJobInput, ImportSummary } from "@/types";
import { importJobsSchema } from "@/lib/validations/jobs";

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
        posted_at: job.posted_at ?? null,
      };

      const { error } = await supabase.from("jobs").upsert(jobInsert, {
        onConflict: "external_id",
        ignoreDuplicates: true,
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
    .select("*", { count: "exact", head: true });

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
