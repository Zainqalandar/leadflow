import { NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db";
import { Template } from "@/lib/models";

export const runtime = "nodejs";

const templateSchema = z
  .object({
    title: z.string().trim().min(1).max(120),
    body: z.string().trim().min(1).max(5000),
    isActive: z.boolean().default(true),
  })
  .strict();

function serializeTemplate(template: {
  _id: { toString(): string };
  title?: string;
  body?: string;
  isActive?: boolean;
}) {
  return {
    id: template._id.toString(),
    title: template.title ?? "",
    body: template.body ?? "",
    isActive: template.isActive ?? true,
  };
}

export async function GET() {
  try {
    await connectToDatabase();
    const templates = await Template.find().sort({ updatedAt: -1, _id: -1 }).lean();
    return NextResponse.json({
      ok: true,
      data: { templates: templates.map(serializeTemplate) },
    });
  } catch {
    return NextResponse.json({ ok: false, error: "Unable to load templates." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Request body must be valid JSON." }, { status: 400 });
  }

  const parsed = templateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid template." }, { status: 400 });
  }

  try {
    await connectToDatabase();
    const template = await Template.create(parsed.data);
    return NextResponse.json(
      { ok: true, data: { template: serializeTemplate(template) } },
      { status: 201 },
    );
  } catch {
    return NextResponse.json({ ok: false, error: "Unable to create template." }, { status: 500 });
  }
}
