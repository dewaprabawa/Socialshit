import { NextResponse } from "next/server";
import { aiConfigured } from "@/lib/ai";
import { metaConfigured } from "@/lib/meta";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ai: aiConfigured(),
    meta: metaConfigured(),
  });
}
