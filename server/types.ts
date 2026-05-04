export type {
  AddressConfidence,
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
  BroadbandFacts,
} from "../shared/leadIntel";

import type { LeadStateRecord } from "../shared/leadIntel";

export interface LeadIntelLookupInput {
  address: string;
  zip?: string;
}

export interface LeadIntelEnv {
  geocodioApiKey: string | null;
  rentcastApiKey: string | null;
  attomApiKey: string | null;
  rapidApiKey: string | null;
  rapidApiPropertyOwnershipHost: string;
  rapidApiRealEstateHost: string;
  rapidApiRentalEstimateHost: string | null;
  databaseUrl: string;
  mockMode: boolean;
  serverPort: number;
}

export interface LeadStore {
  saveLeadState(input: {
    inputAddress: string;
    status: import("../shared/leadIntel").LeadStatus;
    notes: string;
    lastTouchedAt?: string | null;
  }): Promise<LeadStateRecord>;
  getLeadState(address: string): Promise<LeadStateRecord | null>;
  listLookupHistory(limit?: number): Promise<Array<LeadStateRecord & { score: number | null; grade: string | null; lookedUpAt: string }>>;
  recordLookup(result: import("../shared/leadIntel").LeadIntelResult): Promise<void>;
}

export interface LeadLookupContext {
  inputAddress: string;
  zip?: string;
  mockMode: boolean;
  env: LeadIntelEnv;
}
