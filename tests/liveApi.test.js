import assert from "node:assert/strict";
import test from "node:test";
import { mapBackendBroadband } from "../src/lib/liveApi.js";

test("mapBackendBroadband uses backend broadband data without browser-only FCC lookup", () => {
  const broadband = mapBackendBroadband({
    spectrumServiceable: true,
    gigAvailable: true,
    knownUpgradeArea: true,
    fccProviderSummary: ["Spectrum", "AT&T Fiber"],
    notes: "Mock broadband context for demo mode.",
  });

  assert.equal(broadband.spectrumServiceable, true);
  assert.equal(broadband.gigAvailable, true);
  assert.equal(broadband.providers.length, 2);
  assert.equal(broadband.providers[0].name, "Spectrum");
  assert.equal(broadband.providers[0].isSpectrum, true);
  assert.match(broadband.summary, /Spectrum is available/);
});

test("mapBackendBroadband returns a safe unavailable result when backend data is missing", () => {
  const broadband = mapBackendBroadband(null);

  assert.equal(broadband.spectrumServiceable, false);
  assert.equal(broadband.gigAvailable, false);
  assert.deepEqual(broadband.providers, []);
  assert.match(broadband.summary, /unavailable/);
});
