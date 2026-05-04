import assert from "node:assert/strict";
import test from "node:test";
import { generatePitch } from "../src/lib/generatePitch.js";

const lead = {
  address: "101 Knock St, Franklin, TN 37064",
  market: "Mock metro",
  scenarioLabel: "Owner-occupied single-family",
  property: {
    type: "Single-family home",
    yearBuilt: 2007,
    beds: 4,
    baths: 2.5,
    squareFeet: 1860,
    estimatedValue: 430000,
  },
  ownership: {
    ownerName: "Jordan Lee",
    occupancy: "Owner-occupied",
    ownerOccupied: true,
    absenteeOwner: false,
    rentalLikelihood: "Low",
  },
  salesHistory: {
    recentSaleDate: "2022-05-14",
    previousOwnerName: "M. Diaz",
    lastSalePrice: 360000,
    yearsSinceSale: 2.4,
  },
};

const score = {
  score: 87,
  grade: "A",
  recommendedAction: "Knock now",
  worthKnocking: true,
  reasons: [],
  signals: [],
};

test("generatePitch tailors the angle and opener for an owner-occupied lead", () => {
  const pitch = generatePitch(lead, score);

  assert.match(pitch.angle, /speed/i);
  assert.match(pitch.opener, /Spectrum/i);
  assert.match(pitch.script, /speed and value/i);
});
