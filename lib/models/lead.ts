import mongoose, { Schema, type InferSchemaType } from "mongoose";

const leadSchema = new Schema(
  {
    placeId: { type: String, required: true, unique: true },
    name: { type: String },
    type: {
      type: String,
      enum: ["restaurant", "cafe", "bakery", "other"],
    },
    area: { type: String },
    address: { type: String },
    phone: { type: String },
    whatsapp: { type: String },
    website: { type: String },
    instagram: { type: String },
    rating: { type: Number, default: null },
    reviews: { type: Number, default: 0 },
    priceLevel: { type: Number },
    lat: { type: Number },
    lng: { type: Number },
    mapsUrl: { type: String },
    stage: {
      type: String,
      enum: [
        "new",
        "contacted",
        "replied",
        "meeting",
        "proposal_sent",
        "won",
        "lost",
      ],
      default: "new",
    },
    ownerName: { type: String },
    notes: { type: String },
    auditScore: { type: Number, default: null },
    lastContactedAt: { type: Date },
    nextFollowUpAt: { type: Date },
    placesFetchedAt: { type: Date },
  },
  { timestamps: true },
);

leadSchema.index({ stage: 1 });
leadSchema.index({ area: 1 });
leadSchema.index({ type: 1 });
leadSchema.index({ rating: 1 });
leadSchema.index({ nextFollowUpAt: 1 });

export type LeadDocument = InferSchemaType<typeof leadSchema>;
export const Lead = mongoose.models.Lead || mongoose.model("Lead", leadSchema);
