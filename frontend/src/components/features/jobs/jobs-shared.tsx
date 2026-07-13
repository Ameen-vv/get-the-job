"use client";

import { cn, JOB_STATUS_LABELS } from "@/lib/utils";
import type { Job, UserJob, JobStatus } from "@/types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  ExternalLink,
  MapPin,
  MoreHorizontal,
  Wifi,
} from "lucide-react";

export type JobRow = Job & {
  user_job: Pick<UserJob, "id" | "status" | "notes" | "updated_at"> | null;
};

export function ScoreBadge({ score }: { score: number }) {
  const pct = Math.round(Math.max(0, Math.min(100, score)));
  const cls =
    pct >= 80
      ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800"
      : pct >= 60
      ? "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-400 dark:border-yellow-800"
      : pct >= 40
      ? "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-400 dark:border-orange-800"
      : "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800";
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center w-9 rounded border text-xs font-bold tabular-nums py-0.5",
        cls
      )}
    >
      {pct}
    </span>
  );
}

export function LocationChip({ location }: { location: string | null }) {
  if (!location) return <span className="text-xs text-muted-foreground/50">—</span>;
  const isRemote = location.toLowerCase().includes("remote");
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      {isRemote ? (
        <Wifi className="h-3 w-3 shrink-0 text-green-500" />
      ) : (
        <MapPin className="h-3 w-3 shrink-0" />
      )}
      <span className="truncate max-w-30">{location}</span>
    </span>
  );
}

export function SortButton({
  label,
  sorted,
  onToggle,
}: {
  label: string;
  sorted: false | "asc" | "desc";
  onToggle: () => void;
}) {
  return (
    <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={onToggle}>
      {label}
      {sorted === "asc" ? (
        <ArrowUp className="ml-1.5 h-3.5 w-3.5" />
      ) : sorted === "desc" ? (
        <ArrowDown className="ml-1.5 h-3.5 w-3.5" />
      ) : (
        <ArrowUpDown className="ml-1.5 h-3.5 w-3.5 opacity-40" />
      )}
    </Button>
  );
}

export function JobRowMenu({
  job,
  onStatus,
  onNotes,
}: {
  job: JobRow;
  onStatus: (id: string, status: JobStatus) => void;
  onNotes: (job: JobRow) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
          <MoreHorizontal className="h-3.5 w-3.5" />
          <span className="sr-only">More options</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {job.url && (
          <DropdownMenuItem asChild>
            <a href={job.url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              Open Listing
            </a>
          </DropdownMenuItem>
        )}
        {job.url && <DropdownMenuSeparator />}
        <DropdownMenuItem onClick={() => onStatus(job.id, "SAVED")}>Mark Saved</DropdownMenuItem>
        <DropdownMenuItem onClick={() => onStatus(job.id, "APPLIED")}>Mark Applied</DropdownMenuItem>
        <DropdownMenuItem onClick={() => onStatus(job.id, "INTERVIEW")}>Mark Interview</DropdownMenuItem>
        <DropdownMenuItem onClick={() => onStatus(job.id, "REJECTED")}>Mark Rejected</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onNotes(job)}>Add / Edit Notes</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-muted-foreground"
          onClick={() => onStatus(job.id, "HIDDEN")}
        >
          Hide Job
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
