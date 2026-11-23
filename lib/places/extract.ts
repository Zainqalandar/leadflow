import { searchPage } from "./client";
import { passes } from "./filter";
import { normalize, toWhatsAppNumber, type NormalizedLead } from "./normalize";
import { filtersSchema, type FiltersInput } from "./types";

const wait = (milliseconds: number) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

export async function extractLeads(input: FiltersInput): Promise<NormalizedLead[]> {
  const filters = filtersSchema.parse(input);
  const leadsByPlaceId = new Map<string, NormalizedLead>();

  for (const area of filters.areas) {
    for (const type of filters.types) {
      let pageToken: string | undefined;

      for (let page = 0; page < filters.maxPagesPerQuery; page += 1) {
        const result = await searchPage({ area, type, filters, pageToken });

        for (const place of result.places ?? []) {
          if (!passes(place, filters)) {
            continue;
          }

          const lead = normalize(place, area.name, type);
          if (lead && !leadsByPlaceId.has(lead.placeId)) {
            leadsByPlaceId.set(lead.placeId, lead);
          }
        }

        if (!result.nextPageToken || page + 1 >= filters.maxPagesPerQuery) {
          break;
        }

        pageToken = result.nextPageToken;
        await wait(2_000);
      }
    }
  }

  const leadsByPhone = new Set<string>();
  const uniqueLeads: NormalizedLead[] = [];

  leadsByPlaceId.forEach((lead) => {
    if (lead.phone) {
      const canonicalMobile = toWhatsAppNumber(lead.phone);
      const phoneDigits = (canonicalMobile ?? lead.phone).replace(/\D/g, "");
      if (phoneDigits && leadsByPhone.has(phoneDigits)) {
        return;
      }
      if (phoneDigits) {
        leadsByPhone.add(phoneDigits);
      }
    }

    uniqueLeads.push(lead);
  });

  return uniqueLeads;
}
