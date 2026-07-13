"use client";

import type { Row } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatRelativeDate, JOB_STATUS_LABELS } from "@/lib/utils";
import { Clock, ExternalLink, MapPin, Wifi } from "lucide-react";
import type { JobStatus } from "@/types";
import { ScoreBadge, JobRowMenu, type JobRow } from "./jobs-shared";

interface JobsCardGridProps {
  rows: Row<JobRow>[];
  onStatusUpdate: (jobId: string, status: JobStatus) => void;
  onNotes: (job: JobRow) => void;
}

export function JobsCardGrid({
  rows,
  onStatusUpdate,
  onNotes,
}: JobsCardGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-4">
      {rows.map((row) => {
        const job = row.original;
        const status = job.user_job?.status as JobStatus | undefined;
        const isApplied =
          status === "APPLIED" || status === "INTERVIEW" || status === "OFFER";
        const isSaved = status === "SAVED";
        const isRemote = job.location?.toLowerCase().includes("remote");

        return (
          <div
            key={job.id}
            className="flex flex-col rounded-xl border bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow overflow-hidden"
          >
            {/* Card body */}
            <div className="p-4 flex-1 space-y-3">
              {/* Score + source + open link */}
              <div className="flex items-center gap-2">
                <ScoreBadge score={job.score} />
                <div className="flex items-center gap-2 ml-auto">
                  <span className="capitalize text-xs text-muted-foreground">
                    {job.source}
                  </span>
                  {job.url && (
                    <a
                      href={job.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              </div>

              {/* Company + title */}
              <div>
                <div className="font-semibold text-base leading-tight">
                  {job.company}
                </div>
                <div className="text-sm text-muted-foreground mt-1 leading-snug">
                  {job.title}
                </div>
              </div>

              {/* Location + posted */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                {job.location && (
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    {isRemote ? (
                      <Wifi className="h-3 w-3 shrink-0 text-green-500" />
                    ) : (
                      <MapPin className="h-3 w-3 shrink-0" />
                    )}
                    {job.location}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3 shrink-0" />
                  {formatRelativeDate(job.posted_at)}
                </span>
              </div>

              {/* Status badge */}
              {status && <StatusBadge status={status} />}
            </div>

            {/* Card footer: actions */}
            <div className="border-t px-4 py-2.5 flex items-center justify-between bg-muted/20">
              <div className="flex gap-1.5">
                {!isSaved && !isApplied && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2.5 text-xs"
                    onClick={() => onStatusUpdate(job.id, "SAVED")}
                  >
                    Save
                  </Button>
                )}
                {!isApplied && (
                  <Button
                    size="sm"
                    className="h-7 px-2.5 text-xs"
                    onClick={() => onStatusUpdate(job.id, "APPLIED")}
                  >
                    Apply
                  </Button>
                )}
                {isApplied && (
                  <span className="text-xs text-muted-foreground self-center">
                    {JOB_STATUS_LABELS[status!]}
                  </span>
                )}
              </div>
              <JobRowMenu
                job={job}
                onStatus={onStatusUpdate}
                onNotes={onNotes}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
