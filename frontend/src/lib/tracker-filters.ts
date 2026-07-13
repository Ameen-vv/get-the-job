// Shared between the server query (tracker/page.tsx -> jobs.service.ts) and
// the client filter bar (tracker-table.tsx), so both agree on valid values,
// param names, and defaults for the URL-driven filter/sort/pagination state.

export const TRACKER_STATUSES = [
  "ALL",
  "NEW",
  "SAVED",
  "APPLIED",
  "INTERVIEW",
  "REJECTED",
  "OFFER",
  "HIDDEN",
] as const;
export type TrackerStatusFilter = (typeof TRACKER_STATUSES)[number];

export const TRACKER_RECENCY_OPTIONS = [
  { value: "any", label: "Any time" },
  { value: "1d", label: "Today" },
  { value: "3d", label: "Last 3 days" },
  { value: "7d", label: "Last week" },
  { value: "30d", label: "Last 30 days" },
] as const;
export type TrackerRecencyFilter = (typeof TRACKER_RECENCY_OPTIONS)[number]["value"];

export const TRACKER_RECENCY_DAYS: Record<string, number> = {
  "1d": 1,
  "3d": 3,
  "7d": 7,
  "30d": 30,
};

export const TRACKER_SORT_COLUMNS = ["job", "updated"] as const;
export type TrackerSortColumn = (typeof TRACKER_SORT_COLUMNS)[number];

export const TRACKER_PAGE_SIZE = 20;

export interface TrackerFilters {
  status: TrackerStatusFilter;
  recency: TrackerRecencyFilter;
  q: string;
  sort: TrackerSortColumn;
  dir: "asc" | "desc";
  page: number;
}

export const DEFAULT_TRACKER_FILTERS: TrackerFilters = {
  status: "ALL",
  recency: "any",
  q: "",
  sort: "updated",
  dir: "desc",
  page: 1,
};

type RawSearchParams = Record<string, string | string[] | undefined>;

function first(sp: RawSearchParams, key: string): string | undefined {
  const v = sp[key];
  return Array.isArray(v) ? v[0] : v;
}

export function parseTrackerFilters(sp: RawSearchParams): TrackerFilters {
  const status = first(sp, "status");
  const recency = first(sp, "recency");
  const sort = first(sp, "sort");
  const dir = first(sp, "dir");
  const page = parseInt(first(sp, "page") ?? "1", 10);

  return {
    status: (TRACKER_STATUSES as readonly string[]).includes(status ?? "")
      ? (status as TrackerStatusFilter)
      : DEFAULT_TRACKER_FILTERS.status,
    recency: TRACKER_RECENCY_OPTIONS.some((o) => o.value === recency)
      ? (recency as TrackerRecencyFilter)
      : DEFAULT_TRACKER_FILTERS.recency,
    q: (first(sp, "q") ?? "").trim().slice(0, 200),
    sort: (TRACKER_SORT_COLUMNS as readonly string[]).includes(sort ?? "")
      ? (sort as TrackerSortColumn)
      : DEFAULT_TRACKER_FILTERS.sort,
    dir: dir === "asc" ? "asc" : DEFAULT_TRACKER_FILTERS.dir,
    page: Number.isFinite(page) && page > 0 ? page : DEFAULT_TRACKER_FILTERS.page,
  };
}

const FILTER_PARAM_KEYS: Record<keyof TrackerFilters, string> = {
  status: "status",
  recency: "recency",
  q: "q",
  sort: "sort",
  dir: "dir",
  page: "page",
};

/** Serializes only the filters that differ from defaults, for clean/shareable URLs. */
export function buildTrackerQueryString(filters: TrackerFilters): string {
  const params = new URLSearchParams();
  (Object.keys(DEFAULT_TRACKER_FILTERS) as (keyof TrackerFilters)[]).forEach(
    (key) => {
      const value = filters[key];
      if (value === DEFAULT_TRACKER_FILTERS[key]) return;
      params.set(FILTER_PARAM_KEYS[key], String(value));
    },
  );
  return params.toString();
}
