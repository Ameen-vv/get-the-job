import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export function DashboardStatsSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="border-border/50">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-8 w-12" />
              </div>
              <Skeleton className="w-10 h-10 rounded-lg" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
