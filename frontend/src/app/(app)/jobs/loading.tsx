import { Header } from "@/components/shared/header";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function JobsLoading() {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="Jobs" description="Browse and manage available positions" />
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
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="rounded-xl border bg-card overflow-hidden">
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-6 w-9 rounded" />
                      <Skeleton className="h-3.5 w-16" />
                    </div>
                    <div className="space-y-1.5">
                      <Skeleton className="h-5 w-36" />
                      <Skeleton className="h-4 w-52" />
                    </div>
                    <div className="flex gap-3">
                      <Skeleton className="h-3.5 w-24" />
                      <Skeleton className="h-3.5 w-16" />
                    </div>
                  </div>
                  <div className="border-t px-4 py-2.5 flex items-center justify-between bg-muted/20">
                    <div className="flex gap-1.5">
                      <Skeleton className="h-7 w-12 rounded" />
                      <Skeleton className="h-7 w-14 rounded" />
                    </div>
                    <Skeleton className="h-7 w-7 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
