import { Header } from "@/components/shared/header";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header
        title="Dashboard"
        description="Overview of your job search progress"
      />
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="border-border/50">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-3.5 w-14" />
                    <Skeleton className="h-8 w-10" />
                  </div>
                  <Skeleton className="h-10 w-10 rounded-lg" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div>
          <Skeleton className="h-5 w-24 mb-3" />
          <Card className="overflow-hidden">
            <div className="divide-y">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-4 py-3">
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-52" />
                  </div>
                  <Skeleton className="h-4 w-20 hidden md:block shrink-0" />
                  <Skeleton className="h-5 w-14 rounded-full shrink-0" />
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
