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

function looksLikePropertyMatch(ownerMailingAddress: string | null, normalizedAddress: LeadIntelDraft["normalizedAddress"]): boolean | null {
  if (!ownerMailingAddress) return null;
  const text = ownerMailingAddress.toLowerCase();
  return (
    text.includes(normalizedAddress.line1.toLowerCase()) ||
    text.includes(normalizedAddress.city.toLowerCase()) ||
    text.includes(normalizedAddress.zip.toLowerCase())
  );
}

function buildRequestBody(normalizedAddress: LeadIntelDraft["normalizedAddress"]): Record<string, unknown> {
  return {
    address: [normalizedAddress.line1, normalizedAddress.city, normalizedAddress.state, normalizedAddress.zip]
      .filter(Boolean)
      .join(", "),
    street: normalizedAddress.line1,
    city: normalizedAddress.city,
    state: normalizedAddress.state,
    zip: normalizedAddress.zip,
  };
}

export async function lookupRapidApiOwnership(
  normalizedAddress: LeadIntelDraft["normalizedAddress"],
  env: LeadIntelEnv,
): Promise<{ patch: Partial<LeadIntelDraft>; source: SourceRecord }> {
  const startedAt = Date.now();
  if (!env.rapidApiKey) {
    return {
      patch: {},
      source: buildSourceRecord("property-ownership-api", "skipped", 0, [], "RAPIDAPI_KEY is not configured"),
    };
  }

  try {
    const response = await fetchJsonWithTimeout(
      `https://${env.rapidApiPropertyOwnershipHost}/GetReport`,
      {
        method: "POST",
        headers: {
          "x-rapidapi-key": env.rapidApiKey,
          "x-rapidapi-host": env.rapidApiPropertyOwnershipHost,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(buildRequestBody(normalizedAddress)),
      },
      { retries: 1, timeoutMs: 10000 },
    );

    const root = firstObject<Record<string, unknown>>(Array.isArray(response.data) ? response.data : response.data);
    const record = firstObject<Record<string, unknown>>(root?.report ?? root?.results ?? root?.data ?? root);
    const recordAny = record as Record<string, any> | null;
    const ownerName = normalizeText(
      recordAny?.ownerName ?? recordAny?.currentOwnerName ?? recordAny?.owner?.name ?? recordAny?.owner ?? recordAny?.fullName,
    );
    const ownerMailingAddress = normalizeText(
      recordAny?.ownerMailingAddress
        ?? recordAny?.mailingAddress
        ?? recordAny?.mailing_address
        ?? recordAny?.owner?.mailingAddress
        ?? recordAny?.ownerAddress,
    );
    const ownershipType = parseOwnershipType(ownerName, recordAny?.ownerType ?? recordAny?.ownershipType ?? recordAny?.owner?.type);
    const mailingAddressMatchesProperty = looksLikePropertyMatch(ownerMailingAddress, normalizedAddress);
    const likelyOwnerOccupied = mailingAddressMatchesProperty === true && ownershipType === "individual";
    const likelyRental = ownershipType !== "individual" || mailingAddressMatchesProperty === false;
    const absenteeOwner = mailingAddressMatchesProperty === false;

    const property: PropertyFacts = {
      propertyType: normalizeText(recordAny?.propertyType ?? recordAny?.homeType ?? recordAny?.property?.propertyType),
      yearBuilt: toNumber(recordAny?.yearBuilt ?? recordAny?.property?.yearBuilt),
      beds: toNumber(recordAny?.beds ?? recordAny?.bedrooms ?? recordAny?.property?.beds),
      baths: toNumber(recordAny?.baths ?? recordAny?.bathrooms ?? recordAny?.property?.baths),
      squareFeet: toNumber(recordAny?.squareFeet ?? recordAny?.square_feet ?? recordAny?.livingArea ?? recordAny?.property?.squareFeet),
      estimatedValue: toNumber(recordAny?.estimatedValue ?? recordAny?.value ?? recordAny?.marketValue),
      estimatedRent: toNumber(recordAny?.estimatedRent ?? recordAny?.rentEstimate ?? recordAny?.rent),
    };

    const lastSaleDate = formatDate(recordAny?.lastSaleDate ?? recordAny?.saleDate ?? recordAny?.last_sale_date);
    const salesHistory: SalesHistoryFacts = {
      lastSaleDate,
      lastSalePrice: toNumber(recordAny?.lastSalePrice ?? recordAny?.salePrice ?? recordAny?.last_sale_price),
      previousOwnerName: normalizeText(recordAny?.previousOwnerName ?? recordAny?.previousOwner ?? recordAny?.previous_owner_name),
      yearsSinceSale: yearsSince(lastSaleDate),
    };

    const ownership: OwnershipFacts = {
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
      ...(property.propertyType ? ["property.propertyType"] : []),
      ...(property.yearBuilt ? ["property.yearBuilt"] : []),
      ...(salesHistory.lastSaleDate ? ["salesHistory.lastSaleDate"] : []),
      ...(salesHistory.lastSalePrice ? ["salesHistory.lastSalePrice"] : []),
    ];

    return {
      patch: {
        property,
        ownership,
        salesHistory,
      },
      source: buildSourceRecord("property-ownership-api", "success", Date.now() - startedAt, fieldsReturned),
    };
  } catch (error) {
    return {
      patch: {},
      source: buildSourceRecord(
        "property-ownership-api",
        "error",
        Date.now() - startedAt,
        [],
        error instanceof Error ? error.message : String(error),
      ),
    };
  }
}
