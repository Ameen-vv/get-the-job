"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function TrackerTableSkeleton({ count }: { count: number }) {
  return (
    <div className="divide-y">
      {Array.from({ length: count }).map((_, i) => (
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
  );
}
