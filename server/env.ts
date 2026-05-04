import { z } from "zod";
import type { LeadIntelEnv } from "./types";

const envSchema = z.object({
  GEOCODIO_API_KEY: z.string().optional().nullable(),
  RENTCAST_API_KEY: z.string().optional().nullable(),
  ATTOM_API_KEY: z.string().optional().nullable(),
  RAPIDAPI_KEY: z.string().optional().nullable(),
  RAPIDAPI_PROPERTY_OWNERSHIP_HOST: z.string().default("property-ownership-api.p.rapidapi.com"),
  RAPIDAPI_REAL_ESTATE_HOST: z.string().default("real-time-real-estate-data.p.rapidapi.com"),
  RAPIDAPI_RENTAL_ESTIMATE_HOST: z.string().optional().nullable(),
  DATABASE_URL: z.string().default("sqlite://./lead_intel.db"),
  LEAD_INTEL_MOCK_MODE: z.string().optional().nullable(),
  LEAD_INTEL_SERVER_PORT: z.coerce.number().int().positive().default(8787),
});

function readBoolean(value: string | null | undefined): boolean {
  if (!value) {
    return false;
  }

  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
}

export function loadLeadIntelEnv(rawEnv: NodeJS.ProcessEnv = process.env): LeadIntelEnv {
  const parsed = envSchema.parse(rawEnv);
  const providerKeysConfigured = Boolean(parsed.GEOCODIO_API_KEY || parsed.RENTCAST_API_KEY || parsed.RAPIDAPI_KEY);

  return {
    geocodioApiKey: parsed.GEOCODIO_API_KEY ?? null,
    rentcastApiKey: parsed.RENTCAST_API_KEY ?? null,
    attomApiKey: parsed.ATTOM_API_KEY ?? null,
    rapidApiKey: parsed.RAPIDAPI_KEY ?? null,
    rapidApiPropertyOwnershipHost: parsed.RAPIDAPI_PROPERTY_OWNERSHIP_HOST,
    rapidApiRealEstateHost: parsed.RAPIDAPI_REAL_ESTATE_HOST,
    rapidApiRentalEstimateHost: parsed.RAPIDAPI_RENTAL_ESTIMATE_HOST ?? null,
    databaseUrl: parsed.DATABASE_URL,
    mockMode: readBoolean(parsed.LEAD_INTEL_MOCK_MODE) || !providerKeysConfigured,
    serverPort: parsed.LEAD_INTEL_SERVER_PORT,
  };
}

export function resolveDatabasePath(databaseUrl: string): string {
  if (databaseUrl.startsWith("sqlite://")) {
    return databaseUrl.replace(/^sqlite:\/\//, "");
  }

  if (databaseUrl === ":memory:") {
    return databaseUrl;
  }

  return databaseUrl;
}
