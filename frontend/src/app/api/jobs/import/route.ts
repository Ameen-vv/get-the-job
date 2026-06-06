import { NextResponse } from "next/server";
import { upsertJobs } from "@/lib/services/jobs.service";
import { importJobsSchema } from "@/lib/validations/jobs";

export async function POST(request: Request) {
  const apiKey = request.headers.get("x-api-key");

  if (!apiKey || apiKey !== process.env.COLLECTOR_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = importJobsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  try {
    const summary = await upsertJobs(parsed.data);
    return NextResponse.json({ success: true, summary }, { status: 200 });
  } catch (err) {
    console.error("Job import error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
