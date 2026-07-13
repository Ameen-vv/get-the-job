"use client";

import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type ColumnDef,
  type SortingState,
  type PaginationState,
} from "@tanstack/react-table";
import { useState, useTransition, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/shared/empty-state";
import { Card } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Briefcase,
  Clock,
  Search,
  X,
  Wifi,
  LayoutGrid,
  List,
} from "lucide-react";
import { formatRelativeDate, JOB_STATUS_LABELS, cn } from "@/lib/utils";
import { isAfter, subDays } from "date-fns";
import type { JobStatus } from "@/types";
import { updateJobStatus } from "@/lib/actions/jobs.actions";
import { toast } from "sonner";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  ScoreBadge,
  LocationChip,
  SortButton,
  JobRowMenu,
  type JobRow,
} from "./jobs-shared";
import { JobsCardGrid } from "./jobs-card-grid";
import { JobsTableView } from "./jobs-table-view";
import { JobNotesDialog } from "./job-notes-dialog";

// Re-export so job-notes-dialog.tsx import stays unchanged
export type { JobRow };

// ─── Constants ────────────────────────────────────────────────────────────────

const ALL_STATUSES = [
  "ALL",
  "NEW",
  "SAVED",
  "APPLIED",
  "INTERVIEW",
  "REJECTED",
  "OFFER",
  "HIDDEN",
] as const;

const RECENCY_OPTIONS = [
  { value: "any", label: "Any time" },
  { value: "1d", label: "Today" },
  { value: "2d", label: "Last 2 days" },
  { value: "3d", label: "Last 3 days" },
  { value: "7d", label: "Last week" },
  { value: "30d", label: "Last 30 days" },
] as const;

const SCORE_OPTIONS = [
  { value: "0", label: "Any score" },
  { value: "6", label: "6+" },
  { value: "7", label: "7+" },
  { value: "8", label: "8+" },
  { value: "9", label: "9+" },
] as const;

const RECENCY_DAYS: Record<string, number> = {
  "1d": 1,
  "2d": 2,
  "3d": 3,
  "7d": 7,
  "30d": 30,
};

// ─── Column definitions ───────────────────────────────────────────────────────

function buildColumns(
  onStatusUpdate: (id: string, status: JobStatus) => void,
  onNotes: (job: JobRow) => void,
  isPending: boolean,
): ColumnDef<JobRow>[] {
  return [
    {
      accessorKey: "score",
      header: ({ column }) => (
        <SortButton
          label="Score"
          sorted={column.getIsSorted()}
          onToggle={() => column.toggleSorting(column.getIsSorted() === "asc")}
        />
      ),
      cell: ({ row }) => <ScoreBadge score={row.getValue("score")} />,
    },
    {
      id: "job",
      accessorFn: (row) => `${row.company} ${row.title}`,
      header: ({ column }) => (
        <SortButton
          label="Job"
          sorted={column.getIsSorted()}
          onToggle={() => column.toggleSorting(column.getIsSorted() === "asc")}
        />
      ),
      cell: ({ row }) => (
        <div className="min-w-0">
          <div className="font-medium text-sm leading-snug truncate">
            {row.original.company}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5 truncate">
            {row.original.title}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "location",
      header: "Location",
      cell: ({ row }) => <LocationChip location={row.getValue("location")} />,
    },
    {
      accessorKey: "source",
      header: "Source",
      cell: ({ row }) => (
        <span className="capitalize text-xs text-muted-foreground">
          {row.getValue("source")}
        </span>
      ),
    },
    {
      accessorKey: "posted_at",
      header: ({ column }) => (
        <SortButton
          label="Posted"
          sorted={column.getIsSorted()}
          onToggle={() => column.toggleSorting(column.getIsSorted() === "asc")}
        />
      ),
      cell: ({ row }) => (
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
          <Clock className="h-3 w-3 shrink-0" />
          {formatRelativeDate(row.getValue("posted_at"))}
        </span>
      ),
    },
    {
      id: "status",
      accessorFn: (row) => row.user_job?.status ?? null,
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.user_job?.status as JobStatus | undefined;
        return status ? (
          <StatusBadge status={status} />
        ) : (
          <span className="text-xs text-muted-foreground/50">—</span>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const job = row.original;
        const status = job.user_job?.status as JobStatus | undefined;
        const isApplied =
          status === "APPLIED" || status === "INTERVIEW" || status === "OFFER";
        const isSaved = status === "SAVED";
        return (
          <div className="flex items-center gap-1 justify-end">
            {!isSaved && !isApplied && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2.5 text-xs font-medium"
                onClick={() => onStatusUpdate(job.id, "SAVED")}
                disabled={isPending}
              >
                Save
              </Button>
            )}
            {!isApplied && (
              <Button
                size="sm"
                className="h-7 px-2.5 text-xs font-medium"
                onClick={() => onStatusUpdate(job.id, "APPLIED")}
                disabled={isPending}
              >
                Apply
              </Button>
            )}
            <JobRowMenu
              job={job}
              onStatus={onStatusUpdate}
              onNotes={onNotes}
              isPending={isPending}
            />
          </div>
        );
      },
    },
  ];
}

