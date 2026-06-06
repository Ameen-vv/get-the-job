import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Header } from "@/components/shared/header";
import { PreferencesForm } from "@/components/features/preferences/preferences-form";
import type { Preferences } from "@/types";

export default async function PreferencesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: raw } = await supabase
    .from("preferences")
    .select("*")
    .eq("user_id", user.id)
    .single();

  const preferences: Preferences | null = raw
    ? {
        ...raw,
        skills: Array.isArray(raw.skills) ? (raw.skills as string[]) : [],
        preferred_locations: Array.isArray(raw.preferred_locations)
          ? (raw.preferred_locations as string[])
          : [],
        preferred_keywords: Array.isArray(raw.preferred_keywords)
          ? (raw.preferred_keywords as string[])
          : [],
        top_companies: Array.isArray(raw.top_companies)
          ? (raw.top_companies as string[])
          : [],
        excluded_keywords: Array.isArray(raw.excluded_keywords)
          ? (raw.excluded_keywords as string[])
          : [],
        min_score: typeof raw.min_score === "number" ? raw.min_score : 4,
        max_job_age_hours: typeof raw.max_job_age_hours === "number" ? raw.max_job_age_hours : 72,
      }
    : null;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header
        title="Preferences"
        description="Configure your job search preferences"
      />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto">
          <PreferencesForm userId={user.id} preferences={preferences} />
        </div>
      </div>
    </div>
  );
}
