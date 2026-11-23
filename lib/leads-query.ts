import { z } from "zod";

const stages = [
  "new",
  "contacted",
  "replied",
  "meeting",
  "proposal_sent",
  "won",
  "lost",
] as const;
const leadTypes = ["restaurant", "cafe", "bakery", "other"] as const;

export const leadListQuerySchema = z.object({
  stage: z.enum(stages).optional(),
  type: z.enum(leadTypes).optional(),
  area: z.string().trim().max(100).optional(),
  minRating: z.enum(["1", "2", "3", "4", "5"]).optional(),
  hasPhone: z.enum(["true"]).optional(),
  q: z.string().trim().max(120).optional(),
  page: z.coerce.number().int().min(1).default(1),
});

export type LeadListFilters = z.infer<typeof leadListQuerySchema>;
export type LeadListSearchParams = Record<string, string | string[] | undefined>;

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function buildLeadMongoQuery(filters: LeadListFilters) {
  const query: Record<string, unknown> = {};
  if (filters.stage) query.stage = filters.stage;
  if (filters.type) query.type = filters.type;
  if (filters.area) query.area = { $regex: escapeRegex(filters.area), $options: "i" };
  if (filters.minRating) query.rating = { $gte: Number(filters.minRating) };
  if (filters.hasPhone) query.phone = { $exists: true, $nin: ["", null] };
  if (filters.q) {
    const searchPattern = { $regex: escapeRegex(filters.q), $options: "i" };
    query.$or = [{ name: searchPattern }, { address: searchPattern }];
  }
  return query;
}

export function filtersToSearchParams(filters: LeadListFilters) {
  const params = new URLSearchParams();
  if (filters.stage) params.set("stage", filters.stage);
  if (filters.type) params.set("type", filters.type);
  if (filters.area) params.set("area", filters.area);
  if (filters.minRating) params.set("minRating", filters.minRating);
  if (filters.hasPhone) params.set("hasPhone", filters.hasPhone);
  if (filters.q) params.set("q", filters.q);
  return params;
}
