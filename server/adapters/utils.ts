import type { SourceRecord, SourceStatus } from "../../shared/leadIntel";

export function compactAddressParts(parts: Array<string | null | undefined>): string {
  return parts
    .map((part) => (typeof part === "string" ? part.trim() : ""))
    .filter(Boolean)
    .join(" ");
}

export function normalizeText(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

export function toBoolean(value: unknown): boolean | null {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes", "y"].includes(normalized)) return true;
    if (["false", "0", "no", "n"].includes(normalized)) return false;
  }

  return null;
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function firstObject<T = Record<string, unknown>>(value: unknown): T | null {
  if (Array.isArray(value) && value.length > 0 && isObject(value[0])) {
    return value[0] as T;
  }

  if (isObject(value)) {
    return value as T;
  }

  return null;
}

export function firstArray<T = unknown>(value: unknown): T[] {
  if (Array.isArray(value)) {
    return value as T[];
  }

  if (isObject(value)) {
    for (const key of ["results", "data", "properties", "items", "listings"]) {
      const maybeArray = value[key];
      if (Array.isArray(maybeArray)) {
        return maybeArray as T[];
      }
    }
  }

  return [];
}

export function buildSourceRecord(
  provider: string,
  status: SourceStatus,
  latencyMs: number | null,
  fieldsReturned: string[],
  error: string | null = null,
): SourceRecord {
  return {
    provider,
    status,
    latencyMs,
    fieldsReturned,
    error,
  };
}

export async function fetchJsonWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit = {},
  options: { timeoutMs?: number; retries?: number } = {},
): Promise<{ data: unknown; status: number; ok: boolean }> {
  const timeoutMs = options.timeoutMs ?? 8000;
  const retries = options.retries ?? 0;

  let lastError: unknown = null;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(input, {
        ...init,
        signal: controller.signal,
      });
      clearTimeout(timer);

      const text = await response.text();
      let data: unknown = text;
      if (text.length > 0) {
        try {
          data = JSON.parse(text);
        } catch {
          data = text;
        }
      }

      if (!response.ok && response.status >= 500 && attempt < retries) {
        lastError = new Error(`HTTP ${response.status}`);
        continue;
      }

      return { data, status: response.status, ok: response.ok };
    } catch (error) {
      clearTimeout(timer);
      lastError = error;
      if (attempt === retries) {
        throw error instanceof Error ? error : new Error(String(error));
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}
