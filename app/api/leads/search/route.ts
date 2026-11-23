import { NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db";
import { Lead, Search } from "@/lib/models";
import { extractLeads } from "@/lib/places/extract";
import { filtersSchema } from "@/lib/places/types";

export const runtime = "nodejs";

const requestMetadataSchema = z
  .object({
    name: z.string().trim().min(1).optional(),
  })
  .passthrough();

const scrapedFields = [
  "name",
  "type",
  "area",
  "address",
  "phone",
  "whatsapp",
  "website",
  "rating",
  "reviews",
  "priceLevel",
  "lat",
  "lng",
  "mapsUrl",
] as const;

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  const metadataResult = requestMetadataSchema.safeParse(body);
  const filtersResult = filtersSchema.safeParse(body);

  if (!metadataResult.success || !filtersResult.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid search filters." },
      { status: 400 },
    );
  }

  const filters = filtersResult.data;
  if (filters.areas.length * filters.types.length > 10) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "This request contains more than 10 area/type queries. Split the request into smaller searches.",
      },
      { status: 400 },
    );
  }

  try {
    const leads = await extractLeads(filters);
    await connectToDatabase();

    const now = new Date();
    const operations = leads.map((lead) => {
      const fields: Record<string, unknown> = {};
      for (const field of scrapedFields) {
        const value = lead[field];
        if (value !== undefined) fields[field] = value;
      }

      return {
        updateOne: {
          filter: { placeId: lead.placeId },
          update: {
            $set: fields,
            $setOnInsert: { stage: "new", placesFetchedAt: now },
          },
          upsert: true,
        },
      };
    });

    const writeResult = operations.length
      ? await Lead.bulkWrite(operations, { ordered: false })
      : null;

    await Search.create({
      ...(metadataResult.data.name ? { name: metadataResult.data.name } : {}),
      filters,
    });

    return NextResponse.json({
      ok: true,
      data: {
        found: leads.length,
        inserted: writeResult?.upsertedCount ?? 0,
        updated: writeResult?.modifiedCount ?? 0,
      },
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Unable to search and save leads." },
      { status: 500 },
    );
  }
}
