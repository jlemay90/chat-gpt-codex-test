import type { LeadIntelDraft, OwnershipFacts, PropertyFacts, SalesHistoryFacts, SourceRecord } from "../../shared/leadIntel";
import type { LeadIntelEnv } from "../types";
import { buildSourceRecord, fetchJsonWithTimeout, firstArray, firstObject, normalizeText, toBoolean, toNumber } from "./utils";

function parseOwnershipType(ownerName: string | null, ownerTypeRaw: unknown): OwnershipFacts["ownershipType"] {
  const rawType = typeof ownerTypeRaw === "string" ? ownerTypeRaw.toLowerCase() : "";
  if (rawType.includes("trust") || (ownerName?.toUpperCase().includes("TRUST") ?? false)) return "trust";
  if (rawType.includes("llc") || /llc|l\.l\.c\./i.test(ownerName ?? "")) return "llc";
  if (rawType.includes("corp") || /inc|corp|company|co\./i.test(ownerName ?? "")) return "corporate";
  if (rawType.includes("individual") || rawType.includes("person")) return "individual";
  return "unknown";
}

function formatMoney(value: unknown): number | null {
  return toNumber(value);
}

function formatDate(value: unknown): string | null {
  const text = normalizeText(value);
  if (!text) return null;
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10);
}

function yearsSince(dateText: string | null): number | null {
  if (!dateText) return null;
  const date = new Date(dateText);
  if (Number.isNaN(date.getTime())) return null;
  const diff = Date.now() - date.getTime();
  return Math.round((diff / (1000 * 60 * 60 * 24 * 365)) * 10) / 10;
}

