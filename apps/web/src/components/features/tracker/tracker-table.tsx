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
import { useState, useTransition } from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  BookmarkCheck,
  Search,
  X,
  MoreHorizontal,
  ExternalLink,
} from "lucide-react";
import { formatRelativeDate, JOB_STATUS_LABELS } from "@/lib/utils";
import type { UserJob, Job, JobStatus } from "@/types";
import { bulkUpdateJobStatus, updateJobStatus } from "@/lib/actions/jobs.actions";
import { toast } from "sonner";

type TrackerRow = UserJob & { job: Job };

interface TrackerTableProps {
  trackedJobs: TrackerRow[];
  userId: string;
}

const TRACKER_STATUSES = ["ALL", "NEW", "SAVED", "APPLIED", "INTERVIEW", "REJECTED", "OFFER", "HIDDEN"] as const;

export function TrackerTable({ trackedJobs: initial, userId }: TrackerTableProps) {
  const [rows, setRows] = useState(initial);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [isPending, startTransition] = useTransition();

  function handleSingleUpdate(userJobId: string, jobId: string, status: JobStatus) {
    startTransition(async () => {
      const result = await updateJobStatus({ jobId, userId, status });
      if (result.success) {
        setRows((prev) =>
          prev.map((r) =>
            r.id === userJobId ? { ...r, status } : r
          )
        );
        toast.success(`Marked as ${JOB_STATUS_LABELS[status]}`);
      } else {
        toast.error("Failed to update status");
      }
    });
  }

  function handleBulkUpdate(status: JobStatus) {
    const selectedIds = Object.keys(rowSelection).filter((k) => rowSelection[k]);
    if (selectedIds.length === 0) return;

    startTransition(async () => {
      const result = await bulkUpdateJobStatus(selectedIds, status);
      if (result.success) {
        setRows((prev) =>
          prev.map((r) =>
            selectedIds.includes(r.id) ? { ...r, status } : r
          )
        );
        setRowSelection({});
        toast.success(`Updated ${selectedIds.length} application(s)`);
      } else {
        toast.error("Bulk update failed");
      }
    });
  }

  const filteredRows =
    statusFilter === "ALL"
      ? rows
      : rows.filter((r) => r.status === statusFilter);

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
      accessorFn: (r) => r.job.company,
      id: "company",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Company
          {column.getIsSorted() === "asc" ? (
            <ArrowUp className="ml-2 h-3.5 w-3.5" />
          ) : column.getIsSorted() === "desc" ? (
            <ArrowDown className="ml-2 h-3.5 w-3.5" />
          ) : (
            <ArrowUpDown className="ml-2 h-3.5 w-3.5 opacity-50" />
          )}
        </Button>
      ),
      cell: ({ row }) => (
        <span className="font-medium">{row.original.job.company}</span>
      ),
    },
    {
      accessorFn: (r) => r.job.title,
      id: "title",
      header: "Role",
      cell: ({ row }) => row.original.job.title,
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
        <span className="text-sm text-muted-foreground line-clamp-1 max-w-xs">
          {row.original.notes ?? "—"}
        </span>
      ),
    },
    {
      accessorKey: "updated_at",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Last Updated
          {column.getIsSorted() === "asc" ? (
            <ArrowUp className="ml-2 h-3.5 w-3.5" />
          ) : column.getIsSorted() === "desc" ? (
            <ArrowDown className="ml-2 h-3.5 w-3.5" />
          ) : (
            <ArrowUpDown className="ml-2 h-3.5 w-3.5 opacity-50" />
          )}
        </Button>
      ),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatRelativeDate(row.original.updated_at)}
        </span>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const r = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              {r.job.url && (
                <DropdownMenuItem asChild>
                  <a href={r.job.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open Job
                  </a>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
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

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search applications..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-9"
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
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            {TRACKER_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s === "ALL" ? "All Statuses" : JOB_STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedCount > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" disabled={isPending}>
                Bulk Update ({selectedCount})
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
                <TableRow key={hg.id}>
                  {hg.headers.map((h) => (
                    <TableHead key={h.id}>
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
                      description="Save or apply to jobs from the Jobs page to track them here."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between border-t px-4 py-3 shrink-0">
          <p className="text-sm text-muted-foreground">
            {selectedCount > 0
              ? `${selectedCount} of ${table.getFilteredRowModel().rows.length} selected`
              : `${table.getFilteredRowModel().rows.length} application(s)`}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
            </span>
            <Button
              variant="outline"
              size="sm"
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
