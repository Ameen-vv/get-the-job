import { z } from "zod";

export const importJobSchema = z.object({
  external_id: z.string().min(1),
  title: z.string().min(1),
  company: z.string().min(1),
  location: z.string().optional(),
  url: z.string().url().optional(),
  source: z.string().min(1),
  posted_at: z.string().datetime({ offset: true }).optional(),
});

export const importJobsSchema = z.array(importJobSchema);

export const updateUserJobSchema = z.object({
  status: z.enum([
    "NEW",
    "SAVED",
    "APPLIED",
    "INTERVIEW",
    "REJECTED",
    "OFFER",
    "HIDDEN",
  ]),
  notes: z.string().optional(),
});

export type ImportJobInput = z.infer<typeof importJobSchema>;
export type UpdateUserJobInput = z.infer<typeof updateUserJobSchema>;
