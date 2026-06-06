"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { preferencesSchema, type PreferencesInput } from "@/lib/validations/preferences";

export async function updatePreferences(
  userId: string,
  input: PreferencesInput
): Promise<{ success: boolean; error?: string }> {
  const parsed = preferencesSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.message };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("preferences")
    .upsert(
      {
        user_id: userId,
        skills: parsed.data.skills,
        preferred_locations: parsed.data.preferred_locations,
        preferred_keywords: parsed.data.preferred_keywords,
        remote_only: parsed.data.remote_only,
        top_companies: parsed.data.top_companies,
        excluded_keywords: parsed.data.excluded_keywords,
        min_score: parsed.data.min_score,
        max_job_age_hours: parsed.data.max_job_age_hours,
      },
      { onConflict: "user_id" }
    );

  if (error) {
    console.error("updatePreferences error:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/preferences");

  return { success: true };
}