// ─── Main component ───────────────────────────────────────────────────────────

interface JobsTableProps {
  jobs: JobRow[];
  userId: string;
}

export function JobsTable({ jobs: initialJobs, userId }: JobsTableProps) {
  const [jobs, setJobs] = useState(initialJobs);
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [recencyFilter, setRecencyFilter] = useState<string>("any");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [scoreFilter, setScoreFilter] = useState<string>("0");
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [notesJob, setNotesJob] = useState<JobRow | null>(null);
  const [applyTarget, setApplyTarget] = useState<JobRow | null>(null);
  const [isPending, startTransition] = useTransition();
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 12,
  });

  const sources = useMemo(() => {
    const seen = new Set<string>();
    for (const j of jobs) if (j.source) seen.add(j.source);
    return Array.from(seen).sort();
  }, [jobs]);

  const hasActiveFilters =
    recencyFilter !== "any" ||
    sourceFilter !== "all" ||
    scoreFilter !== "0" ||
    remoteOnly;

  function clearFilters() {
    setRecencyFilter("any");
    setSourceFilter("all");
    setScoreFilter("0");
    setRemoteOnly(false);
    setGlobalFilter("");
  }

  function applyOptimisticStatus(jobId: string, newStatus: JobStatus) {
    setJobs((prev) =>
      prev.map((j) =>
        j.id === jobId
          ? {
              ...j,
              user_job: {
                id: j.user_job?.id ?? "",
                status: newStatus,
                notes: j.user_job?.notes ?? null,
                updated_at: new Date().toISOString(),
              },
            }
          : j,
      ),
    );
  }

  function handleStatusUpdate(jobId: string, newStatus: JobStatus) {
    // Intercept Apply: open listing + show confirmation
    if (newStatus === "APPLIED") {
      const job = jobs.find((j) => j.id === jobId) ?? null;
      if (job?.url) window.open(job.url, "_blank", "noopener,noreferrer");
      setApplyTarget(job);
      return;
    }
    commitStatusUpdate(jobId, newStatus);
  }

  function commitStatusUpdate(jobId: string, newStatus: JobStatus) {
    // Optimistic update — UI changes instantly
    const previous = jobs.find((j) => j.id === jobId);
    applyOptimisticStatus(jobId, newStatus);

    startTransition(async () => {
      const result = await updateJobStatus({
        jobId,
        userId,
        status: newStatus,
      });
      if (result.success) {
        // Sync server-assigned fields (id, updated_at)
        if (result.userJob) {
          setJobs((prev) =>
            prev.map((j) =>
              j.id === jobId
                ? {
                    ...j,
                    user_job: {
                      id: result.userJob!.id,
                      status: result.userJob!.status,
                      notes: result.userJob!.notes,
                      updated_at: result.userJob!.updated_at,
                    },
                  }
                : j,
            ),
          );
        }
        toast.success(`Job marked as ${JOB_STATUS_LABELS[newStatus]}`);
      } else {
        // Revert on failure
        setJobs((prev) =>
          prev.map((j) =>
            j.id === jobId ? { ...j, user_job: previous?.user_job ?? null } : j,
          ),
        );
        toast.error("Failed to update job status");
      }
    });
  }

  const filteredJobs = useMemo(() => {
    let result = jobs;

    if (statusFilter !== "ALL") {
      result =
        statusFilter === "NEW"
          ? result.filter((j) => !j.user_job || j.user_job.status === "NEW")
          : result.filter((j) => j.user_job?.status === statusFilter);
    }
    if (recencyFilter !== "any") {
      const cutoff = subDays(new Date(), RECENCY_DAYS[recencyFilter]);
      result = result.filter((j) =>
        j.posted_at
          ? isAfter(new Date(j.posted_at), cutoff)
          : isAfter(new Date(j.created_at), cutoff),
      );
    }
    if (sourceFilter !== "all")
      result = result.filter((j) => j.source === sourceFilter);
    const minScore = parseInt(scoreFilter, 10);
    if (minScore > 0) result = result.filter((j) => j.score >= minScore);
    if (remoteOnly)
      result = result.filter(
        (j) => j.location?.toLowerCase().includes("remote") ?? false,
      );

    return result;
  }, [
    jobs,
    statusFilter,
    recencyFilter,
    sourceFilter,
    scoreFilter,
    remoteOnly,
  ]);

  const columns = useMemo(
    () => buildColumns(handleStatusUpdate, setNotesJob, isPending),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isPending],
  );

  // Reset to page 1 when filters/search/view change — but not on plain
  // data mutations (e.g. optimistic status updates), which would otherwise
  // reset via autoResetPageIndex since `jobs` gets a new array reference.
  useEffect(() => {
    setPagination({
      pageSize: viewMode === "cards" ? 12 : 20,
      pageIndex: 0,
    });
  }, [
    viewMode,
    statusFilter,
    recencyFilter,
    sourceFilter,
    scoreFilter,
    remoteOnly,
    globalFilter,
  ]);

  const table = useReactTable({
    data: filteredJobs,
    columns,
    state: { sorting, globalFilter, pagination },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    autoResetPageIndex: false,
  });

  const totalFiltered = table.getFilteredRowModel().rows.length;
  const visibleRows = table.getRowModel().rows;
  const isEmpty = visibleRows.length === 0;

  return (
    <>
      <div className="flex flex-col h-full gap-3">
        {/* Status pills */}
        <div className="flex gap-1.5 flex-wrap">
          {ALL_STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer",
                statusFilter === s
                  ? "bg-foreground text-background border-foreground"
                  : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/40 bg-transparent",
              )}
            >
              {s === "ALL" ? "All" : JOB_STATUS_LABELS[s]}
            </button>
          ))}
        </div>

        {/* Search + filters row */}
        <div className="flex flex-wrap gap-2 items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by title, company, or location…"
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-9 pr-9"
            />
            {globalFilter && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={() => setGlobalFilter("")}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>

          {/* Recency */}
          <Select value={recencyFilter} onValueChange={setRecencyFilter}>
            <SelectTrigger className="w-36 h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RECENCY_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value} className="text-xs">
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Source — only shown when there are multiple */}
          {sources.length > 1 && (
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-36 h-9 text-xs">
                <SelectValue placeholder="All sources" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">
                  All sources
                </SelectItem>
                {sources.map((s) => (
                  <SelectItem key={s} value={s} className="text-xs capitalize">
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Min score */}
          <Select value={scoreFilter} onValueChange={setScoreFilter}>
            <SelectTrigger className="w-28 h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SCORE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value} className="text-xs">
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Remote toggle */}
          <button
            onClick={() => setRemoteOnly((v) => !v)}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 h-9 rounded-md border text-xs font-medium transition-colors cursor-pointer",
              remoteOnly
                ? "bg-green-50 text-green-700 border-green-300 dark:bg-green-950 dark:text-green-400 dark:border-green-800"
                : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/40 bg-transparent",
            )}
          >
            <Wifi className="h-3.5 w-3.5" />
            Remote
          </button>

          {/* Clear filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer underline-offset-2 hover:underline"
            >
              <X className="h-3 w-3" />
              Clear filters
            </button>
          )}

          {/* View toggle */}
          <div className="ml-auto flex items-center border rounded-lg overflow-hidden h-9">
            <button
              onClick={() => setViewMode("cards")}
              className={cn(
                "px-2.5 h-full flex items-center transition-colors",
                viewMode === "cards"
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={cn(
                "px-2.5 h-full flex items-center border-l transition-colors",
                viewMode === "table"
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content + pagination */}
        <Card className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-auto">
            {isEmpty ? (
              <div className="h-64 flex items-center justify-center">
                <EmptyState
                  icon={Briefcase}
                  title="No jobs found"
                  description={
                    globalFilter || statusFilter !== "ALL" || hasActiveFilters
                      ? "Try adjusting your search or filters."
                      : "Jobs will appear here once they are imported."
                  }
                />
              </div>
            ) : viewMode === "cards" ? (
              <JobsCardGrid
                rows={visibleRows}
                isPending={isPending}
                onStatusUpdate={handleStatusUpdate}
                onNotes={setNotesJob}
              />
            ) : (
              <JobsTableView table={table} />
            )}
          </div>

          {/* Pagination footer */}
          <div className="flex items-center justify-between border-t px-4 py-2.5 shrink-0 bg-muted/20">
            <p className="text-xs text-muted-foreground">
              {totalFiltered === 0
                ? "No results"
                : `${totalFiltered} job${totalFiltered === 1 ? "" : "s"}`}
            </p>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2.5 text-xs"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                Previous
              </Button>
              <span className="text-xs text-muted-foreground tabular-nums px-1">
                {table.getState().pagination.pageIndex + 1} /{" "}
                {Math.max(1, table.getPageCount())}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2.5 text-xs"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                Next
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <JobNotesDialog
        job={notesJob}
        userId={userId}
        onClose={() => setNotesJob(null)}
        onSaved={(jobId, notes) => {
          setJobs((prev) =>
            prev.map((j) =>
              j.id === jobId
                ? {
                    ...j,
                    user_job: j.user_job ? { ...j.user_job, notes } : null,
                  }
                : j,
            ),
          );
        }}
      />

      {/* Apply confirmation dialog */}
      <AlertDialog
        open={!!applyTarget}
        onOpenChange={(open) => !open && setApplyTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark as Applied?</AlertDialogTitle>
            <AlertDialogDescription>
              {applyTarget && (
                <>
                  You're about to mark{" "}
                  <span className="font-medium text-foreground">
                    {applyTarget.title}
                  </span>{" "}
                  at{" "}
                  <span className="font-medium text-foreground">
                    {applyTarget.company}
                  </span>{" "}
                  as Applied.
                  {applyTarget.url && (
                    <> The listing has been opened in a new tab.</>
                  )}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setApplyTarget(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (applyTarget) commitStatusUpdate(applyTarget.id, "APPLIED");
                setApplyTarget(null);
              }}
            >
              Yes, I applied
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
