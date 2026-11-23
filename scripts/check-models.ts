import { randomUUID } from "node:crypto";
import { loadEnvConfig } from "@next/env";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db";
import { Lead } from "@/lib/models";

loadEnvConfig(process.cwd());

async function checkModels() {
  const placeId = `model-check-${randomUUID()}`;
  let connected = false;

  try {
    await connectToDatabase();
    connected = true;

    const created = await Lead.create({
      placeId,
      name: "LeadFlow model check",
      type: "other",
    });
    const found = await Lead.findById(created._id).lean();

    if (!found) {
      throw new Error("Created lead could not be read back");
    }

    const deleted = await Lead.findByIdAndDelete(created._id).lean();
    if (!deleted) {
      throw new Error("Created lead could not be deleted");
    }

    console.log(
      JSON.stringify(
        { ok: true, created: true, readBack: true, deleted: true },
        null,
        2,
      ),
    );
  } catch {
    console.error(
      "Model check failed. Verify MONGODB_URI and database access.",
    );
    process.exitCode = 1;
  } finally {
    if (connected) {
      try {
        await Lead.deleteOne({ placeId });
        await mongoose.disconnect();
      } catch {
        console.error("Model check cleanup failed.");
        process.exitCode = 1;
      }
    }
  }
}

void checkModels();
