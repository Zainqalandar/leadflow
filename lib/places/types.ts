import { z } from "zod";

export const placeTypeSchema = z.enum(["restaurant", "cafe", "bakery"]);
export type PlaceType = z.infer<typeof placeTypeSchema>;

export const priceLevelSchema = z.enum([
  "PRICE_LEVEL_INEXPENSIVE",
  "PRICE_LEVEL_MODERATE",
  "PRICE_LEVEL_EXPENSIVE",
  "PRICE_LEVEL_VERY_EXPENSIVE",
]);
export type SearchPriceLevel = z.infer<typeof priceLevelSchema>;

export const areaSchema = z.object({
  name: z.string().trim().min(1),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  radiusM: z.number().min(100).max(50_000),
});
export type SearchArea = z.infer<typeof areaSchema>;

export const filtersSchema = z
  .object({
    areas: z.array(areaSchema).max(20),
    types: z.array(placeTypeSchema),
    openNow: z.boolean().optional(),
    priceLevels: z.array(priceLevelSchema).optional(),
    minRating: z.number().min(0).max(5).optional(),
    maxRating: z.number().min(0).max(5).optional(),
    minReviews: z.number().int().nonnegative().optional(),
    requirePhone: z.boolean().optional(),
    requireWebsite: z.boolean().optional(),
    includeKeywords: z.array(z.string().trim().min(1)).default([]),
    excludeKeywords: z.array(z.string().trim().min(1)).default([]),
    maxPagesPerQuery: z.number().int().min(1).max(3).default(3),
  })
  .superRefine((filters, context) => {
    if (
      filters.minRating !== undefined &&
      filters.maxRating !== undefined &&
      filters.minRating > filters.maxRating
    ) {
      context.addIssue({
        code: "custom",
        message: "minRating must be less than or equal to maxRating",
        path: ["maxRating"],
      });
    }
  });

export type Filters = z.infer<typeof filtersSchema>;
export type FiltersInput = z.input<typeof filtersSchema>;

export type GooglePlace = {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  location?: { latitude?: number; longitude?: number };
  types?: string[];
  businessStatus?: string;
  nationalPhoneNumber?: string;
  websiteUri?: string;
  rating?: number;
  userRatingCount?: number;
  priceLevel?: string;
  googleMapsUri?: string;
};

export type SearchPageResponse = {
  places?: GooglePlace[];
  nextPageToken?: string;
};
