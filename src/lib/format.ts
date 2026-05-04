import type { LeadIntelResult, LookupHistoryItem } from "./types";

export function formatMoney(value: number | null): string {
  if (value == null || Number.isNaN(value)) {
    return "Unknown";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDecimal(value: number | null, digits = 1): string {
  if (value == null || Number.isNaN(value)) {
    return "Unknown";
  }

  return value.toFixed(digits);
}

export function formatDate(value: string | null): string {
  if (!value) {
    return "Unknown";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
}

export function formatAddress(result: LeadIntelResult | null): string {
  if (!result) {
    return "No address selected";
  }

  const { line1, city, state, zip } = result.normalizedAddress;
  return [line1, city, state, zip].filter(Boolean).join(", ");
}

export function formatHistoryAddress(item: LookupHistoryItem): string {
  return item.inputAddress;
}