export async function lookupRentCast(
  normalizedAddress: LeadIntelDraft["normalizedAddress"],
  env: LeadIntelEnv,
): Promise<{ patch: Partial<LeadIntelDraft>; source: SourceRecord }> {
  const startedAt = Date.now();
  if (!env.rentcastApiKey) {
    return {
      patch: {},
      source: buildSourceRecord("rentcast", "skipped", 0, [], "RENTCAST_API_KEY is not configured"),
    };
  }

  const addressText = [normalizedAddress.line1, normalizedAddress.city, normalizedAddress.state, normalizedAddress.zip]
    .filter(Boolean)
    .join(", ");

  try {
    const propertyUrl = new URL("https://api.rentcast.io/v1/properties");
    propertyUrl.searchParams.set("address", addressText);
    const propertyResponse = await fetchJsonWithTimeout(
      propertyUrl,
      { headers: { "X-Api-Key": env.rentcastApiKey } },
      { retries: 1, timeoutMs: 8000 },
    );
    const propertyRecord = firstObject<Record<string, unknown>>(firstArray(propertyResponse.data));
    const propertyAny = propertyRecord as Record<string, any> | null;

    const valueUrl = new URL("https://api.rentcast.io/v1/avm/value");
    valueUrl.searchParams.set("address", addressText);
    const valueResponse = await fetchJsonWithTimeout(
      valueUrl,
      { headers: { "X-Api-Key": env.rentcastApiKey } },
      { retries: 1, timeoutMs: 8000 },
    );
    const valueRecord = firstObject<Record<string, unknown>>(valueResponse.data);
    const valueAny = valueRecord as Record<string, any> | null;

    const rentUrl = new URL("https://api.rentcast.io/v1/avm/rent/long-term");
    rentUrl.searchParams.set("address", addressText);
    const rentResponse = await fetchJsonWithTimeout(
      rentUrl,
      { headers: { "X-Api-Key": env.rentcastApiKey } },
      { retries: 1, timeoutMs: 8000 },
    );
    const rentRecord = firstObject<Record<string, unknown>>(rentResponse.data);
    const rentAny = rentRecord as Record<string, any> | null;

    const ownerName = normalizeText(propertyAny?.owner?.name ?? propertyAny?.ownerName ?? propertyAny?.currentOwnerName);
    const ownerMailingAddress = normalizeText(
      propertyAny?.owner?.mailingAddress
        ?? propertyAny?.ownerMailingAddress
        ?? propertyAny?.mailingAddress
        ?? propertyAny?.mailing_address,
    );
    const ownershipType = parseOwnershipType(ownerName, propertyAny?.owner?.type ?? propertyAny?.ownershipType ?? propertyAny?.ownerType);
    const mailingAddressMatchesProperty = ownerMailingAddress
      ? ownerMailingAddress.toLowerCase().includes(normalizedAddress.line1.toLowerCase())
      : null;
    const likelyOwnerOccupied = mailingAddressMatchesProperty === true && ownershipType === "individual";
    const likelyRental = ownershipType !== "individual" || mailingAddressMatchesProperty === false;
    const absenteeOwner = mailingAddressMatchesProperty === false;

    const propertyType = normalizeText(propertyAny?.propertyType ?? propertyAny?.homeType ?? propertyAny?.property_type);
    const yearBuilt = toNumber(propertyAny?.yearBuilt ?? propertyAny?.year_built);
    const beds = toNumber(propertyAny?.beds ?? propertyAny?.bedrooms);
    const baths = toNumber(propertyAny?.baths ?? propertyAny?.bathrooms);
    const squareFeet = toNumber(propertyAny?.squareFeet ?? propertyAny?.square_feet ?? propertyAny?.livingArea);
    const estimatedValue = formatMoney(valueAny?.price ?? valueAny?.value ?? valueAny?.estimatedValue);
    const estimatedRent = formatMoney(rentAny?.rent ?? rentAny?.estimatedRent ?? rentAny?.price);

    const lastSaleDate = formatDate(propertyAny?.lastSaleDate ?? propertyAny?.saleDate ?? propertyAny?.last_sold_date);
    const lastSalePrice = formatMoney(propertyAny?.lastSalePrice ?? propertyAny?.salePrice ?? propertyAny?.last_sold_price);

    const property: PropertyFacts = {
      propertyType,
      yearBuilt,
      beds,
      baths,
      squareFeet,
      estimatedValue,
      estimatedRent,
    };

    const salesHistory: SalesHistoryFacts = {
      lastSaleDate,
      lastSalePrice,
      previousOwnerName: normalizeText(propertyAny?.previousOwnerName ?? propertyAny?.previousOwner ?? propertyAny?.previous_owner_name),
      yearsSinceSale: yearsSince(lastSaleDate),
    };

    const ownership: import("../../shared/leadIntel").OwnershipFacts = {
      currentOwnerName: ownerName,
      ownerMailingAddress,
      mailingAddressMatchesProperty,
      ownershipType,
      likelyOwnerOccupied,
      likelyRental,
      absenteeOwner,
    };

    const fieldsReturned = [
      ...(ownerName ? ["ownership.currentOwnerName"] : []),
      ...(ownerMailingAddress ? ["ownership.ownerMailingAddress"] : []),
      ...(propertyType ? ["property.propertyType"] : []),
      ...(yearBuilt ? ["property.yearBuilt"] : []),
      ...(beds ? ["property.beds"] : []),
      ...(baths ? ["property.baths"] : []),
      ...(squareFeet ? ["property.squareFeet"] : []),
      ...(estimatedValue ? ["property.estimatedValue"] : []),
      ...(estimatedRent ? ["property.estimatedRent"] : []),
      ...(lastSaleDate ? ["salesHistory.lastSaleDate"] : []),
      ...(lastSalePrice ? ["salesHistory.lastSalePrice"] : []),
    ];

    return {
      patch: {
        property,
        ownership,
        salesHistory,
      },
      source: buildSourceRecord("rentcast", "success", Date.now() - startedAt, fieldsReturned),
    };
  } catch (error) {
    return {
      patch: {},
      source: buildSourceRecord(
        "rentcast",
        "error",
        Date.now() - startedAt,
        [],
        error instanceof Error ? error.message : String(error),
      ),
    };
  }
}
