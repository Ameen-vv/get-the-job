"use client";

import {
  useReactTable,
  getCoreRowModel,
  type ColumnDef,
} from "@tanstack/react-table";
import { useState, useTransition, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
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
import {
  ALL_STATUSES,
  RECENCY_OPTIONS,
  SCORE_OPTIONS,
  PAGE_SIZE,
  buildFiltersQueryString,
  statusMatchesFilter,
  type JobsFilters,
  type StatusFilter,
  type RecencyFilter,
  type SortColumn,
} from "@/lib/jobs-filters";

// Re-export so job-notes-dialog.tsx import stays unchanged
export type { JobRow };

// ─── Column definitions ───────────────────────────────────────────────────────

function buildColumns(
  onStatusUpdate: (id: string, status: JobStatus) => void,
  onNotes: (job: JobRow) => void,
  sort: SortColumn,
  dir: "asc" | "desc",
  onSort: (column: SortColumn) => void,
): ColumnDef<JobRow>[] {
  return [
    {
      accessorKey: "score",
      header: () => (
        <SortButton
          label="Score"
          sorted={sort === "score" ? dir : false}
          onToggle={() => onSort("score")}
        />
      ),
      cell: ({ row }) => <ScoreBadge score={row.getValue("score")} />,
    },
    {
      id: "job",
      accessorFn: (row) => `${row.company} ${row.title}`,
      header: () => (
        <SortButton
          label="Job"
          sorted={sort === "job" ? dir : false}
          onToggle={() => onSort("job")}
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
      header: () => (
        <SortButton
          label="Posted"
          sorted={sort === "posted" ? dir : false}
          onToggle={() => onSort("posted")}
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
        const isHidden = status === "HIDDEN";
        return (
          <div className="flex items-center gap-1 justify-end">
            {!isSaved && !isApplied && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2.5 text-xs font-medium"
                onClick={() => onStatusUpdate(job.id, "SAVED")}
              >
                Save
              </Button>
            )}
            {!isApplied && (
              <Button
                size="sm"
                className="h-7 px-2.5 text-xs font-medium"
                onClick={() => onStatusUpdate(job.id, "APPLIED")}
              >
                Apply
              </Button>
            )}
            {!isHidden && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2.5 text-xs font-medium text-muted-foreground"
                onClick={() => onStatusUpdate(job.id, "HIDDEN")}
              >
                Not Interested
              </Button>
            )}
            <JobRowMenu job={job} onStatus={onStatusUpdate} onNotes={onNotes} />
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
  totalCount: number;
  sources: string[];
  filters: JobsFilters;
}

export function JobsTable({
  jobs: initialJobs,
  userId,
  totalCount,
  sources,
  filters,
}: JobsTableProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [jobs, setJobs] = useState(initialJobs);
  const [searchInput, setSearchInput] = useState(filters.q);
  const [notesJob, setNotesJob] = useState<JobRow | null>(null);
  const [applyTarget, setApplyTarget] = useState<JobRow | null>(null);
  const [, startTransition] = useTransition();

  // Resync local optimistic state whenever fresh server props arrive
  // (filter/sort/page navigation, or a router.refresh() after a mutation).
  useEffect(() => {
    setJobs(initialJobs);
  }, [initialJobs]);

  // Keep the search box in sync with the URL (e.g. Clear filters, back/forward).
  useEffect(() => {
    setSearchInput(filters.q);
  }, [filters.q]);

  // Debounce search text before pushing it to the URL/server.
  useEffect(() => {
    if (searchInput === filters.q) return;
    const timeout = setTimeout(() => {
      navigate({ q: searchInput, page: 1 });
    }, 400);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  function navigate(patch: Partial<JobsFilters>) {
    const next: JobsFilters = { ...filters, ...patch };
    const qs = buildFiltersQueryString(next);
    router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
  }

  const hasActiveFilters =
    filters.recency !== "any" ||
    filters.source !== "all" ||
    filters.scoreFloor !== 0 ||
    filters.remote;

  function clearFilters() {
    setSearchInput("");
    navigate({
      recency: "any",
      source: "all",
      scoreFloor: 0,
      remote: false,
      q: "",
      page: 1,
    });
  }

  function applyOptimisticStatus(jobId: string, newStatus: JobStatus) {
    setJobs((prev) => {
      if (!statusMatchesFilter(newStatus, filters.status)) {
        return prev.filter((j) => j.id !== jobId);
      }
      return prev.map((j) =>
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
      );
    });
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
    applyOptimisticStatus(jobId, newStatus);

    startTransition(async () => {
      const result = await updateJobStatus({
        jobId,
        userId,
        status: newStatus,
      });
      if (result.success) {
        toast.success(`Job marked as ${JOB_STATUS_LABELS[newStatus]}`);
        // Resync counts/pagination/sources from the server.
        router.refresh();
      } else {
        // Revert to last known-good server state on failure
        setJobs(initialJobs);
        toast.error("Failed to update job status");
      }
    });
  }

  const columns = buildColumns(
    handleStatusUpdate,
    setNotesJob,
    filters.sort,
    filters.dir,
    (column) => {
      if (filters.sort === column) {
        navigate({ dir: filters.dir === "asc" ? "desc" : "asc", page: 1 });
      } else {
        navigate({ sort: column, dir: "asc", page: 1 });
      }
    },
  );

  const table = useReactTable({
    data: jobs,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const visibleRows = table.getRowModel().rows;
  const isEmpty = visibleRows.length === 0;
  const pageSize = PAGE_SIZE[filters.view];
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return (
    <>
      <div className="flex flex-col h-full gap-3">
        {/* Status pills */}
        <div className="flex gap-1.5 flex-wrap">
          {ALL_STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => navigate({ status: s as StatusFilter, page: 1 })}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer",
                filters.status === s
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
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9 pr-9"
            />
            {searchInput && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={() => setSearchInput("")}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>

          {/* Recency */}
          <Select
            value={filters.recency}
            onValueChange={(v) =>
              navigate({ recency: v as RecencyFilter, page: 1 })
            }
          >
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
            <Select
              value={filters.source}
              onValueChange={(v) => navigate({ source: v, page: 1 })}
            >
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
          <Select
            value={String(filters.scoreFloor)}
            onValueChange={(v) =>
              navigate({ scoreFloor: parseInt(v, 10), page: 1 })
            }
          >
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
            onClick={() => navigate({ remote: !filters.remote, page: 1 })}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 h-9 rounded-md border text-xs font-medium transition-colors cursor-pointer",
              filters.remote
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
              onClick={() => navigate({ view: "cards", page: 1 })}
              className={cn(
                "px-2.5 h-full flex items-center transition-colors",
                filters.view === "cards"
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => navigate({ view: "table", page: 1 })}
              className={cn(
                "px-2.5 h-full flex items-center border-l transition-colors",
                filters.view === "table"
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
                    filters.q || filters.status !== "ALL" || hasActiveFilters
                      ? "Try adjusting your search or filters."
                      : "Jobs will appear here once they are imported."
                  }
                />
              </div>
            ) : filters.view === "cards" ? (
              <JobsCardGrid
                rows={visibleRows}
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
              {totalCount === 0
                ? "No results"
                : `${totalCount} job${totalCount === 1 ? "" : "s"}`}
            </p>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2.5 text-xs"
                onClick={() => navigate({ page: filters.page - 1 })}
                disabled={filters.page <= 1}
              >
                Previous
              </Button>
              <span className="text-xs text-muted-foreground tabular-nums px-1">
                {filters.page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2.5 text-xs"
                onClick={() => navigate({ page: filters.page + 1 })}
                disabled={filters.page >= totalPages}
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
          router.refresh();
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
            <Button
              variant="ghost"
              className="text-muted-foreground sm:mr-auto"
              onClick={() => {
                if (applyTarget) commitStatusUpdate(applyTarget.id, "HIDDEN");
                setApplyTarget(null);
              }}
            >
              Not Interested
            </Button>
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
