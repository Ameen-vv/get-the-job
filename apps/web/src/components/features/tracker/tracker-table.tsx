"use client";

import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { useState, useTransition, useMemo } from "react";
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
import { isAfter, subDays } from "date-fns";
import type { UserJob, Job, JobStatus } from "@/types";
import { bulkUpdateJobStatus, updateJobStatus } from "@/lib/actions/jobs.actions";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type TrackerRow = UserJob & { job: Job };

interface TrackerTableProps {
  trackedJobs: TrackerRow[];
  userId: string;
}

const TRACKER_STATUSES = ["ALL", "NEW", "SAVED", "APPLIED", "INTERVIEW", "REJECTED", "OFFER", "HIDDEN"] as const;

const RECENCY_OPTIONS = [
  { value: "any", label: "Any time" },
  { value: "1d", label: "Today" },
  { value: "3d", label: "Last 3 days" },
  { value: "7d", label: "Last week" },
  { value: "30d", label: "Last 30 days" },
] as const;

const RECENCY_DAYS: Record<string, number> = {
  "1d": 1,
  "3d": 3,
  "7d": 7,
  "30d": 30,
};

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

export function TrackerTable({ trackedJobs: initial, userId }: TrackerTableProps) {
  const [rows, setRows] = useState(initial);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [recencyFilter, setRecencyFilter] = useState<string>("any");
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [isPending, startTransition] = useTransition();

  const hasActiveFilters = recencyFilter !== "any";

  function handleSingleUpdate(userJobId: string, jobId: string, status: JobStatus) {
    // Optimistic update
    const previous = rows.find((r) => r.id === userJobId);
    setRows((prev) => prev.map((r) => (r.id === userJobId ? { ...r, status } : r)));

    startTransition(async () => {
      const result = await updateJobStatus({ jobId, userId, status });
      if (result.success) {
        toast.success(`Marked as ${JOB_STATUS_LABELS[status]}`);
      } else {
        // Revert
        setRows((prev) =>
          prev.map((r) => (r.id === userJobId ? { ...r, status: previous?.status ?? r.status } : r))
        );
        toast.error("Failed to update status");
      }
    });
  }

  function handleBulkUpdate(status: JobStatus) {
    const selectedIds = Object.keys(rowSelection).filter((k) => rowSelection[k]);
    if (selectedIds.length === 0) return;

    // Optimistic update
    const previousRows = rows;
    setRows((prev) => prev.map((r) => (selectedIds.includes(r.id) ? { ...r, status } : r)));
    setRowSelection({});

    startTransition(async () => {
      const result = await bulkUpdateJobStatus(selectedIds, status);
      if (result.success) {
        toast.success(`Updated ${selectedIds.length} application${selectedIds.length === 1 ? "" : "s"}`);
      } else {
        setRows(previousRows);
        toast.error("Bulk update failed");
      }
    });
  }

  const filteredRows = useMemo(() => {
    let result = rows;

    if (statusFilter !== "ALL") {
      result = result.filter((r) => r.status === statusFilter);
    }

    if (recencyFilter !== "any") {
      const days = RECENCY_DAYS[recencyFilter];
      const cutoff = subDays(new Date(), days);
      result = result.filter(
        (r) => r.updated_at && isAfter(new Date(r.updated_at), cutoff)
      );
    }

    return result;
  }, [rows, statusFilter, recencyFilter]);

  const columns: ColumnDef<TrackerRow>[] = [
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
      enableGlobalFilter: false,
    },
    {
      id: "job",
      accessorFn: (r) => `${r.job.company} ${r.job.title}`,
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
            {row.original.job.company}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5 truncate">
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
      header: ({ column }) => (
        <SortButton
          label="Updated"
          sorted={column.getIsSorted()}
          onToggle={() => column.toggleSorting(column.getIsSorted() === "asc")}
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
                      <a href={r.job.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Open Listing
                      </a>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem onClick={() => handleSingleUpdate(r.id, r.job_id, "APPLIED")}>
                  Mark Applied
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSingleUpdate(r.id, r.job_id, "INTERVIEW")}>
                  Mark Interview
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSingleUpdate(r.id, r.job_id, "OFFER")}>
                  Mark Offer
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSingleUpdate(r.id, r.job_id, "REJECTED")}>
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
    data: filteredRows,
    columns,
    state: { sorting, globalFilter, rowSelection },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 20 } },
    getRowId: (row) => row.id,
  });

  const selectedCount = Object.values(rowSelection).filter(Boolean).length;
  const totalFiltered = table.getFilteredRowModel().rows.length;

  return (
    <div className="flex flex-col h-full gap-3">
      {/* Status pill filter */}
      <div className="flex gap-1.5 flex-wrap">
        {TRACKER_STATUSES.map((s) => {
          const isActive = statusFilter === s;
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer",
                isActive
                  ? "bg-foreground text-background border-foreground"
                  : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/40 bg-transparent"
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

        {hasActiveFilters && (
          <button
            onClick={() => setRecencyFilter("any")}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer underline-offset-2 hover:underline"
          >
            <X className="h-3 w-3" />
            Clear filters
          </button>
        )}

        {selectedCount > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="sm" disabled={isPending}>
                Bulk update ({selectedCount})
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {(["APPLIED", "INTERVIEW", "OFFER", "REJECTED", "HIDDEN"] as JobStatus[]).map(
                (s) => (
                  <DropdownMenuItem key={s} onClick={() => handleBulkUpdate(s)}>
                    Mark as {JOB_STATUS_LABELS[s]}
                  </DropdownMenuItem>
                )
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <Card className="flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-auto">
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
              {table.getRowModel().rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-64 text-center">
                    <EmptyState
                      icon={BookmarkCheck}
                      title="No tracked applications"
                      description={
                        globalFilter || statusFilter !== "ALL" || hasActiveFilters
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
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between border-t px-4 py-2.5 shrink-0 bg-muted/20">
          <p className="text-xs text-muted-foreground">
            {selectedCount > 0
              ? `${selectedCount} of ${totalFiltered} selected`
              : `${totalFiltered} application${totalFiltered === 1 ? "" : "s"}`}
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
              {table.getState().pagination.pageIndex + 1} / {Math.max(1, table.getPageCount())}
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
  );
}
