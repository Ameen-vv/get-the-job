import { z } from "zod";

export const preferencesSchema = z.object({
  skills: z.array(z.string().min(1)).default([]),
  preferred_locations: z.array(z.string().min(1)).default([]),
  preferred_keywords: z.array(z.string().min(1)).default([]),
  remote_only: z.boolean().default(false),
});

export type PreferencesInput = z.infer<typeof preferencesSchema>;
