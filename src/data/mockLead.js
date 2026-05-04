const SCENARIOS = [
  {
    label: "Owner-occupied single-family",
    property: {
      type: "Single-family home",
      yearBuilt: 2006,
      beds: 4,
      baths: 2.5,
      squareFeet: 1840,
      estimatedValue: 425000,
    },
    ownership: {
      ownerName: "Sarah Johnson",
      occupancy: "Owner-occupied",
      ownerOccupied: true,
      absenteeOwner: false,
      rentalLikelihood: "Low",
    },
    salesHistory: {
      recentSaleDate: "2022-06-14",
      previousOwnerName: "M. Diaz",
      lastSalePrice: 372000,
      yearsSinceSale: 2.8,
    },
  },
  {
    label: "Absentee rental property",
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
  },
  {
    label: "Older long-tenure owner",
    property: {
      type: "Single-family home",
      yearBuilt: 1979,
      beds: 3,
      baths: 2,
      squareFeet: 1520,
      estimatedValue: 301000,
    },
    ownership: {
      ownerName: "Thomas Reed",
      occupancy: "Owner-occupied",
      ownerOccupied: true,
      absenteeOwner: false,
      rentalLikelihood: "Low",
    },
    salesHistory: {
      recentSaleDate: "2014-04-22",
      previousOwnerName: "J. Kim",
      lastSalePrice: 184000,
      yearsSinceSale: 10.1,
    },
  },
  {
    label: "Condo with soft follow-up fit",
    property: {
      type: "Condominium",
      yearBuilt: 2017,
      beds: 2,
      baths: 2,
      squareFeet: 1130,
      estimatedValue: 287000,
    },
    ownership: {
      ownerName: "Blue Harbor Trust",
      occupancy: "Likely rental",
      ownerOccupied: false,
      absenteeOwner: true,
      rentalLikelihood: "Medium",
    },
    salesHistory: {
      recentSaleDate: "2021-02-09",
      previousOwnerName: "L. Smith",
      lastSalePrice: 249000,
      yearsSinceSale: 4.3,
    },
  },
];

function normalizeAddress(address) {
  return String(address ?? "")
    .trim()
    .replace(/\s+/g, " ");
}

function hashAddress(address) {
  let hash = 0;
  for (let index = 0; index < address.length; index += 1) {
    hash = (hash << 5) - hash + address.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
}

function selectScenario(address) {
  const normalized = normalizeAddress(address);
  if (!normalized) {
    return SCENARIOS[0];
  }

  const lowered = normalized.toLowerCase();
  if (/(apt|apartment|condo|unit)/.test(lowered)) {
    return SCENARIOS[3];
  }

  if (/(llc|trust|holdings|property)/.test(lowered)) {
    return SCENARIOS[1];
  }

  return SCENARIOS[hashAddress(normalized) % SCENARIOS.length];
}

export function resolveMockLead(address) {
  const normalized = normalizeAddress(address);
  const scenario = selectScenario(normalized);

  return {
    address: normalized,
    market: "Mock metro",
    scenarioLabel: scenario.label,
    property: {
      ...scenario.property,
    },
    ownership: {
      ...scenario.ownership,
    },
    salesHistory: {
      ...scenario.salesHistory,
    },
  };
}

export function listMockAddresses() {
  return [
    "123 Main St, Nashville, TN 37211",
    "88 Elm Ave, Franklin, TN 37064",
    "410 River Rd, Murfreesboro, TN 37129",
    "19 Pine Ct, Brentwood, TN 37027",
  ];
}
