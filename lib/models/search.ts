import mongoose, { Schema, type InferSchemaType } from "mongoose";

const searchSchema = new Schema(
  {
    name: { type: String },
    filters: { type: Schema.Types.Mixed, default: () => ({}) },
  },
  { timestamps: true },
);

export type SearchDocument = InferSchemaType<typeof searchSchema>;
export const Search =
  mongoose.models.Search || mongoose.model("Search", searchSchema);
