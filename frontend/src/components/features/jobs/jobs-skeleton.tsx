"use client";

import {
  Table as UITable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

export function JobsCardGridSkeleton({ count }: { count: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-4">
      {Array.from({ length: count }).map((_, i) => (
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
  );
}

export function JobsTableViewSkeleton({ count }: { count: number }) {
  return (
    <UITable>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead>Score</TableHead>
          <TableHead>Job</TableHead>
          <TableHead>Location</TableHead>
          <TableHead>Source</TableHead>
          <TableHead>Posted</TableHead>
          <TableHead>Status</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: count }).map((_, i) => (
          <TableRow key={i} className="hover:bg-transparent">
            <TableCell className="py-3">
              <Skeleton className="h-5 w-9 rounded" />
            </TableCell>
            <TableCell className="py-3">
              <Skeleton className="h-4 w-32 mb-1.5" />
              <Skeleton className="h-3.5 w-24" />
            </TableCell>
            <TableCell className="py-3">
              <Skeleton className="h-3.5 w-20" />
            </TableCell>
            <TableCell className="py-3">
              <Skeleton className="h-3.5 w-16" />
            </TableCell>
            <TableCell className="py-3">
              <Skeleton className="h-3.5 w-20" />
            </TableCell>
            <TableCell className="py-3">
              <Skeleton className="h-5 w-16 rounded-full" />
            </TableCell>
            <TableCell className="py-3">
              <Skeleton className="h-7 w-24 ml-auto rounded" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </UITable>
  );
}
