import { NextResponse } from "next/server";
import { env } from "@/lib/env";

export async function POST() {
  const response = NextResponse.json({
    ok: true,
    data: { loggedOut: true },
  });

  response.cookies.set("session", "", {
    httpOnly: true,
    sameSite: "lax",
    secure: env.isProduction,
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  });

  return response;
}
