import { z } from "zod";

export const preferencesSchema = z.object({
  skills: z.array(z.string().min(1)).default([]),
  preferred_locations: z.array(z.string().min(1)).default([]),
  preferred_keywords: z.array(z.string().min(1)).default([]),
  remote_only: z.boolean().default(false),
  top_companies: z.array(z.string().min(1)).default([]),
  excluded_keywords: z.array(z.string().min(1)).default([]),
  min_score: z.number().int().min(1).max(10).default(4),
  max_job_age_hours: z.number().int().positive().default(72),
});

export type PreferencesInput = z.infer<typeof preferencesSchema>;
