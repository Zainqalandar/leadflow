import { NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db";
import { Activity, Lead } from "@/lib/models";

export const runtime = "nodejs";

const idSchema = z.string().regex(/^[a-f\d]{24}$/i);
const activitySchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("note"),
    body: z.string().trim().min(1).max(2000),
  }).strict(),
  z.object({
    type: z.literal("message_sent"),
    body: z.string().trim().min(1).max(5000),
  }).strict(),
]);

export async function POST(
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

  const parsedBody = activitySchema.safeParse(body);
  if (!parsedBody.success) {
    return NextResponse.json({ ok: false, error: "Invalid note." }, { status: 400 });
  }

  try {
    await connectToDatabase();
    const lead = await Lead.findById(parsedId.data).select("stage");
    if (!lead) {
      return NextResponse.json({ ok: false, error: "Lead not found." }, { status: 404 });
    }

    if (parsedBody.data.type === "message_sent") {
      const now = new Date();
      const stageChanged = lead.stage === "new";
      await Lead.findByIdAndUpdate(
        parsedId.data,
        {
          $set: {
            lastContactedAt: now,
            ...(stageChanged ? { stage: "contacted" } : {}),
          },
        },
        { runValidators: true },
      );
      if (stageChanged) {
        await Activity.create({
          leadId: lead._id,
          type: "stage_change",
          body: "Stage changed from new to contacted after opening WhatsApp.",
        });
      }
    }

    const activity = await Activity.create({
      leadId: parsedId.data,
      type: parsedBody.data.type,
      body: parsedBody.data.body,
    });

    return NextResponse.json({
      ok: true,
      data: {
        activity: {
          id: activity._id.toString(),
          type: activity.type,
          body: activity.body,
          createdAt: activity.createdAt,
        },
      },
    });
  } catch {
    return NextResponse.json({ ok: false, error: "Unable to add note." }, { status: 500 });
  }
}
