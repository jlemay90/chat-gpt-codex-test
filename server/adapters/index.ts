import type { BroadbandFacts, LeadIntelDraft, LeadIntelResult, LeadScore, Recommendation, SourceRecord } from "../../shared/leadIntel";
import type { LeadIntelEnv, LeadIntelLookupInput } from "../types";
import { buildRecommendation, scoreLead } from "../scoring/scoreLead";
import { lookupGeocodio } from "./geocodio";
import { lookupRapidApiOwnership } from "./rapidapiOwnership";
import { lookupRapidApiRealEstate } from "./rapidapiRealEstate";
import { lookupRentCast } from "./rentcast";
import { buildMockLeadIntel } from "./mock";

function emptyBroadband(): BroadbandFacts {
  return {
    spectrumServiceable: null,
    gigAvailable: null,
    knownUpgradeArea: null,
    fccProviderSummary: [],
    notes: null,
  };
}

function emptyDraft(inputAddress: string): LeadIntelDraft {
  return {
    inputAddress,
    normalizedAddress: {
      line1: inputAddress,
      city: "Unknown",
      state: "Unknown",
      zip: "",
      county: null,
      lat: null,
      lng: null,
      confidence: "low",
    },
    property: {
      propertyType: null,
      yearBuilt: null,
      beds: null,
      baths: null,
      squareFeet: null,
      estimatedValue: null,
      estimatedRent: null,
    },
    ownership: {
      currentOwnerName: null,
      ownerMailingAddress: null,
      mailingAddressMatchesProperty: null,
      ownershipType: "unknown",
      likelyOwnerOccupied: null,
      likelyRental: null,
      absenteeOwner: null,
    },
    salesHistory: {
      lastSaleDate: null,
      lastSalePrice: null,
      previousOwnerName: null,
      yearsSinceSale: null,
    },
    broadband: emptyBroadband(),
    sources: [],
  };
}

function mergeDraft(base: LeadIntelDraft, patch: Partial<LeadIntelDraft>): LeadIntelDraft {
  return {
    ...base,
    ...patch,
    normalizedAddress: {
      ...base.normalizedAddress,
      ...(patch.normalizedAddress ?? {}),
    },
    property: {
      ...base.property,
      ...(patch.property ?? {}),
    },
    ownership: {
      ...base.ownership,
      ...(patch.ownership ?? {}),
    },
    salesHistory: {
      ...base.salesHistory,
      ...(patch.salesHistory ?? {}),
    },
    broadband: {
      ...base.broadband,
      ...(patch.broadband ?? {}),
      fccProviderSummary: patch.broadband?.fccProviderSummary ?? base.broadband.fccProviderSummary,
    },
    sources: patch.sources ?? base.sources,
  };
}

function inferScoreInput(draft: LeadIntelDraft): Parameters<typeof scoreLead>[0] {
  const propertyType = (draft.property.propertyType ?? "").toLowerCase();
  const ownerName = (draft.ownership.currentOwnerName ?? "").toLowerCase();
  const recentSale = typeof draft.salesHistory.yearsSinceSale === "number" ? draft.salesHistory.yearsSinceSale <= 2 : false;
  const ownerOccupied = draft.ownership.likelyOwnerOccupied === true;
  const singleFamily = propertyType.includes("single family") || propertyType.includes("single-family");
  const spectrumServiceable = draft.broadband.spectrumServiceable === true;
  const gigAvailable = draft.broadband.gigAvailable === true;
  const mobileBundleFit = ownerOccupied && singleFamily && !draft.ownership.likelyRental;
  const rental = draft.ownership.likelyRental === true || propertyType.includes("apartment") || propertyType.includes("condo");
  const llcOrTrust =
    draft.ownership.ownershipType === "llc" ||
    draft.ownership.ownershipType === "trust" ||
    draft.ownership.ownershipType === "corporate" ||
    /llc|trust|inc|corp|company/i.test(ownerName);
  const lowConfidence = draft.normalizedAddress.confidence === "low" || draft.sources.filter((source) => source.status === "success").length < 2;
  const knownUpgradeArea = draft.broadband.knownUpgradeArea === true;

  return {
    recentSale,
    ownerOccupied,
    singleFamily,
    spectrumServiceable,
    gigAvailable,
    mobileBundleFit,
    rental,
    llcOrTrust,
    lowConfidence,
    knownUpgradeArea,
  };
}

function toResult(draft: LeadIntelDraft, leadScore: LeadScore): LeadIntelResult {
  const recommendation: Recommendation = buildRecommendation({
    leadScore,
    rental: draft.ownership.likelyRental === true,
    ownerOccupied: draft.ownership.likelyOwnerOccupied === true,
    likelyOwnerName: draft.ownership.currentOwnerName,
    lowConfidence: leadScore.confidence === "low",
  });

  return {
    inputAddress: draft.inputAddress,
    normalizedAddress: draft.normalizedAddress,
    leadScore,
    property: draft.property,
    ownership: draft.ownership,
    salesHistory: draft.salesHistory,
    broadband: draft.broadband,
    recommendation,
    sources: draft.sources,
    userNotes: {
      status: "new",
      notes: "",
      lastTouchedAt: null,
    },
  };
}

export async function lookupLeadIntel(
  input: LeadIntelLookupInput,
  env: LeadIntelEnv,
): Promise<LeadIntelResult> {
  if (env.mockMode) {
    return buildMockLeadIntel(input.address);
  }

  let draft = emptyDraft(input.address);

  const geocodio = await lookupGeocodio(input.address, env);
  draft = mergeDraft(draft, geocodio.patch);
  draft.sources = [...draft.sources, geocodio.source];

  const [rentcast, ownership, realEstate] = await Promise.all([
    lookupRentCast(draft.normalizedAddress, env),
    lookupRapidApiOwnership(draft.normalizedAddress, env),
    lookupRapidApiRealEstate(draft, env),
  ]);

  draft = mergeDraft(draft, rentcast.patch);
  draft.sources = [...draft.sources, rentcast.source];

  draft = mergeDraft(draft, ownership.patch);
  draft.sources = [...draft.sources, ownership.source];

  draft = mergeDraft(draft, realEstate.patch);
  draft.sources = [...draft.sources, realEstate.source];

  if (draft.broadband.notes && draft.broadband.knownUpgradeArea == null) {
    draft.broadband.knownUpgradeArea = true;
  }

  const scoreInput = inferScoreInput(draft);
  const leadScore = scoreLead(scoreInput);

  return toResult(draft, leadScore);
}

