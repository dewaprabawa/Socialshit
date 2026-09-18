import { NextRequest, NextResponse } from "next/server";
import { clearSessionCookie, destroySession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  await destroySession(req);
  const res = NextResponse.json({ ok: true });
  clearSessionCookie(res);
  return res;
}

export async function GET(req: NextRequest) {
  await destroySession(req);
  const res = NextResponse.redirect(new URL("/login", req.url));
  clearSessionCookie(res);
  return res;
}
