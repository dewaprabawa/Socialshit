import { NextRequest, NextResponse } from "next/server";
import { generateContentIdeas, type Platform } from "@/lib/ai";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  if (!body.topic || typeof body.topic !== "string") {
    return NextResponse.json({ error: "topic is required" }, { status: 400 });
  }
  const platform: Platform =
    body.platform === "facebook" ? "facebook" : "instagram";
  const result = await generateContentIdeas(
    body.topic,
    platform,
    Math.min(Math.max(Number(body.count) || 5, 1), 10)
  );
  return NextResponse.json(result);
}
