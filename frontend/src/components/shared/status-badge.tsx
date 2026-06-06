import { cn, JOB_STATUS_COLORS, JOB_STATUS_LABELS } from "@/lib/utils";
import type { JobStatus } from "@/types";

interface StatusBadgeProps {
  status: JobStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const colors = JOB_STATUS_COLORS[status];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        colors.bg,
        colors.text,
        colors.border,
        className
      )}
    >
      {JOB_STATUS_LABELS[status] ?? status}
    </span>
  );
}
