import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, parseISO } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return "—";
  try {
    return format(parseISO(date), "MMM d, yyyy");
  } catch {
    return "—";
  }
}

export function formatRelativeDate(date: string | null | undefined): string {
  if (!date) return "—";
  try {
    return formatDistanceToNow(parseISO(date), { addSuffix: true });
  } catch {
    return "—";
  }
}

export function generateJobHash(
  company: string,
  title: string,
  location: string
): string {
  const raw = `${company.toLowerCase().trim()}|${title.toLowerCase().trim()}|${location.toLowerCase().trim()}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

export const JOB_STATUS_LABELS: Record<string, string> = {
  NEW: "New",
  SAVED: "Saved",
  APPLIED: "Applied",
  INTERVIEW: "Interview",
  REJECTED: "Rejected",
  OFFER: "Offer",
  HIDDEN: "Hidden",
};

export const JOB_STATUS_COLORS: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  NEW: {
    bg: "bg-blue-50 dark:bg-blue-950",
    text: "text-blue-700 dark:text-blue-300",
    border: "border-blue-200 dark:border-blue-800",
  },
  SAVED: {
    bg: "bg-yellow-50 dark:bg-yellow-950",
    text: "text-yellow-700 dark:text-yellow-300",
    border: "border-yellow-200 dark:border-yellow-800",
  },
  APPLIED: {
    bg: "bg-purple-50 dark:bg-purple-950",
    text: "text-purple-700 dark:text-purple-300",
    border: "border-purple-200 dark:border-purple-800",
  },
  INTERVIEW: {
    bg: "bg-orange-50 dark:bg-orange-950",
    text: "text-orange-700 dark:text-orange-300",
    border: "border-orange-200 dark:border-orange-800",
  },
  REJECTED: {
    bg: "bg-red-50 dark:bg-red-950",
    text: "text-red-700 dark:text-red-300",
    border: "border-red-200 dark:border-red-800",
  },
  OFFER: {
    bg: "bg-green-50 dark:bg-green-950",
    text: "text-green-700 dark:text-green-300",
    border: "border-green-200 dark:border-green-800",
  },
  HIDDEN: {
    bg: "bg-gray-50 dark:bg-gray-900",
    text: "text-gray-500 dark:text-gray-400",
    border: "border-gray-200 dark:border-gray-700",
  },
};
