import Papa from "papaparse";
import { NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db";
import { Lead } from "@/lib/models";

export const runtime = "nodejs";

const maximumFileSize = 5 * 1024 * 1024;
const maximumRows = 10000;
const fileSchema = z.custom<File>(
  (value) => typeof File !== "undefined" && value instanceof File,
  "Choose a CSV file to import.",
).refine((file) => file.size > 0 && file.size <= maximumFileSize, "CSV must be between 1 byte and 5 MB.");

const leadRowSchema = z.object({
  placeId: z.string().trim().min(1).max(300),
  name: z.string().trim().max(300).optional(),
  type: z.enum(["restaurant", "cafe", "bakery", "other"]).optional(),
  area: z.string().trim().max(200).optional(),
  address: z.string().trim().max(1000).optional(),
  phone: z.string().trim().max(100).optional(),
  whatsapp: z.string().trim().max(100).optional(),
  website: z.string().trim().max(2000).optional(),
  instagram: z.string().trim().max(300).optional(),
  rating: z.coerce.number().min(0).max(5).nullable().optional(),
  reviews: z.coerce.number().int().min(0).optional(),
  priceLevel: z.coerce.number().int().min(0).max(4).optional(),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  mapsUrl: z.string().trim().max(2000).optional(),
  stage: z.enum(["new", "contacted", "replied", "meeting", "proposal_sent", "won", "lost"]).optional(),
  ownerName: z.string().trim().max(120).optional(),
  notes: z.string().trim().max(5000).optional(),
  auditScore: z.coerce.number().min(0).max(10).nullable().optional(),
  lastContactedAt: z.string().datetime({ offset: true }).optional(),
  nextFollowUpAt: z.string().datetime({ offset: true }).optional(),
  placesFetchedAt: z.string().datetime({ offset: true }).optional(),
});

type ValidLeadRow = z.infer<typeof leadRowSchema>;

function phoneDigits(phone: string | undefined) {
  return phone?.replace(/\D/g, "") ?? "";
}

function cleanCsvRow(row: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => {
      if (typeof value !== "string") return [key.trim(), value];
      const cleaned = value.trim();
      return [key.trim(), cleaned || undefined];
    }),
  );
}

function rowToLead(row: ValidLeadRow) {
  const lead: Record<string, unknown> = { ...row, stage: row.stage ?? "new" };
  for (const field of ["lastContactedAt", "nextFollowUpAt", "placesFetchedAt"] as const) {
    if (row[field]) lead[field] = new Date(row[field] as string);
  }
  return lead;
}

export async function POST(request: Request) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "Upload a CSV file using multipart form data." }, { status: 400 });
  }

  const parsedFile = fileSchema.safeParse(formData.get("file"));
  if (!parsedFile.success) {
    return NextResponse.json({ ok: false, error: parsedFile.error.issues[0]?.message ?? "Invalid CSV file." }, { status: 400 });
  }

  const fileText = (await parsedFile.data.text()).replace(/^\uFEFF/, "");
  const parsedCsv = Papa.parse<Record<string, string>>(fileText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.replace(/^\uFEFF/, "").trim(),
  });
  if (parsedCsv.data.length > maximumRows) {
    return NextResponse.json({ ok: false, error: `CSV cannot contain more than ${maximumRows} rows.` }, { status: 400 });
  }

  const errors = parsedCsv.errors.map((error) => `Row ${(error.row ?? 0) + 2}: ${error.message}`);
  let skipped = 0;
  const seenPlaces = new Set<string>();
  const seenPhones = new Set<string>();
  const validRows: { rowNumber: number; lead: ValidLeadRow }[] = [];

  parsedCsv.data.forEach((rawRow, index) => {
    const parsedRow = leadRowSchema.safeParse(cleanCsvRow(rawRow));
    const rowNumber = index + 2;
    if (!parsedRow.success) {
      errors.push(`Row ${rowNumber}: ${parsedRow.error.issues.map((issue) => issue.message).join("; ")}`);
      return;
    }

    const lead = parsedRow.data;
    const digits = phoneDigits(lead.phone);
    if (seenPlaces.has(lead.placeId) || (digits && seenPhones.has(digits))) {
      skipped += 1;
      return;
    }
    seenPlaces.add(lead.placeId);
    if (digits) seenPhones.add(digits);
    validRows.push({ rowNumber, lead });
  });

  try {
    await connectToDatabase();
    const places = Array.from(new Set(validRows.map(({ lead }) => lead.placeId)));
    const existingLeads = places.length
      ? await Lead.find({
          $or: [
            { placeId: { $in: places } },
            { phone: { $exists: true, $nin: ["", null] } },
          ],
        }).select("placeId phone").lean()
      : [];
    const existingPlaces = new Set(existingLeads.map((lead) => lead.placeId));
    const existingPhones = new Set(existingLeads.map((lead) => phoneDigits(lead.phone)).filter(Boolean));
    const candidates = validRows.filter(({ lead }) => {
      const digits = phoneDigits(lead.phone);
      if (existingPlaces.has(lead.placeId) || (digits && existingPhones.has(digits))) {
        skipped += 1;
        return false;
      }
      return true;
    });

    let imported = 0;
    const operations = candidates.map(({ lead }) => ({ insertOne: { document: rowToLead(lead) } }));
    if (operations.length) {
      try {
        const result = await Lead.bulkWrite(operations, { ordered: false });
        imported = result.insertedCount;
      } catch (error) {
        const writeErrors = (error as { writeErrors?: { index: number; code?: number; errmsg?: string }[] }).writeErrors;
        if (!Array.isArray(writeErrors)) {
          throw error;
        }
        imported = candidates.length - writeErrors.length;
        for (const writeError of writeErrors) {
          const rowNumber = candidates[writeError.index]?.rowNumber ?? "?";
          if (writeError.code === 11000) skipped += 1;
          else errors.push(`Row ${rowNumber}: ${writeError.errmsg ?? "Could not save this lead."}`);
        }
      }
    }

    return NextResponse.json({
      ok: true,
      data: { imported, skipped, errors },
    });
  } catch {
    return NextResponse.json({ ok: false, error: "Unable to import leads." }, { status: 500 });
  }
}
