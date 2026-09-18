import { NextResponse } from "next/server";
import { processDuePosts } from "@/lib/scheduler";

export const dynamic = "force-dynamic";

// Manual trigger for the scheduler (also runs automatically in-process).
export async function POST() {
  const result = await processDuePosts();
  return NextResponse.json(result);
}

export async function GET() {
  const result = await processDuePosts();
  return NextResponse.json(result);
}
