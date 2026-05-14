const API_BASE_URL = String(import.meta.env?.VITE_LEAD_INTEL_API_BASE_URL ?? "").trim();
const SPECTRUM_NAMES = ["charter", "spectrum", "charter communications"];

function buildApiUrl(path) {
  if (!API_BASE_URL) {
    return path;
  }

  return new URL(path, API_BASE_URL).toString();
}

function normalizeText(value) {
  if (value == null) {
    return "";
  }

  return String(value).trim();
}

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function isSpectrumProvider(name) {
  const normalized = normalizeText(name).toLowerCase();
  return SPECTRUM_NAMES.some((spectrumName) => normalized.includes(spectrumName));
}

function mapBackendLead(result, fallbackAddress) {
  const normalizedAddress = result.normalizedAddress
    ? {
        line1: normalizeText(result.normalizedAddress.line1) || fallbackAddress,
        city: normalizeText(result.normalizedAddress.city) || "",
        state: normalizeText(result.normalizedAddress.state) || "",
        zip: normalizeText(result.normalizedAddress.zip) || "",
        lat: toNumber(result.normalizedAddress.lat),
        lon: toNumber(result.normalizedAddress.lng ?? result.normalizedAddress.lon),
      }
    : null;

  const property = result.property
    ? {
        type: normalizeText(result.property.propertyType) || "Unknown",
        yearBuilt: toNumber(result.property.yearBuilt),
        beds: toNumber(result.property.beds),
        baths: toNumber(result.property.baths),
        squareFeet: toNumber(result.property.squareFeet),
        estimatedValue: toNumber(result.property.estimatedValue),
        estimatedRent: toNumber(result.property.estimatedRent),
      }
    : null;

  const ownerOccupied = result.ownership?.likelyOwnerOccupied === true;
  const rentalLikelihood = ownerOccupied
    ? "Low"
    : result.ownership?.likelyRental === true
      ? "High"
      : "Medium";

  const ownership = result.ownership
    ? {
        ownerName: normalizeText(result.ownership.currentOwnerName) || "Unknown",
        occupancy: ownerOccupied ? "Owner-occupied" : result.ownership.absenteeOwner ? "Absentee owner" : "Likely rental",
        ownerOccupied,
        absenteeOwner: result.ownership.absenteeOwner === true,
        rentalLikelihood,
      }
    : null;

  const salesHistory = result.salesHistory
    ? {
        recentSaleDate: result.salesHistory.lastSaleDate ?? null,
        lastSalePrice: toNumber(result.salesHistory.lastSalePrice),
        previousOwnerName: normalizeText(result.salesHistory.previousOwnerName) || "Unknown",
        yearsSinceSale: toNumber(result.salesHistory.yearsSinceSale),
      }
    : null;

  return {
    normalizedAddress,
    property,
    ownership,
    salesHistory,
  };
}

export function mapBackendBroadband(broadband) {
  if (!broadband) {
    return {
      spectrumServiceable: false,
      gigAvailable: false,
      providers: [],
      summary: "Broadband data unavailable from the Lead Intel API.",
    };
  }

  const providerNames = Array.isArray(broadband.fccProviderSummary)
    ? broadband.fccProviderSummary.map(normalizeText).filter(Boolean)
    : [];
  const spectrumServiceable = broadband.spectrumServiceable === true || providerNames.some(isSpectrumProvider);
  const gigAvailable = broadband.gigAvailable === true;

  const providerList = providerNames.map((name) => ({
    name,
    technology: "Fixed broadband",
    downloadMbps: gigAvailable && isSpectrumProvider(name) ? 1000 : 0,
    uploadMbps: 0,
    isSpectrum: isSpectrumProvider(name),
  }));

  const availabilityText = spectrumServiceable
    ? `Spectrum is available${gigAvailable ? " with gig-capable service" : ""}.`
    : "Spectrum is not confirmed for this address.";
  const providerText = providerList.length > 0
    ? `${providerList.length} provider signal(s): ${providerList.map((provider) => provider.name).join(", ")}.`
    : "No provider list returned by the backend.";
  const notesText = broadband.notes ? ` ${broadband.notes}` : "";

  return {
    spectrumServiceable,
    gigAvailable,
    providers: providerList,
    summary: `${availabilityText} ${providerText}${notesText}`,
  };
}

async function lookupLeadIntel(address) {
  const response = await fetch(buildApiUrl("/api/lookup"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ address }),
  });

  if (!response.ok) {
    throw new Error(`Lead API returned ${response.status}`);
  }

  return response.json();
}

export async function liveLookup(address) {
  const result = {
    source: "live",
    address,
    property: null,
    ownership: null,
    salesHistory: null,
    normalizedAddress: null,
    broadband: null,
    errors: [],
  };

  try {
    const backendLead = await lookupLeadIntel(address);
    const mappedLead = mapBackendLead(backendLead, address);

    result.property = mappedLead.property;
    result.ownership = mappedLead.ownership;
    result.salesHistory = mappedLead.salesHistory;
    result.normalizedAddress = mappedLead.normalizedAddress;
    result.broadband = mapBackendBroadband(backendLead?.broadband);

    if (Array.isArray(backendLead?.errors)) {
      result.errors.push(...backendLead.errors.filter((item) => typeof item === "string"));
    }
  } catch (error) {
    result.errors.push(`Lead API lookup failed: ${error instanceof Error ? error.message : String(error)}`);
  }

  if (!result.broadband) {
    result.broadband = mapBackendBroadband(null);
  }

  return result;
}
