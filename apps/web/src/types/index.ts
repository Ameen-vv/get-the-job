export * from "./database";

export type ImportJobInput = {
  external_id: string;
  title: string;
  company: string;
  location?: string;
  url?: string;
  source: string;
  posted_at?: string;
};

export type ImportSummary = {
  total: number;
  inserted: number;
  skipped: number;
  errors: number;
};

export type DashboardStats = {
  total: number;
  newJobs: number;
  saved: number;
  applied: number;
  interviews: number;
  offers: number;
};
