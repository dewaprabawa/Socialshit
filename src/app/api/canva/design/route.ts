import { NextRequest, NextResponse } from "next/server";
import { generatePostDesign } from "@/lib/canva";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const caption =
    typeof body.caption === "string" && body.caption.trim()
      ? body.caption
      : typeof body.topic === "string"
      ? body.topic
      : "";
  if (!caption.trim()) {
    return NextResponse.json(
      { error: "Provide a caption or topic to design." },
      { status: 400 }
    );
  }
  try {
    const result = await generatePostDesign({
      caption,
      imageUrl: typeof body.imageUrl === "string" ? body.imageUrl : null,
    });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Canva design failed" },
      { status: 502 }
    );
  }
}
