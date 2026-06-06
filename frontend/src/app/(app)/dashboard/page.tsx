import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Header } from "@/components/shared/header";
import { DashboardStats } from "@/components/features/dashboard/dashboard-stats";
import { RecentJobsTable } from "@/components/features/dashboard/recent-jobs-table";
import { DashboardStatsSkeleton } from "@/components/features/dashboard/dashboard-stats-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header
        title="Dashboard"
        description="Overview of your job search progress"
      />
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <Suspense fallback={<DashboardStatsSkeleton />}>
          <DashboardStats userId={user.id} />
        </Suspense>

        <div>
          <h2 className="text-base font-semibold mb-3">Recent Jobs</h2>
          <Suspense
            fallback={
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            }
          >
            <RecentJobsTable userId={user.id} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
