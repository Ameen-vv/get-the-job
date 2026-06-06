import { createClient } from "@/lib/supabase/server";
import { formatRelativeDate } from "@/lib/utils";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Briefcase, ExternalLink } from "lucide-react";
import type { Job, JobStatus, UserJob } from "@/types";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface RecentJobsTableProps {
  userId: string;
}

type RawJobRow = Job & {
  user_jobs: Array<Pick<UserJob, "id" | "status">> | null;
};

export async function RecentJobsTable({ userId: _userId }: RecentJobsTableProps) {
  const supabase = await createClient();

  const { data: rawJobs } = await supabase
    .from("jobs")
    .select("*, user_jobs!left(id, status)")
    .order("created_at", { ascending: false })
    .limit(10);

  const jobs = (rawJobs ?? []) as RawJobRow[];

  if (jobs.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={Briefcase}
          title="No jobs yet"
          description="Jobs will appear here once they are imported from collectors."
        />
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Company</TableHead>
            <TableHead>Job Title</TableHead>
            <TableHead className="hidden md:table-cell">Location</TableHead>
            <TableHead className="hidden lg:table-cell">Source</TableHead>
            <TableHead className="hidden lg:table-cell">Posted</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-10"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {jobs.map((job) => {
            const userJobArr = Array.isArray(job.user_jobs) ? job.user_jobs : [];
            const status = (userJobArr[0]?.status as JobStatus) ?? null;

            return (
              <TableRow key={job.id}>
                <TableCell className="font-medium">{job.company}</TableCell>
                <TableCell>{job.title}</TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                  {job.location ?? "—"}
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <span className="capitalize text-sm text-muted-foreground">
                    {job.source}
                  </span>
                </TableCell>
                <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                  {formatRelativeDate(job.posted_at)}
                </TableCell>
                <TableCell>
                  {status ? (
                    <StatusBadge status={status} />
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  {job.url && (
                    <Button variant="ghost" size="icon" asChild className="h-8 w-8">
                      <a href={job.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <div className="p-4 border-t flex justify-center">
        <Button variant="outline" size="sm" asChild>
          <Link href="/jobs">View all jobs</Link>
        </Button>
      </div>
    </Card>
  );
}
