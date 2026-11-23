import { NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db";
import { Template } from "@/lib/models";

export const runtime = "nodejs";

const idSchema = z.string().regex(/^[a-f\d]{24}$/i);
const patchSchema = z
  .object({
    title: z.string().trim().min(1).max(120).optional(),
    body: z.string().trim().min(1).max(5000).optional(),
    isActive: z.boolean().optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required.",
  });

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  const parsedId = idSchema.safeParse(params.id);
  if (!parsedId.success) {
    return NextResponse.json({ ok: false, error: "Invalid template ID." }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Request body must be valid JSON." }, { status: 400 });
  }

  const parsedBody = patchSchema.safeParse(body);
  if (!parsedBody.success) {
    return NextResponse.json({ ok: false, error: "Invalid template update." }, { status: 400 });
  }

  try {
    await connectToDatabase();
    const template = await Template.findByIdAndUpdate(
      parsedId.data,
      { $set: parsedBody.data },
      { new: true, runValidators: true },
    );
    if (!template) {
      return NextResponse.json({ ok: false, error: "Template not found." }, { status: 404 });
    }
    return NextResponse.json({
      ok: true,
      data: {
        template: {
          id: template._id.toString(),
          title: template.title ?? "",
          body: template.body ?? "",
          isActive: template.isActive ?? true,
        },
      },
    });
  } catch {
    return NextResponse.json({ ok: false, error: "Unable to update template." }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const parsedId = idSchema.safeParse(params.id);
  if (!parsedId.success) {
    return NextResponse.json({ ok: false, error: "Invalid template ID." }, { status: 400 });
  }

  try {
    await connectToDatabase();
    const deleted = await Template.findByIdAndDelete(parsedId.data);
    if (!deleted) {
      return NextResponse.json({ ok: false, error: "Template not found." }, { status: 404 });
    }
    return NextResponse.json({ ok: true, data: { deleted: true } });
  } catch {
    return NextResponse.json({ ok: false, error: "Unable to delete template." }, { status: 500 });
  }
}
