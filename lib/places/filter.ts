import type { Filters, GooglePlace } from "./types";

export function passes(place: GooglePlace, filters: Filters): boolean {
  if (place.businessStatus !== "OPERATIONAL") {
    return false;
  }

  if (
    filters.minRating !== undefined &&
    (place.rating === undefined || place.rating < filters.minRating)
  ) {
    return false;
  }

  if (
    filters.maxRating !== undefined &&
    (place.rating === undefined || place.rating > filters.maxRating)
  ) {
    return false;
  }

  if (
    filters.minReviews !== undefined &&
    (place.userRatingCount ?? 0) < filters.minReviews
  ) {
    return false;
  }

  if (filters.requirePhone && !place.nationalPhoneNumber?.trim()) {
    return false;
  }

  if (filters.requireWebsite && !place.websiteUri?.trim()) {
    return false;
  }

  const searchableText = `${place.displayName?.text ?? ""} ${place.formattedAddress ?? ""}`.toLowerCase();
  const includeKeywords = filters.includeKeywords ?? [];
  const excludeKeywords = filters.excludeKeywords ?? [];

  if (
    includeKeywords.length > 0 &&
    !includeKeywords.some((keyword) => searchableText.includes(keyword.toLowerCase()))
  ) {
    return false;
  }

  if (excludeKeywords.some((keyword) => searchableText.includes(keyword.toLowerCase()))) {
    return false;
  }

  return true;
}
