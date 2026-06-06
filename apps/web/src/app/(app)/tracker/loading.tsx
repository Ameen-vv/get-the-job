import { Header } from "@/components/shared/header";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function TrackerLoading() {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header
        title="Application Tracker"
        description="Track and manage your job applications"
      />
      <div className="flex-1 overflow-hidden p-6">
        <div className="flex flex-col h-full gap-4">
          <div className="flex flex-wrap gap-1.5">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-7 w-16 rounded-full" />
            ))}
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-9 flex-1" />
          </div>
          <Card className="flex-1 overflow-hidden">
            <div className="divide-y">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-4 py-3">
                  <Skeleton className="h-4 w-4 rounded shrink-0" />
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-3 w-56" />
                  </div>
                  <Skeleton className="h-5 w-16 rounded-full shrink-0" />
                  <Skeleton className="h-4 w-32 hidden md:block shrink-0" />
                  <Skeleton className="h-4 w-20 hidden lg:block shrink-0" />
                  <Skeleton className="h-7 w-7 rounded shrink-0" />
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
