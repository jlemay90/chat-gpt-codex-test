import { describe, expect, it } from "vitest";
import { createLeadStore } from "../server/db";

describe("lead store", () => {
  it("saves and reloads notes for an address", async () => {
    const store = createLeadStore(":memory:");
    await store.saveLeadState({
      inputAddress: "123 Main St, Nashville, TN 37211",
      status: "follow_up",
      notes: "Call after 6 PM",
    });

    const loaded = await store.getLeadState("123 Main St, Nashville, TN 37211");
    expect(loaded?.notes).toContain("Call after 6 PM");
  });
});
