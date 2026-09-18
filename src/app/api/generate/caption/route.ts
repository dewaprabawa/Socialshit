import { NextRequest, NextResponse } from "next/server";
import { generateCaption, type CaptionRequest } from "@/lib/ai";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as Partial<CaptionRequest>;
  if (!body.topic || typeof body.topic !== "string") {
    return NextResponse.json({ error: "topic is required" }, { status: 400 });
  }
  const platform = body.platform === "facebook" ? "facebook" : "instagram";
  const result = await generateCaption({
    topic: body.topic,
    platform,
    tone: body.tone,
    brand: body.brand,
    audience: body.audience,
    emojis: body.emojis,
    hashtagCount: body.hashtagCount,
  });
  return NextResponse.json(result);
}
