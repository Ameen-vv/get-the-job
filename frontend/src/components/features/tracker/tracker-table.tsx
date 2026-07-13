"use client";

import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table";
import { useState, useTransition, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  BookmarkCheck,
  Search,
  X,
  MoreHorizontal,
  ExternalLink,
  Clock,
} from "lucide-react";
import { formatRelativeDate, JOB_STATUS_LABELS, cn } from "@/lib/utils";
import type { TrackedJob, JobStatus } from "@/types";
import {
  bulkUpdateJobStatus,
  updateJobStatus,
} from "@/lib/actions/jobs.actions";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TrackerTableSkeleton } from "./tracker-skeleton";
import {
  TRACKER_STATUSES,
  TRACKER_RECENCY_OPTIONS,
  TRACKER_PAGE_SIZE,
  buildTrackerQueryString,
  type TrackerFilters,
  type TrackerStatusFilter,
  type TrackerRecencyFilter,
  type TrackerSortColumn,
} from "@/lib/tracker-filters";

interface TrackerTableProps {
  trackedJobs: TrackedJob[];
  userId: string;
  totalCount: number;
  filters: TrackerFilters;
}

function SortButton({
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

function matchesStatusFilter(
  status: JobStatus,
  filter: TrackerStatusFilter,
): boolean {
  return filter === "ALL" || status === filter;
}

export function TrackerTable({
  trackedJobs: initialTrackedJobs,
  userId,
  totalCount,
  filters,
}: TrackerTableProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [rows, setRows] = useState(initialTrackedJobs);
  const [searchInput, setSearchInput] = useState(filters.q);
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [isNavPending, startNavTransition] = useTransition();
  // Separate transition for the post-mutation router.refresh() — kept apart
  // from isNavPending so status changes stay purely optimistic with no
  // visible dimming/skeleton, unlike filter navigation.
  const [, startRefreshTransition] = useTransition();

  useEffect(() => {
    setRows(initialTrackedJobs);
  }, [initialTrackedJobs]);

  useEffect(() => {
    setSearchInput(filters.q);
  }, [filters.q]);

  useEffect(() => {
    if (searchInput === filters.q) return;
    const timeout = setTimeout(() => {
      navigate({ q: searchInput, page: 1 });
    }, 400);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  function navigate(patch: Partial<TrackerFilters>) {
    const next: TrackerFilters = { ...filters, ...patch };
    const qs = buildTrackerQueryString(next);
    startNavTransition(() => {
      router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
    });
  }

  const hasActiveFilters = filters.recency !== "any";

  async function handleSingleUpdate(
    userJobId: string,
    jobId: string,
    status: JobStatus,
  ) {
    // Optimistic update — UI changes instantly
    setRows((prev) => {
      if (!matchesStatusFilter(status, filters.status)) {
        return prev.filter((r) => r.id !== userJobId);
      }
      return prev.map((r) => (r.id === userJobId ? { ...r, status } : r));
    });

    const result = await updateJobStatus({ jobId, userId, status });
    if (result.success) {
      toast.success(`Marked as ${JOB_STATUS_LABELS[status]}`);
      startRefreshTransition(() => {
        router.refresh();
      });
    } else {
      setRows(initialTrackedJobs);
      toast.error("Failed to update status");
    }
  }

  async function handleBulkUpdate(status: JobStatus) {
    const selectedIds = Object.keys(rowSelection).filter((k) => rowSelection[k]);
    if (selectedIds.length === 0) return;

    setRows((prev) => {
      if (!matchesStatusFilter(status, filters.status)) {
        return prev.filter((r) => !selectedIds.includes(r.id));
      }
      return prev.map((r) =>
        selectedIds.includes(r.id) ? { ...r, status } : r,
      );
    });
    setRowSelection({});

    const result = await bulkUpdateJobStatus(selectedIds, status);
    if (result.success) {
      toast.success(
        `Updated ${selectedIds.length} application${selectedIds.length === 1 ? "" : "s"}`,
      );
      startRefreshTransition(() => {
        router.refresh();
      });
    } else {
      setRows(initialTrackedJobs);
      toast.error("Bulk update failed");
    }
  }

  function onSort(column: TrackerSortColumn) {
    if (filters.sort === column) {
      navigate({ dir: filters.dir === "asc" ? "desc" : "asc", page: 1 });
    } else {
      navigate({ sort: column, dir: "asc", page: 1 });
    }
  }

  const columns: ColumnDef<TrackedJob>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(v) => row.toggleSelected(!!v)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
    },
    {
      id: "job",
      accessorFn: (r) => `${r.job.company} ${r.job.title}`,
      header: () => (
        <SortButton
          label="Job"
          sorted={filters.sort === "job" ? filters.dir : false}
          onToggle={() => onSort("job")}
        />
      ),
      cell: ({ row }) => (
        <div className="min-w-0">
          <div className="font-medium text-sm leading-snug truncate">
            {row.original.job.company}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5 truncate max-w-64">
            {row.original.job.title}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: "notes",
      header: "Notes",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground line-clamp-2 max-w-xs">
          {row.original.notes ?? <span className="opacity-40">—</span>}
        </span>
      ),
    },
    {
      accessorKey: "updated_at",
      header: () => (
        <SortButton
          label="Updated"
          sorted={filters.sort === "updated" ? filters.dir : false}
          onToggle={() => onSort("updated")}
        />
      ),
      cell: ({ row }) => (
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
          <Clock className="h-3 w-3 shrink-0" />
          {formatRelativeDate(row.original.updated_at)}
        </span>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const r = row.original;
        return (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <MoreHorizontal className="h-3.5 w-3.5" />
                  <span className="sr-only">More options</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                {r.job.url && (
                  <>
                    <DropdownMenuItem asChild>
                      <a
                        href={r.job.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Open Listing
                      </a>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem
                  onClick={() => handleSingleUpdate(r.id, r.job_id, "APPLIED")}
                >
                  Mark Applied
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    handleSingleUpdate(r.id, r.job_id, "INTERVIEW")
                  }
                >
                  Mark Interview
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleSingleUpdate(r.id, r.job_id, "OFFER")}
                >
                  Mark Offer
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleSingleUpdate(r.id, r.job_id, "REJECTED")}
                >
                  Mark Rejected
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: rows,
    columns,
    state: { rowSelection },
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
  });

  const selectedCount = Object.values(rowSelection).filter(Boolean).length;
  const totalPages = Math.max(1, Math.ceil(totalCount / TRACKER_PAGE_SIZE));
  const isEmpty = rows.length === 0;

  return (
    <div className="flex flex-col h-full gap-3">
      {/* Status pill filter */}
      <div className="flex gap-1.5 flex-wrap">
        {TRACKER_STATUSES.map((s) => {
          const isActive = filters.status === s;
          return (
            <button
              key={s}
              onClick={() =>
                navigate({ status: s as TrackerStatusFilter, page: 1 })
              }
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer",
                isActive
                  ? "bg-foreground text-background border-foreground"
                  : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/40 bg-transparent",
              )}
            >
              {s === "ALL" ? "All" : JOB_STATUS_LABELS[s]}
            </button>
          );
        })}
      </div>

      {/* Search + filters + bulk actions */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search applications…"
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

        <Select
          value={filters.recency}
          onValueChange={(v) =>
            navigate({ recency: v as TrackerRecencyFilter, page: 1 })
          }
        >
          <SelectTrigger className="w-36 h-9 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TRACKER_RECENCY_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value} className="text-xs">
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <button
            onClick={() => navigate({ recency: "any", page: 1 })}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer underline-offset-2 hover:underline"
          >
            <X className="h-3 w-3" />
            Clear filters
          </button>
        )}

        {selectedCount > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="sm">
                Bulk update ({selectedCount})
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {(
                [
                  "APPLIED",
                  "INTERVIEW",
                  "OFFER",
                  "REJECTED",
                  "HIDDEN",
                ] as JobStatus[]
              ).map((s) => (
                <DropdownMenuItem key={s} onClick={() => handleBulkUpdate(s)}>
                  Mark as {JOB_STATUS_LABELS[s]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <Card className="flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-auto">
          {isNavPending ? (
            <TrackerTableSkeleton count={TRACKER_PAGE_SIZE} />
          ) : (
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((hg) => (
                  <TableRow key={hg.id} className="hover:bg-transparent">
                    {hg.headers.map((h) => (
                      <TableHead key={h.id} className="whitespace-nowrap">
                        {h.isPlaceholder
                          ? null
                          : flexRender(h.column.columnDef.header, h.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {isEmpty ? (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-64 text-center"
                    >
                      <EmptyState
                        icon={BookmarkCheck}
                        title="No tracked applications"
                        description={
                          filters.q ||
                          filters.status !== "ALL" ||
                          hasActiveFilters
                            ? "Try adjusting your search or filters."
                            : "Save or apply to jobs from the Jobs page to track them here."
                        }
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                      className="group hover:bg-muted/40 transition-colors"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="py-2.5">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </div>

        <div className="flex items-center justify-between border-t px-4 py-2.5 shrink-0 bg-muted/20">
          <p className="text-xs text-muted-foreground">
            {selectedCount > 0
              ? `${selectedCount} of ${totalCount} selected`
              : `${totalCount} application${totalCount === 1 ? "" : "s"}`}
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
  );
}
