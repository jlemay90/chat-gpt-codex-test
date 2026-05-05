const API_BASE_URL = String(import.meta.env.VITE_LEAD_INTEL_API_BASE_URL ?? "").trim();

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

function mapBroadband(providers, fallbackSummary) {
  if (!providers || providers.length === 0) {
    return {
      spectrumServiceable: false,
      gigAvailable: false,
      providers: [],
      summary: fallbackSummary ?? "No FCC broadband data found for this address.",
    };
  }

  const SPECTRUM_NAMES = ["charter", "spectrum", "charter communications"];
  const spectrumEntry = providers.find((provider) =>
    SPECTRUM_NAMES.some((name) => normalizeText(provider.brand_name).toLowerCase().includes(name)),
  );

  const gigEntry = providers.find((provider) => (provider.max_advertised_download_speed ?? 0) >= 940);

  const providerList = providers.map((provider) => ({
    name: normalizeText(provider.brand_name) || "Unknown",
    technology: normalizeText(provider.technology_name ?? provider.technology) || "Unknown",
    downloadMbps: toNumber(provider.max_advertised_download_speed) ?? 0,
    uploadMbps: toNumber(provider.max_advertised_upload_speed) ?? 0,
    isSpectrum: SPECTRUM_NAMES.some((name) => normalizeText(provider.brand_name).toLowerCase().includes(name)),
  }));

  return {
    spectrumServiceable: Boolean(spectrumEntry),
    gigAvailable: Boolean(gigEntry),
    providers: providerList,
    summary: spectrumEntry
      ? `Spectrum is available (${spectrumEntry.max_advertised_download_speed ?? "?"} Mbps down). ${providers.length} total ISP(s) at this address.`
      : `Spectrum is not listed at this address. ${providers.length} other ISP(s) are present.`,
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

async function geocodeAddress(address) {
  const params = new URLSearchParams({
    address,
    benchmark: "2020",
    format: "json",
  });

  const response = await fetch(`https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?${params}`);
  if (!response.ok) {
    throw new Error(`Geocode ${response.status}`);
  }

  const json = await response.json();
  const match = json?.result?.addressMatches?.[0];
  if (!match) {
    return null;
  }

  return {
    lat: match.coordinates.y,
    lon: match.coordinates.x,
    normalizedAddress: match.matchedAddress,
  };
}

async function getFccBroadband(lat, lon) {
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    category: "Fixed Broadband",
    limit: 25,
    offset: 0,
  });

  const response = await fetch(`https://broadbandmap.fcc.gov/api/public/map/listAvailability?${params}`, {
    headers: {
      "user-agent": "Lead Intel",
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`FCC ${response.status}`);
  }

  const json = await response.json();
  return json?.data ?? [];
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

    if (Array.isArray(backendLead?.errors)) {
      result.errors.push(...backendLead.errors.filter((item) => typeof item === "string"));
    }
  } catch (error) {
    result.errors.push(`Lead API lookup failed: ${error instanceof Error ? error.message : String(error)}`);
  }

  try {
    const lat = result.normalizedAddress?.lat ?? null;
    const lon = result.normalizedAddress?.lon ?? null;

    if (lat != null && lon != null) {
      const providers = await getFccBroadband(lat, lon);
      result.broadband = mapBroadband(providers);
    } else {
      const geo = await geocodeAddress(address);
      if (geo) {
        const providers = await getFccBroadband(geo.lat, geo.lon);
        result.broadband = mapBroadband(providers);

        if (!result.normalizedAddress) {
          result.normalizedAddress = {
            line1: geo.normalizedAddress,
            city: "",
            state: "",
            zip: "",
            lat: geo.lat,
            lon: geo.lon,
          };
        }
      } else {
        result.errors.push("Could not geocode address for broadband lookup.");
        result.broadband = mapBroadband([]);
      }
    }
  } catch (error) {
    result.errors.push(`Broadband lookup failed: ${error instanceof Error ? error.message : String(error)}`);
    result.broadband = mapBroadband([]);
  }

  return result;
}
