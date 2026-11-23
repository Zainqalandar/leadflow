import mongoose, { Schema, type InferSchemaType } from "mongoose";

const activitySchema = new Schema(
  {
    leadId: {
      type: Schema.Types.ObjectId,
      ref: "Lead",
      index: true,
    },
    type: {
      type: String,
      enum: ["message_sent", "note", "stage_change", "call", "meeting", "other"],
    },
    body: { type: String },
  },
  { timestamps: true },
);

export type ActivityDocument = InferSchemaType<typeof activitySchema>;
export const Activity =
  mongoose.models.Activity || mongoose.model("Activity", activitySchema);
