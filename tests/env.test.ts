import { expect, it } from "vitest";
import { loadLeadIntelEnv } from "../server/env";

it("defaults to mock mode when no provider keys are set", () => {
  const env = loadLeadIntelEnv({});
  expect(env.mockMode).toBe(true);
});
