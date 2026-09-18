import { NextRequest, NextResponse } from "next/server";
import { generateImage } from "@/lib/ai";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  if (!body.prompt || typeof body.prompt !== "string") {
    return NextResponse.json({ error: "prompt is required" }, { status: 400 });
  }
  const result = await generateImage(body.prompt);
  return NextResponse.json(result);
}
