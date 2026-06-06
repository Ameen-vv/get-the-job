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
  type ColumnFiltersState,
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
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MoreHorizontal,
  ExternalLink,
  Briefcase,
  Search,
  X,
} from "lucide-react";
import { formatRelativeDate, JOB_STATUS_LABELS } from "@/lib/utils";
import type { Job, UserJob, JobStatus } from "@/types";
import { updateJobStatus } from "@/lib/actions/jobs.actions";
import { toast } from "sonner";
import { JobNotesDialog } from "./job-notes-dialog";

export type JobRow = Job & {
  user_job: Pick<UserJob, "id" | "status" | "notes" | "updated_at"> | null;
};

interface JobsTableProps {
  jobs: JobRow[];
  userId: string;
}

const ALL_STATUSES = ["ALL", "NEW", "SAVED", "APPLIED", "INTERVIEW", "REJECTED", "OFFER", "HIDDEN"] as const;

export function JobsTable({ jobs: initialJobs, userId }: JobsTableProps) {
  const [jobs, setJobs] = useState(initialJobs);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [notesJob, setNotesJob] = useState<JobRow | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleStatusUpdate(jobId: string, newStatus: JobStatus) {
    startTransition(async () => {
      const result = await updateJobStatus({ jobId, userId, status: newStatus });
      if (result.success) {
        setJobs((prev) =>
          prev.map((j) =>
            j.id === jobId
              ? {
                  ...j,
                  user_job: result.userJob
                    ? {
                        id: result.userJob.id,
                        status: result.userJob.status,
                        notes: result.userJob.notes,
                        updated_at: result.userJob.updated_at,
                      }
                    : j.user_job,
                }
              : j
          )
        );
        toast.success(`Job marked as ${JOB_STATUS_LABELS[newStatus]}`);
      } else {
        toast.error("Failed to update job status");
      }
    });
  }

  const columns: ColumnDef<JobRow>[] = [
    {
      accessorKey: "company",
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
        <span className="font-medium">{row.getValue("company")}</span>
      ),
    },
    {
      accessorKey: "title",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Job Title
          {column.getIsSorted() === "asc" ? (
            <ArrowUp className="ml-2 h-3.5 w-3.5" />
          ) : column.getIsSorted() === "desc" ? (
            <ArrowDown className="ml-2 h-3.5 w-3.5" />
          ) : (
            <ArrowUpDown className="ml-2 h-3.5 w-3.5 opacity-50" />
          )}
        </Button>
      ),
    },
    {
      accessorKey: "location",
      header: "Location",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.getValue("location") ?? "—"}
        </span>
      ),
    },
    {
      accessorKey: "source",
      header: "Source",
      cell: ({ row }) => (
        <span className="capitalize text-sm text-muted-foreground">
          {row.getValue("source")}
        </span>
      ),
    },
    {
      accessorKey: "posted_at",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Posted
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
          {formatRelativeDate(row.getValue("posted_at"))}
        </span>
      ),
    },
    {
      id: "status",
      header: "Status",
      accessorFn: (row) => row.user_job?.status ?? null,
      cell: ({ row }) => {
        const status = row.original.user_job?.status as JobStatus | undefined;
        return status ? (
          <StatusBadge status={status} />
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const job = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              {job.url && (
                <DropdownMenuItem asChild>
                  <a href={job.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open Job
                  </a>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleStatusUpdate(job.id, "SAVED")}>
                Save Job
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusUpdate(job.id, "APPLIED")}>
                Mark Applied
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusUpdate(job.id, "INTERVIEW")}>
                Mark Interview
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusUpdate(job.id, "REJECTED")}>
                Mark Rejected
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setNotesJob(job)}>
                Add Notes
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-muted-foreground"
                onClick={() => handleStatusUpdate(job.id, "HIDDEN")}
              >
                Hide Job
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const filteredByStatus =
    statusFilter === "ALL"
      ? jobs
      : statusFilter === "NEW"
      ? jobs.filter((j) => !j.user_job || j.user_job.status === "NEW")
      : jobs.filter((j) => j.user_job?.status === statusFilter);

  const table = useReactTable({
    data: filteredByStatus,
    columns,
    state: { sorting, columnFilters, globalFilter },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 20 } },
  });

  return (
    <>
      <div className="flex flex-col h-full gap-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search jobs..."
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
              {ALL_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s === "ALL" ? "All Statuses" : JOB_STATUS_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <Card className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-auto">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-64 text-center"
                    >
                      <EmptyState
                        icon={Briefcase}
                        title="No jobs found"
                        description={
                          globalFilter || statusFilter !== "ALL"
                            ? "Try adjusting your search or filters."
                            : "Jobs will appear here once they are imported."
                        }
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id}>
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

          {/* Pagination */}
          <div className="flex items-center justify-between border-t px-4 py-3 shrink-0">
            <p className="text-sm text-muted-foreground">
              {table.getFilteredRowModel().rows.length} job(s)
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
                Page {table.getState().pagination.pageIndex + 1} of{" "}
                {table.getPageCount()}
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
                    user_job: j.user_job
                      ? { ...j.user_job, notes }
                      : null,
                  }
                : j
            )
          );
        }}
      />
    </>
  );
}
