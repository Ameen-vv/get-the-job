import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Header } from "@/components/shared/header";
import { TrackerTable } from "@/components/features/tracker/tracker-table";
import { getTrackedJobsForUser } from "@/lib/services/jobs.service";
import { parseTrackerFilters } from "@/lib/tracker-filters";

interface TrackerPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function TrackerPage({ searchParams }: TrackerPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const filters = parseTrackerFilters(await searchParams);
  const { trackedJobs, totalCount } = await getTrackedJobsForUser(
    user.id,
    filters,
  );

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header
        title="Application Tracker"
        description="Track and manage your job applications"
      />
      <div className="flex-1 overflow-hidden p-6">
        <TrackerTable
          trackedJobs={trackedJobs}
          userId={user.id}
          totalCount={totalCount}
          filters={filters}
        />
      </div>
    </div>
  );
}
