import { loadEnvConfig } from "@next/env";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db";
import { Lead } from "@/lib/models";

loadEnvConfig(process.cwd());

async function reportStaleLeads() {
  let connected = false;
  try {
    await connectToDatabase();
    connected = true;
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const leads = await Lead.find({ placesFetchedAt: { $lt: cutoff } })
      .select("placeId name area placesFetchedAt")
      .sort({ placesFetchedAt: 1 })
      .lean();

    console.log(`Leads not refreshed in the last 30 days: ${leads.length}`);
    for (const lead of leads) {
      console.log(
        `${lead.name || "Unnamed lead"} | ${lead.area || "Area not set"} | placeId=${lead.placeId} | placesFetchedAt=${lead.placesFetchedAt?.toISOString() ?? "unknown"}`,
      );
    }
  } catch {
    console.error("Lead refresh report failed. Verify MONGODB_URI and database access.");
    process.exitCode = 1;
  } finally {
    if (connected) await mongoose.disconnect();
  }
}

void reportStaleLeads();
