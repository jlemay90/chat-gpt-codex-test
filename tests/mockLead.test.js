import assert from "node:assert/strict";
import test from "node:test";
import { resolveMockLead } from "../src/data/mockLead.js";

test("resolveMockLead returns a stable scenario for the same address", () => {
  const first = resolveMockLead("123 Main St, Nashville, TN 37211");
  const second = resolveMockLead("123 Main St, Nashville, TN 37211");

  assert.equal(first.address, "123 Main St, Nashville, TN 37211");
  assert.equal(first.scenarioLabel, second.scenarioLabel);
  assert.equal(first.property.type, second.property.type);
});
