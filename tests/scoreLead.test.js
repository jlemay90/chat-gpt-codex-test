import assert from "node:assert/strict";
import test from "node:test";
import { scoreLead } from "../src/lib/scoreLead.js";

const idealLead = {
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

const rentalLead = {
  address: "202 Rental Ln, Nashville, TN 37211",
  market: "Mock metro",
  scenarioLabel: "Absentee rental property",
  property: {
    type: "Duplex",
    yearBuilt: 1988,
    beds: 4,
    baths: 2,
    squareFeet: 1720,
    estimatedValue: 356000,
  },
  ownership: {
    ownerName: "Greenline Holdings LLC",
    occupancy: "Likely rental",
    ownerOccupied: false,
    absenteeOwner: true,
    rentalLikelihood: "High",
  },
  salesHistory: {
    recentSaleDate: "2019-10-03",
    previousOwnerName: "A. Carter",
    lastSalePrice: 255000,
    yearsSinceSale: 5.4,
  },
};

test("scoreLead returns an A or B grade for an ideal owner-occupied lead", () => {
  const result = scoreLead(idealLead);

  assert.ok(result.score >= 80);
  assert.equal(result.grade, "A");
  assert.equal(result.worthKnocking, true);
  assert.match(result.recommendedAction, /knock/i);
});

test("scoreLead returns a D grade for a rental absentee lead", () => {
  const result = scoreLead(rentalLead);

  assert.ok(result.score < 50);
  assert.equal(result.grade, "D");
  assert.equal(result.worthKnocking, false);
});
