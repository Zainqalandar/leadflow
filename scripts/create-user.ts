import { loadEnvConfig } from "@next/env";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/lib/models";
import mongoose from "mongoose";

loadEnvConfig(process.cwd());

const argumentsSchema = z.object({
  email: z.string().trim().email().transform((email) => email.toLowerCase()),
  password: z.string().min(1),
});

async function createUser() {
  const parsed = argumentsSchema.safeParse({
    email: process.argv[2],
    password: process.argv[3],
  });

  if (!parsed.success || process.argv.length !== 4) {
    console.error('Usage: npx tsx scripts/create-user.ts you@mail.com "password"');
    process.exitCode = 1;
    return;
  }

  try {
    await connectToDatabase();
    const passwordHash = await bcrypt.hash(parsed.data.password, 12);

    await User.findOneAndUpdate(
      { email: parsed.data.email },
      { $set: { passwordHash } },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
    );

    console.log(`User upserted: ${parsed.data.email}`);
  } catch {
    console.error("Unable to upsert user. Check the database configuration and access.");
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

void createUser();
