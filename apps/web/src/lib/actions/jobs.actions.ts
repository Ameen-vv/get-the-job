"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { JobStatus, UserJob } from "@/types";

interface UpdateJobStatusInput {
  jobId: string;
  userId: string;
  status: JobStatus;
}

interface UpdateJobNotesInput {
  jobId: string;
  userId: string;
  notes: string;
}

export async function updateJobStatus({
  jobId,
  userId,
  status,
}: UpdateJobStatusInput): Promise<{ success: boolean; userJob?: UserJob }> {
  const supabase = await createClient();

  // Use upsert on the composite unique key (user_id, job_id)
  const { data, error } = await supabase
    .from("user_jobs")
    .upsert(
      { user_id: userId, job_id: jobId, status },
      { onConflict: "user_id,job_id" }
    )
    .select()
    .single();

  if (error) {
    console.error("updateJobStatus error:", error);
    return { success: false };
  }

  revalidatePath("/dashboard");
  revalidatePath("/jobs");
  revalidatePath("/tracker");

  return { success: true, userJob: data as UserJob };
}

export async function updateJobNotes({
  jobId,
  userId,
  notes,
}: UpdateJobNotesInput): Promise<{ success: boolean }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("user_jobs")
    .upsert(
      { user_id: userId, job_id: jobId, notes, status: "SAVED" as JobStatus },
      { onConflict: "user_id,job_id", ignoreDuplicates: false }
    );

  if (error) {
    console.error("updateJobNotes error:", error);
    return { success: false };
  }

  revalidatePath("/tracker");

  return { success: true };
}

export async function bulkUpdateJobStatus(
  userJobIds: string[],
  status: JobStatus
): Promise<{ success: boolean }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("user_jobs")
    .update({ status })
    .in("id", userJobIds);

  if (error) {
    console.error("bulkUpdateJobStatus error:", error);
    return { success: false };
  }

  revalidatePath("/dashboard");
  revalidatePath("/tracker");

  return { success: true };
}
