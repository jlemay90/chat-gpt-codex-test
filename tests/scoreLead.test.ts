import { describe, expect, it } from "vitest";
import { scoreLead } from "../server/scoring/scoreLead";

describe("scoreLead", () => {
  it("returns an A+ score for a recent owner-occupied single-family serviceable home", () => {
    const result = scoreLead({
      recentSale: true,
      ownerOccupied: true,
      singleFamily: true,
      spectrumServiceable: true,
      gigAvailable: true,
      mobileBundleFit: true,
      rental: false,
      llcOrTrust: false,
      lowConfidence: false,
    });

    expect(result.score).toBeGreaterThanOrEqual(90);
    expect(result.grade).toBe("A+");
    expect(result.bestAngle).toContain("upgrade");
  });

  it("downgrades low-confidence rental leads and explains why", () => {
    const result = scoreLead({
      recentSale: false,
      ownerOccupied: false,
      singleFamily: false,
      spectrumServiceable: true,
      gigAvailable: false,
      mobileBundleFit: false,
      rental: true,
      llcOrTrust: true,
      lowConfidence: true,
    });

    expect(result.score).toBeLessThan(50);
    expect(result.grade).toBe("Skip");
    expect(result.reasons.join(" ")).toContain("low confidence");
  });
});
