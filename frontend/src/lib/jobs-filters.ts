import type { JobStatus } from "@/types";

// Shared between the server query (jobs/page.tsx -> jobs.service.ts) and the
// client filter bar (jobs-table.tsx), so both agree on valid values, param
// names, and defaults for the URL-driven filter/sort/pagination state.

export const ALL_STATUSES = [
  "ALL",
  "NEW",
  "SAVED",
  "APPLIED",
  "INTERVIEW",
  "REJECTED",
  "OFFER",
  "HIDDEN",
] as const;
export type StatusFilter = (typeof ALL_STATUSES)[number];

export const RECENCY_OPTIONS = [
  { value: "any", label: "Any time" },
  { value: "1d", label: "Today" },
  { value: "2d", label: "Last 2 days" },
  { value: "3d", label: "Last 3 days" },
  { value: "7d", label: "Last week" },
  { value: "30d", label: "Last 30 days" },
] as const;
export type RecencyFilter = (typeof RECENCY_OPTIONS)[number]["value"];

export const RECENCY_DAYS: Record<string, number> = {
  "1d": 1,
  "2d": 2,
  "3d": 3,
  "7d": 7,
  "30d": 30,
};

export const SCORE_OPTIONS = [
  { value: "0", label: "Any score" },
  { value: "6", label: "6+" },
  { value: "7", label: "7+" },
  { value: "8", label: "8+" },
  { value: "9", label: "9+" },
] as const;

export const SORT_COLUMNS = ["score", "job", "posted"] as const;
export type SortColumn = (typeof SORT_COLUMNS)[number];

export const VIEW_MODES = ["cards", "table"] as const;
export type ViewMode = (typeof VIEW_MODES)[number];

export const PAGE_SIZE: Record<ViewMode, number> = { cards: 12, table: 20 };

export interface JobsFilters {
  status: StatusFilter;
  recency: RecencyFilter;
  source: string;
  scoreFloor: number;
  remote: boolean;
  q: string;
  sort: SortColumn;
  dir: "asc" | "desc";
  view: ViewMode;
  page: number;
}

export const DEFAULT_FILTERS: JobsFilters = {
  status: "ALL",
  recency: "any",
  source: "all",
  scoreFloor: 0,
  remote: false,
  q: "",
  sort: "score",
  dir: "desc",
  view: "cards",
  page: 1,
};

type RawSearchParams = Record<string, string | string[] | undefined>;

function first(sp: RawSearchParams, key: string): string | undefined {
  const v = sp[key];
  return Array.isArray(v) ? v[0] : v;
}

export function parseJobsFilters(sp: RawSearchParams): JobsFilters {
  const status = first(sp, "status");
  const recency = first(sp, "recency");
  const score = first(sp, "score");
  const sort = first(sp, "sort");
  const dir = first(sp, "dir");
  const view = first(sp, "view");
  const page = parseInt(first(sp, "page") ?? "1", 10);

  return {
    status: (ALL_STATUSES as readonly string[]).includes(status ?? "")
      ? (status as StatusFilter)
      : DEFAULT_FILTERS.status,
    recency: RECENCY_OPTIONS.some((o) => o.value === recency)
      ? (recency as RecencyFilter)
      : DEFAULT_FILTERS.recency,
    source: first(sp, "source") ?? DEFAULT_FILTERS.source,
    scoreFloor: SCORE_OPTIONS.some((o) => o.value === score)
      ? parseInt(score!, 10)
      : DEFAULT_FILTERS.scoreFloor,
    remote: first(sp, "remote") === "1",
    q: (first(sp, "q") ?? "").trim().slice(0, 200),
    sort: (SORT_COLUMNS as readonly string[]).includes(sort ?? "")
      ? (sort as SortColumn)
      : DEFAULT_FILTERS.sort,
    dir: dir === "asc" ? "asc" : DEFAULT_FILTERS.dir,
    view: (VIEW_MODES as readonly string[]).includes(view ?? "")
      ? (view as ViewMode)
      : DEFAULT_FILTERS.view,
    page: Number.isFinite(page) && page > 0 ? page : DEFAULT_FILTERS.page,
  };
}

const FILTER_PARAM_KEYS: Record<keyof JobsFilters, string> = {
  status: "status",
  recency: "recency",
  source: "source",
  scoreFloor: "score",
  remote: "remote",
  q: "q",
  sort: "sort",
  dir: "dir",
  view: "view",
  page: "page",
};

/** Serializes only the filters that differ from defaults, for clean/shareable URLs. */
export function buildFiltersQueryString(filters: JobsFilters): string {
  const params = new URLSearchParams();
  (Object.keys(DEFAULT_FILTERS) as (keyof JobsFilters)[]).forEach((key) => {
    const value = filters[key];
    if (value === DEFAULT_FILTERS[key]) return;
    const paramKey = FILTER_PARAM_KEYS[key];
    if (key === "remote") {
      if (value) params.set(paramKey, "1");
    } else {
      params.set(paramKey, String(value));
    }
  });
  return params.toString();
}

export function statusMatchesFilter(
  status: JobStatus,
  filter: StatusFilter,
): boolean {
  if (filter === "ALL") {
    return (
      status !== "HIDDEN" &&
      status !== "APPLIED" &&
      status !== "INTERVIEW" &&
      status !== "OFFER"
    );
  }
  if (filter === "NEW") return status === "NEW";
  return status === filter;
}
