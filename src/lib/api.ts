import type { AppHealth, LeadIntelResult, LeadStateRecord, LookupHistoryItem, LeadStatus } from "./types";

async function readJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}

export async function loadHealth(): Promise<AppHealth> {
  try {
    const response = await fetch("/api/health");
    return await readJson<AppHealth>(response);
  } catch {
    return {
      ok: false,
      mockMode: true,
      databaseUrl: "sqlite://./lead_intel.db",
    };
  }
}

export async function lookupLeadIntel(input: { address: string; zip?: string }): Promise<LeadIntelResult> {
  const response = await fetch("/api/lookup", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  return readJson<LeadIntelResult>(response);
}

export async function loadLeadState(address: string): Promise<LeadStateRecord | null> {
  try {
    const url = new URL("/api/leads/current", window.location.origin);
    url.searchParams.set("address", address);
    const response = await fetch(url);
    const payload = await readJson<{ leadState: LeadStateRecord | null }>(response);
    return payload.leadState;
  } catch {
    return null;
  }
}

export async function saveLeadState(input: {
  inputAddress: string;
  status: LeadStatus;
  notes: string;
}): Promise<LeadStateRecord> {
  const response = await fetch("/api/leads", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  const payload = await readJson<{ leadState: LeadStateRecord }>(response);
  return payload.leadState;
}

export async function loadLookupHistory(limit = 10): Promise<LookupHistoryItem[]> {
  try {
    const url = new URL("/api/leads/history", window.location.origin);
    url.searchParams.set("limit", String(limit));
    const response = await fetch(url);
    const payload = await readJson<{ history: LookupHistoryItem[] }>(response);
    return payload.history;
  } catch {
    return [];
  }
}
