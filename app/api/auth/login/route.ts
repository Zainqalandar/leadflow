import bcrypt from "bcryptjs";
import { SignJWT } from "jose/jwt/sign";
import { NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db";
import { env } from "@/lib/env";
import { User } from "@/lib/models";

export const runtime = "nodejs";

const loginSchema = z.object({
  email: z.string().trim().email().transform((email) => email.toLowerCase()),
  password: z.string().min(1),
});

const invalidCredentials = () =>
  NextResponse.json(
    { ok: false, error: "Invalid credentials" },
    { status: 401 },
  );

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return invalidCredentials();
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return invalidCredentials();
  }

  try {
    await connectToDatabase();
    const user = await User.findOne({ email: parsed.data.email });

    if (!user || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
      return invalidCredentials();
    }

    const token = await new SignJWT({})
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(user._id.toString())
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(new TextEncoder().encode(env.JWT_SECRET));

    const response = NextResponse.json({
      ok: true,
      data: { authenticated: true },
    });

    response.cookies.set("session", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: env.isProduction,
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Unable to log in" },
      { status: 500 },
    );
  }
}
