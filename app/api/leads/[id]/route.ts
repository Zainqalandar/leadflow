import { NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db";
import { Activity, Lead } from "@/lib/models";

export const runtime = "nodejs";

const idSchema = z.string().regex(/^[a-f\d]{24}$/i);
const patchSchema = z
  .object({
    stage: z.enum([
      "new",
      "contacted",
      "replied",
      "meeting",
      "proposal_sent",
      "won",
      "lost",
    ]).optional(),
    ownerName: z.string().trim().max(120).optional(),
    notes: z.string().trim().max(5000).optional(),
    nextFollowUpAt: z.string().datetime({ offset: true }).nullable().optional(),
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
    return NextResponse.json({ ok: false, error: "Invalid lead ID." }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Request body must be valid JSON." }, { status: 400 });
  }

  const parsedBody = patchSchema.safeParse(body);
  if (!parsedBody.success) {
    return NextResponse.json({ ok: false, error: "Invalid lead update." }, { status: 400 });
  }

  try {
    await connectToDatabase();
    const currentLead = await Lead.findById(parsedId.data).select("stage");
    if (!currentLead) {
      return NextResponse.json({ ok: false, error: "Lead not found." }, { status: 404 });
    }

    const updates: Record<string, unknown> = { ...parsedBody.data };
    if (parsedBody.data.nextFollowUpAt !== undefined) {
      updates.nextFollowUpAt = parsedBody.data.nextFollowUpAt
        ? new Date(parsedBody.data.nextFollowUpAt)
        : null;
    }

    const updatedLead = await Lead.findByIdAndUpdate(
      parsedId.data,
      { $set: updates },
      { new: true, runValidators: true },
    ).select("_id stage ownerName notes nextFollowUpAt");

    if (!updatedLead) {
      return NextResponse.json({ ok: false, error: "Lead not found." }, { status: 404 });
    }

    if (parsedBody.data.stage && parsedBody.data.stage !== currentLead.stage) {
      await Activity.create({
        leadId: updatedLead._id,
        type: "stage_change",
        body: `Stage changed from ${currentLead.stage.replaceAll("_", " ")} to ${parsedBody.data.stage.replaceAll("_", " ")}.`,
      });
    }

    return NextResponse.json({ ok: true, data: { lead: updatedLead } });
  } catch {
    return NextResponse.json({ ok: false, error: "Unable to update lead." }, { status: 500 });
  }
}
