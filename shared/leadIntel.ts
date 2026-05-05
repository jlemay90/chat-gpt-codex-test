export type AddressConfidence = "high" | "medium" | "low";

export type LeadGrade = "A+" | "A" | "B" | "C" | "D" | "Skip";

export type LeadAction = "knock" | "leave_sticker" | "research_more" | "skip";

export type OwnershipType = "individual" | "llc" | "trust" | "corporate" | "unknown";

export type LeadStatus =
  | "new"
  | "knocked"
  | "not_home"
  | "interested"
  | "follow_up"
  | "sold"
  | "skip";

export type SourceStatus = "success" | "partial" | "error" | "skipped";

export interface NormalizedAddress {
  line1: string;
  city: string;
  state: string;
  zip: string;
  county: string | null;
  lat: number | null;
  lng: number | null;
  confidence: AddressConfidence;
}

export interface PropertyFacts {
  propertyType: string | null;
  yearBuilt: number | null;
  beds: number | null;
  baths: number | null;
  squareFeet: number | null;
  estimatedValue: number | null;
  estimatedRent: number | null;
}

export interface OwnershipFacts {
  currentOwnerName: string | null;
  ownerMailingAddress: string | null;
  mailingAddressMatchesProperty: boolean | null;
  ownershipType: OwnershipType;
  likelyOwnerOccupied: boolean | null;
  likelyRental: boolean | null;
  absenteeOwner: boolean | null;
}

export interface SalesHistoryFacts {
  lastSaleDate: string | null;
  lastSalePrice: number | null;
  previousOwnerName: string | null;
  yearsSinceSale: number | null;
}

export interface BroadbandFacts {
  spectrumServiceable: boolean | null;
  gigAvailable: boolean | null;
  knownUpgradeArea: boolean | null;
  fccProviderSummary: string[];
  notes: string | null;
}

export interface LeadSignalBreakdown {
  label: string;
  points: number;
  detail: string;
}

export interface LeadScore {
  score: number;
  grade: LeadGrade;
  confidence: AddressConfidence;
  bestAngle: string;
  recommendedAction: LeadAction;
  reasons: string[];
  signalBreakdown: LeadSignalBreakdown[];
}

export interface Recommendation {
  opener: string;
  followUpAngle: string;
  objectionPreempt: string;
  offerToLeadWith: string;
}

export interface SourceRecord {
  provider: string;
  status: SourceStatus;
  latencyMs: number | null;
  fieldsReturned: string[];
  error: string | null;
}

export interface UserNotes {
  status: LeadStatus;
  notes: string;
  lastTouchedAt: string | null;
}

export interface LeadIntelResult {
  inputAddress: string;
  normalizedAddress: NormalizedAddress;
  leadScore: LeadScore;
  property: PropertyFacts;
  ownership: OwnershipFacts;
  salesHistory: SalesHistoryFacts;
  broadband: BroadbandFacts;
  recommendation: Recommendation;
  sources: SourceRecord[];
  userNotes: UserNotes;
}

export interface LeadIntelDraft {
  inputAddress: string;
  normalizedAddress: NormalizedAddress;
  property: PropertyFacts;
  ownership: OwnershipFacts;
  salesHistory: SalesHistoryFacts;
  broadband: BroadbandFacts;
  sources: SourceRecord[];
}

export interface LeadStateRecord {
  inputAddress: string;
  status: LeadStatus;
  notes: string;
  lastTouchedAt: string | null;
}

