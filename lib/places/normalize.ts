import type { GooglePlace, PlaceType } from "./types";

export type NormalizedLead = {
  placeId: string;
  name?: string;
  type?: PlaceType;
  area?: string;
  address?: string;
  phone?: string;
  whatsapp?: string;
  website?: string;
  rating: number | null;
  reviews: number;
  priceLevel?: number;
  lat?: number;
  lng?: number;
  mapsUrl?: string;
  placesFetchedAt: Date;
};

export function toWhatsAppNumber(phone: string | null | undefined): string | null {
  if (!phone) {
    return null;
  }

  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("00")) {
    digits = digits.slice(2);
  }

  if (/^03\d{9}$/.test(digits)) {
    return `92${digits.slice(1)}`;
  }

  if (/^3\d{9}$/.test(digits)) {
    return `92${digits}`;
  }

  if (/^923\d{9}$/.test(digits)) {
    return digits;
  }

  return null;
}

const priceLevelValues: Record<string, number | undefined> = {
  PRICE_LEVEL_FREE: 0,
  PRICE_LEVEL_INEXPENSIVE: 1,
  PRICE_LEVEL_MODERATE: 2,
  PRICE_LEVEL_EXPENSIVE: 3,
  PRICE_LEVEL_VERY_EXPENSIVE: 4,
};

export function normalize(
  place: GooglePlace,
  areaName?: string,
  type?: PlaceType,
): NormalizedLead | null {
  if (!place.id) {
    return null;
  }

  const lead: NormalizedLead = {
    placeId: place.id,
    rating: place.rating ?? null,
    reviews: place.userRatingCount ?? 0,
    placesFetchedAt: new Date(),
  };

  const placeType =
    type ??
    place.types?.find(
      (candidate): candidate is PlaceType =>
        candidate === "restaurant" ||
        candidate === "cafe" ||
        candidate === "bakery",
    );
  if (placeType) lead.type = placeType;
  if (areaName) lead.area = areaName;
  if (place.displayName?.text) lead.name = place.displayName.text;
  if (place.formattedAddress) lead.address = place.formattedAddress;
  if (place.nationalPhoneNumber) {
    lead.phone = place.nationalPhoneNumber;
    lead.whatsapp = toWhatsAppNumber(place.nationalPhoneNumber) ?? undefined;
  }
  if (place.websiteUri) lead.website = place.websiteUri;
  if (place.location?.latitude !== undefined) lead.lat = place.location.latitude;
  if (place.location?.longitude !== undefined) lead.lng = place.location.longitude;
  if (place.googleMapsUri) lead.mapsUrl = place.googleMapsUri;

  const numericPriceLevel = place.priceLevel
    ? priceLevelValues[place.priceLevel]
    : undefined;
  if (numericPriceLevel !== undefined) lead.priceLevel = numericPriceLevel;

  return lead;
}
