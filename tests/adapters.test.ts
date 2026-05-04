import { describe, expect, it } from "vitest";
import { buildMockLeadIntel } from "../server/adapters/mock";

describe("mock adapter", () => {
  it("returns a complete lead intel payload for demo mode", () => {
    const result = buildMockLeadIntel("123 Main St, Nashville, TN 37211");

    expect(result.normalizedAddress.city).toBeTruthy();
    expect(result.leadScore.score).toBeGreaterThanOrEqual(0);
    expect(result.sources.length).toBeGreaterThan(0);
  });
});
