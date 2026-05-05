import type { BroadbandFacts, LeadIntelDraft, PropertyFacts, SourceRecord } from "../../shared/leadIntel";
import type { LeadIntelEnv } from "../types";
import { buildSourceRecord, fetchJsonWithTimeout, firstArray, firstObject, normalizeText, toBoolean, toNumber } from "./utils";

function buildPolygon(lat: number, lng: number, delta = 0.01): string {
  const points = [
    `${lng - delta} ${lat + delta}`,
    `${lng + delta} ${lat + delta}`,
    `${lng + delta} ${lat - delta}`,
    `${lng - delta} ${lat - delta}`,
    `${lng - delta} ${lat + delta}`,
  ];

  return points.join(", ");
}

function parseListing(record: Record<string, unknown> | null, currentProperty: PropertyFacts): { property: PropertyFacts; broadband: BroadbandFacts } {
  if (!record) {
    return {
      property: {
        propertyType: currentProperty.propertyType,
        yearBuilt: currentProperty.yearBuilt,
        beds: currentProperty.beds,
        baths: currentProperty.baths,
        squareFeet: currentProperty.squareFeet,
        estimatedValue: currentProperty.estimatedValue,
        estimatedRent: currentProperty.estimatedRent,
      },
      broadband: {
        spectrumServiceable: null,
        gigAvailable: null,
        knownUpgradeArea: null,
        fccProviderSummary: [],
        notes: null,
      },
    };
  }

  const propertyType = normalizeText(record.propertyType ?? record.homeType ?? record.listingType ?? record.home_type);
  const beds = toNumber(record.beds ?? record.bedrooms);
  const baths = toNumber(record.baths ?? record.bathrooms);
  const squareFeet = toNumber(record.squareFeet ?? record.square_feet ?? record.livingArea);
  const price = toNumber(record.price ?? record.listPrice ?? record.listing_price);
  const status = normalizeText(record.homeStatus ?? record.home_status ?? record.status);

  return {
    property: {
      propertyType: propertyType ?? currentProperty.propertyType ?? null,
      yearBuilt: currentProperty.yearBuilt,
      beds: beds ?? currentProperty.beds ?? null,
      baths: baths ?? currentProperty.baths ?? null,
      squareFeet: squareFeet ?? currentProperty.squareFeet ?? null,
      estimatedValue: price ?? currentProperty.estimatedValue ?? null,
      estimatedRent: currentProperty.estimatedRent,
    },
    broadband: {
      spectrumServiceable: null,
      gigAvailable: null,
      knownUpgradeArea: Boolean(status && /for_sale|active|pending/i.test(status)),
      fccProviderSummary: [],
      notes: status ? `Nearby listing activity: ${status}` : null,
    },
  };
}

export async function lookupRapidApiRealEstate(
  draft: LeadIntelDraft,
  env: LeadIntelEnv,
): Promise<{ patch: Partial<LeadIntelDraft>; source: SourceRecord }> {
  const startedAt = Date.now();
  if (!env.rapidApiKey) {
    return {
      patch: {},
      source: buildSourceRecord("real-time-real-estate-data", "skipped", 0, [], "RAPIDAPI_KEY is not configured"),
    };
  }

  if (draft.normalizedAddress.lat == null || draft.normalizedAddress.lng == null) {
    return {
      patch: {},
      source: buildSourceRecord(
        "real-time-real-estate-data",
        "skipped",
        0,
        [],
        "No latitude/longitude available for polygon lookup",
      ),
    };
  }

  try {
    const url = new URL(`https://${env.rapidApiRealEstateHost}/search-polygon`);
    url.searchParams.set("polygon", buildPolygon(draft.normalizedAddress.lat, draft.normalizedAddress.lng));
    url.searchParams.set("home_status", "FOR_SALE");
    url.searchParams.set("sort", "DEFAULT");
    url.searchParams.set("listing_type", "BY_AGENT");

    const response = await fetchJsonWithTimeout(
      url,
      {
        method: "GET",
        headers: {
          "x-rapidapi-key": env.rapidApiKey,
          "x-rapidapi-host": env.rapidApiRealEstateHost,
        },
      },
      { retries: 1, timeoutMs: 10000 },
    );

    const first = firstObject<Record<string, unknown>>(firstArray(response.data));
    const parsed = parseListing(first, draft.property);

    const fieldsReturned = [
      ...(parsed.property.propertyType ? ["property.propertyType"] : []),
      ...(parsed.property.estimatedValue ? ["property.estimatedValue"] : []),
      ...(parsed.broadband.knownUpgradeArea ? ["broadband.knownUpgradeArea"] : []),
      ...(parsed.broadband.notes ? ["broadband.notes"] : []),
    ];

    return {
      patch: parsed,
      source: buildSourceRecord("real-time-real-estate-data", "success", Date.now() - startedAt, fieldsReturned),
    };
  } catch (error) {
    return {
      patch: {},
      source: buildSourceRecord(
        "real-time-real-estate-data",
        "error",
        Date.now() - startedAt,
        [],
        error instanceof Error ? error.message : String(error),
      ),
    };
  }
}
