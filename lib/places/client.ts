import { env } from "@/lib/env";
import type {
  Filters,
  GooglePlace,
  PlaceType,
  SearchArea,
  SearchPageResponse,
} from "./types";

const endpoint = "https://places.googleapis.com/v1/places:searchText";
const fieldMask =
  "places.id,places.displayName,places.formattedAddress,places.location,places.types,places.businessStatus,places.nationalPhoneNumber,places.websiteUri,places.rating,places.userRatingCount,places.priceLevel,places.googleMapsUri,nextPageToken";

type SearchPageOptions = {
  area: SearchArea;
  type: PlaceType;
  filters: Filters;
  pageToken?: string;
};

export async function searchPage({
  area,
  type,
  filters,
  pageToken,
}: SearchPageOptions): Promise<SearchPageResponse> {
  const apiKey = env.GOOGLE_PLACES_KEY;
  if (!apiKey) {
    throw new Error("Missing required environment variable: GOOGLE_PLACES_KEY");
  }

  const body: {
    textQuery: string;
    includedType: string;
    strictTypeFiltering: boolean;
    pageSize: number;
    rankPreference: string;
    locationBias: {
      circle: {
        center: { latitude: number; longitude: number };
        radius: number;
      };
    };
    openNow?: boolean;
    priceLevels?: string[];
    pageToken?: string;
  } = {
    textQuery: type,
    includedType: type,
    strictTypeFiltering: true,
    pageSize: 20,
    rankPreference: "DISTANCE",
    locationBias: {
      circle: {
        center: { latitude: area.lat, longitude: area.lng },
        radius: area.radiusM,
      },
    },
  };

  if (filters.openNow !== undefined) {
    body.openNow = filters.openNow;
  }
  if (filters.priceLevels && filters.priceLevels.length > 0) {
    body.priceLevels = filters.priceLevels;
  }
  if (pageToken) {
    body.pageToken = pageToken;
  }

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": fieldMask,
      },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error("Places API network request failed");
  }

  if (!response.ok) {
    const payload: unknown = await response.json().catch(() => null);
    const message =
      typeof payload === "object" &&
      payload !== null &&
      "error" in payload &&
      typeof payload.error === "object" &&
      payload.error !== null &&
      "message" in payload.error &&
      typeof payload.error.message === "string"
        ? payload.error.message
        : response.statusText || "Unknown error";
    const safeMessage = message.split(apiKey).join("[redacted]");

    throw new Error(
      `Places API request failed (${response.status}): ${safeMessage}`,
    );
  }

  const result: unknown = await response.json();
  if (
    typeof result !== "object" ||
    result === null ||
    !("places" in result) ||
    !Array.isArray(result.places)
  ) {
    return {};
  }

  return {
    places: result.places as GooglePlace[],
    nextPageToken:
      "nextPageToken" in result && typeof result.nextPageToken === "string"
        ? result.nextPageToken
        : undefined,
  };
}
