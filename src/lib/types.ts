import type { LeadStatus } from "../../shared/leadIntel";

export type {
  AddressConfidence,
  BroadbandFacts,
  LeadAction,
  LeadGrade,
  LeadIntelDraft,
  LeadIntelResult,
  LeadScore,
  LeadSignalBreakdown,
  LeadStateRecord,
  LeadStatus,
  NormalizedAddress,
  OwnershipFacts,
  OwnershipType,
  PropertyFacts,
  Recommendation,
  SalesHistoryFacts,
  SourceRecord,
  SourceStatus,
  UserNotes,
} from "../../shared/leadIntel";

export interface LookupHistoryItem {
  inputAddress: string;
  status: LeadStatus;
  notes: string;
  lastTouchedAt: string | null;
  score: number | null;
  grade: string | null;
  lookedUpAt: string;
}

export interface AppHealth {
  ok: boolean;
  mockMode: boolean;
  databaseUrl: string;
}
