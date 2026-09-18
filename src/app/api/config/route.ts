import { NextResponse } from "next/server";
import { aiConfigured } from "@/lib/ai";
import { metaConfigured } from "@/lib/meta";
import { canvaConfigured, canvaConnected } from "@/lib/canva";

export const dynamic = "force-dynamic";

export async function GET() {
  let connected = false;
  try {
    connected = await canvaConnected();
  } catch {
    connected = false;
  }
  return NextResponse.json({
    ai: aiConfigured(),
    meta: metaConfigured(),
    canva: {
      configured: canvaConfigured(),
      connected,
    },
  });
}
