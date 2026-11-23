import mongoose, { Schema, type InferSchemaType } from "mongoose";

const templateSchema = new Schema(
  {
    title: { type: String },
    body: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export type TemplateDocument = InferSchemaType<typeof templateSchema>;
export const Template =
  mongoose.models.Template || mongoose.model("Template", templateSchema);
