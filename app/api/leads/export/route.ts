import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { buildLeadMongoQuery, leadListQuerySchema } from "@/lib/leads-query";
import { Lead } from "@/lib/models";

export const runtime = "nodejs";

const columns = [
  "placeId", "name", "type", "area", "address", "phone", "whatsapp", "website",
  "instagram", "rating", "reviews", "priceLevel", "lat", "lng", "mapsUrl", "stage",
  "ownerName", "notes", "auditScore", "lastContactedAt", "nextFollowUpAt", "placesFetchedAt",
] as const;

function csvCell(value: unknown) {
  if (value === null || value === undefined) return '""';
  const text = value instanceof Date ? value.toISOString() : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

export async function GET(request: Request) {
  const searchParams = Object.fromEntries(new URL(request.url).searchParams.entries());
  const parsedFilters = leadListQuerySchema.safeParse(searchParams);
  if (!parsedFilters.success) {
    return NextResponse.json({ ok: false, error: "Invalid lead filters." }, { status: 400 });
  }

  try {
    await connectToDatabase();
    const cursor = Lead.find(buildLeadMongoQuery(parsedFilters.data) as never)
      .sort({ reviews: -1, _id: -1 })
      .cursor();
    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          controller.enqueue(encoder.encode(`\uFEFF${columns.map(csvCell).join(",")}\r\n`));
          for await (const lead of cursor) {
            const row = columns.map((column) => csvCell(lead.get(column)));
            controller.enqueue(encoder.encode(`${row.join(",")}\r\n`));
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        } finally {
          await cursor.close();
        }
      },
      cancel() {
        void cursor.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="leadflow-leads.csv"',
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json({ ok: false, error: "Unable to export leads." }, { status: 500 });
  }
}
