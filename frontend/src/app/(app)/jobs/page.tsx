import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Header } from "@/components/shared/header";
import { JobsTable } from "@/components/features/jobs/jobs-table";
import { getJobsForUser } from "@/lib/services/jobs.service";
import { parseJobsFilters } from "@/lib/jobs-filters";

interface JobsPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function JobsPage({ searchParams }: JobsPageProps) {
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

  const filters = parseJobsFilters(await searchParams);
  const { jobs, totalCount, sources } = await getJobsForUser(filters, minScore);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header
        title="Jobs"
        description="Browse and manage available positions"
      />
      <div className="flex-1 overflow-hidden p-6">
        <JobsTable
          jobs={jobs}
          userId={user.id}
          totalCount={totalCount}
          sources={sources}
          filters={filters}
        />
      </div>
    </div>
  );
}
