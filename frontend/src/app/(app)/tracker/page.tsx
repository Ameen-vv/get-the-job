import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Header } from "@/components/shared/header";
import { TrackerTable } from "@/components/features/tracker/tracker-table";
import type { UserJob, Job } from "@/types";

type TrackerRow = UserJob & { job: Job };

export default async function TrackerPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: rawJobs } = await supabase
    .from("user_jobs")
    .select("*, job:jobs(*)")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  const trackedJobs = (rawJobs ?? []) as unknown as TrackerRow[];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header
        title="Application Tracker"
        description="Track and manage your job applications"
      />
      <div className="flex-1 overflow-hidden p-6">
        <TrackerTable trackedJobs={trackedJobs} userId={user.id} />
      </div>
    </div>
  );
}
