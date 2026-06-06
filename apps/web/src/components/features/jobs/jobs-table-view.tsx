"use client";

import { flexRender, type Table } from "@tanstack/react-table";
import {
  Table as UITable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { JobRow } from "./jobs-shared";

interface JobsTableViewProps {
  table: Table<JobRow>;
}

export function JobsTableView({ table }: JobsTableViewProps) {
  return (
    <UITable>
      <TableHeader>
        {table.getHeaderGroups().map((hg) => (
          <TableRow key={hg.id} className="hover:bg-transparent">
            {hg.headers.map((h) => (
              <TableHead key={h.id} className="whitespace-nowrap">
                {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows.map((row) => (
          <TableRow key={row.id} className="hover:bg-muted/40 transition-colors">
            {row.getVisibleCells().map((cell) => (
              <TableCell key={cell.id} className="py-3">
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </UITable>
  );
}
