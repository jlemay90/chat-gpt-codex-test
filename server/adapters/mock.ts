import type {
  BroadbandFacts,
  LeadIntelDraft,
  LeadIntelResult,
  LeadScore,
  NormalizedAddress,
  OwnershipFacts,
  PropertyFacts,
  SalesHistoryFacts,
  SourceRecord,
  UserNotes,
} from "../../shared/leadIntel";
import { buildRecommendation, scoreLead } from "../scoring/scoreLead";
import { buildSourceRecord } from "./utils";

function parseMockAddress(inputAddress: string): Pick<NormalizedAddress, "line1" | "city" | "state" | "zip"> {
  const parts = inputAddress.split(",").map((part) => part.trim()).filter(Boolean);

  if (parts.length >= 3) {
    const stateZip = parts[parts.length - 1];
    const stateZipMatch = stateZip.match(/^([A-Z]{2})\s+(\d{5})(?:-\d{4})?$/i);
    if (stateZipMatch) {
      return {
        line1: parts[0],
        city: parts[1],
        state: stateZipMatch[1].toUpperCase(),
        zip: stateZipMatch[2],
      };
    }
  }

  return {
    line1: "123 Main St",
    city: "Nashville",
    state: "TN",
    zip: "37211",
  };
}

function buildSources(): SourceRecord[] {
  return [
    buildSourceRecord("geocodio", "success", 92, ["normalizedAddress", "county", "lat", "lng"]),
    buildSourceRecord("rentcast", "success", 144, ["property", "ownership", "salesHistory", "estimatedValue", "estimatedRent"]),
    buildSourceRecord("property-ownership-api", "success", 183, ["ownership", "salesHistory"]),
    buildSourceRecord("real-time-real-estate-data", "partial", 210, ["knownUpgradeArea", "listingContext"]),
  ];
}

export function buildMockLeadIntel(inputAddress: string): LeadIntelResult {
  const parsed = parseMockAddress(inputAddress);

  const normalizedAddress: NormalizedAddress = {
    line1: parsed.line1,
    city: parsed.city,
    state: parsed.state,
    zip: parsed.zip,
    county: "Davidson",
    lat: 36.1627,
    lng: -86.7816,
    confidence: "high",
  };

  const property: PropertyFacts = {
    propertyType: "Single Family",
    yearBuilt: 2012,
    beds: 3,
    baths: 2,
    squareFeet: 1824,
    estimatedValue: 364000,
    estimatedRent: 2295,
  };

  const ownership: OwnershipFacts = {
    currentOwnerName: "Jordan Taylor",
    ownerMailingAddress: `${parsed.line1}, ${parsed.city}, ${parsed.state} ${parsed.zip}`,
    mailingAddressMatchesProperty: true,
    ownershipType: "individual",
    likelyOwnerOccupied: true,
    likelyRental: false,
    absenteeOwner: false,
  };

  const salesHistory: SalesHistoryFacts = {
    lastSaleDate: "2024-03-18",
    lastSalePrice: 315000,
    previousOwnerName: "S. Miller",
    yearsSinceSale: 1.1,
  };

  const broadband: BroadbandFacts = {
    spectrumServiceable: true,
    gigAvailable: true,
    knownUpgradeArea: true,
    fccProviderSummary: ["Spectrum", "AT&T Fiber", "Google Fiber"],
    notes: "Mock broadband context for demo mode.",
  };

  const leadScore: LeadScore = scoreLead({
    recentSale: true,
    ownerOccupied: true,
    singleFamily: true,
    spectrumServiceable: true,
    gigAvailable: true,
    mobileBundleFit: true,
    rental: false,
    llcOrTrust: false,
    lowConfidence: false,
    knownUpgradeArea: true,
  });

  const recommendation = buildRecommendation({
    leadScore,
    rental: false,
    ownerOccupied: true,
    likelyOwnerName: ownership.currentOwnerName,
    lowConfidence: false,
  });

  const userNotes: UserNotes = {
    status: "new",
    notes: "",
    lastTouchedAt: null,
  };

  return {
    inputAddress,
    normalizedAddress,
    leadScore,
    property,
    ownership,
    salesHistory,
    broadband,
    recommendation,
    sources: buildSources(),
    userNotes,
  };
}

export function mockLeadIntelDraft(inputAddress: string): LeadIntelDraft {
  const result = buildMockLeadIntel(inputAddress);
  return {
    inputAddress: result.inputAddress,
    normalizedAddress: result.normalizedAddress,
    property: result.property,
    ownership: result.ownership,
    salesHistory: result.salesHistory,
    broadband: result.broadband,
    sources: result.sources,
  };
}

