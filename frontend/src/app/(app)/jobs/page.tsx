import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Header } from "@/components/shared/header";
import { JobsTable, type JobRow } from "@/components/features/jobs/jobs-table";
import type { Job, UserJob } from "@/types";

export default async function JobsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: prefs } = await supabase
    .from("preferences")
    .select("min_score")
    .eq("user_id", user.id)
    .single();

  const minScore = typeof prefs?.min_score === "number" ? prefs.min_score : 0;

  const { data: rawJobs } = await supabase
    .from("jobs")
    .select("*, user_jobs!left(id, status, notes, updated_at)")
    .gte("score", minScore)
    .order("score", { ascending: false })
    .order("created_at", { ascending: false });

  const jobs: JobRow[] = (rawJobs ?? []).map((rawJob) => {
    const { user_jobs, ...jobFields } = rawJob as Job & {
      user_jobs: Array<Pick<UserJob, "id" | "status" | "notes" | "updated_at">> | null;
    };
    const userJobArray = Array.isArray(user_jobs) ? user_jobs : [];
    return {
      ...jobFields,
      user_job: userJobArray[0] ?? null,
    };
  });

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header
        title="Jobs"
        description="Browse and manage available positions"
      />
      <div className="flex-1 overflow-hidden p-6">
        <JobsTable jobs={jobs} userId={user.id} />
      </div>
    </div>
  );
}
