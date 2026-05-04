import type { LeadIntelDraft, NormalizedAddress, SourceRecord } from "../../shared/leadIntel";
import type { LeadIntelEnv } from "../types";
import { buildSourceRecord, compactAddressParts, fetchJsonWithTimeout, firstObject, normalizeText, toNumber } from "./utils";

function mapGeocodioConfidence(accuracy: unknown): NormalizedAddress["confidence"] {
  const text = typeof accuracy === "string" ? accuracy.toLowerCase() : "";
  if (["rooftop", "point", "exact"].includes(text)) {
    return "high";
  }
  if (["street", "near", "range"].includes(text)) {
    return "medium";
  }
  return "low";
}

export async function lookupGeocodio(
  inputAddress: string,
  env: LeadIntelEnv,
): Promise<{ patch: Partial<LeadIntelDraft>; source: SourceRecord }> {
  const startedAt = Date.now();
  if (!env.geocodioApiKey) {
    return {
      patch: {},
      source: buildSourceRecord("geocodio", "skipped", 0, [], "GEOCODIO_API_KEY is not configured"),
    };
  }

  try {
    const url = new URL("https://api.geocod.io/v1.12/geocode");
    url.searchParams.set("q", inputAddress);
    url.searchParams.set("api_key", env.geocodioApiKey);

    const { data } = await fetchJsonWithTimeout(url, { method: "GET" }, { retries: 1, timeoutMs: 8000 });
    const first = firstObject<Record<string, unknown>>(Array.isArray(data) ? data : (data as Record<string, unknown>)?.results);
    const components = first && typeof first.address_components === "object" && first.address_components !== null
      ? (first.address_components as Record<string, unknown>)
      : null;
    const location = first && typeof first.location === "object" && first.location !== null
      ? (first.location as Record<string, unknown>)
      : null;

    const line1 = compactAddressParts([
      normalizeText(components?.number),
      normalizeText(components?.predirectional),
      normalizeText(components?.street),
      normalizeText(components?.suffix),
    ]);

    const city = normalizeText(components?.city) ?? normalizeText(components?.locality) ?? "Unknown";
    const state = normalizeText(components?.state) ?? normalizeText(components?.state_abbrev) ?? "Unknown";
    const zip = normalizeText(components?.zip) ?? normalizeText(components?.zip_code) ?? "";
    const county = normalizeText(components?.county) ?? normalizeText(components?.administrative_area_level_2);

    const normalizedAddress: NormalizedAddress = {
      line1: line1 || inputAddress,
      city,
      state,
      zip,
      county,
      lat: toNumber(location?.lat ?? location?.latitude),
      lng: toNumber(location?.lng ?? location?.longitude),
      confidence: mapGeocodioConfidence(first?.accuracy ?? first?.location_type),
    };

    return {
      patch: {
        normalizedAddress,
      },
      source: buildSourceRecord("geocodio", "success", Date.now() - startedAt, ["normalizedAddress", "county", "lat", "lng"]),
    };
  } catch (error) {
    return {
      patch: {},
      source: buildSourceRecord(
        "geocodio",
        "error",
        Date.now() - startedAt,
        [],
        error instanceof Error ? error.message : String(error),
      ),
    };
  }
}
