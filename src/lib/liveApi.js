// Lead Intel — Live API Layer
// Calls US Real Estate API (RapidAPI) + FCC Broadband Map API
// Falls back gracefully to null values on any error so UI never breaks

const RAPIDAPI_KEY = "8c69a60bd8mshe19dc95fcf339a9p137ab0jsn5f0349af998f";
const RE_HOST = "us-real-estate.p.rapidapi.com";

// ─── Step 1: Search for property by address to get property_id ───────────────
async function searchProperty(address) {
  const params = new URLSearchParams({ location: address, status: "for_sale", type: "single_family" });
  const res = await fetch(`https://${RE_HOST}/v2/for-sale?${params}`, {
    headers: {
      "x-rapidapi-key": RAPIDAPI_KEY,
      "x-rapidapi-host": RE_HOST,
    },
  });
  if (!res.ok) throw new Error(`RE search ${res.status}`);
  const json = await res.json();
  // Try to find a matching property from results
  const homes = json?.data?.home_search?.results ?? [];
  if (homes.length === 0) return null;
  return homes[0];
}

// ─── Step 2: Get full property detail by property_id ─────────────────────────
async function getPropertyDetail(propertyId) {
  const params = new URLSearchParams({ property_id: propertyId });
  const res = await fetch(`https://${RE_HOST}/v3/property-detail?${params}`, {
    headers: {
      "x-rapidapi-key": RAPIDAPI_KEY,
      "x-rapidapi-host": RE_HOST,
    },
  });
  if (!res.ok) throw new Error(`RE detail ${res.status}`);
  const json = await res.json();
  return json?.data ?? null;
}

// ─── Step 3: FCC Broadband — geocode via Census, then query FCC ──────────────
async function geocodeAddress(address) {
  const params = new URLSearchParams({
    address,
    benchmark: "2020",
    format: "json",
  });
  const res = await fetch(
    `https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?${params}`
  );
  if (!res.ok) throw new Error(`Geocode ${res.status}`);
  const json = await res.json();
  const match = json?.result?.addressMatches?.[0];
  if (!match) return null;
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
  const res = await fetch(
    `https://broadbandmap.fcc.gov/api/public/map/listAvailability?${params}`,
    {
      headers: {
        "user-agent": "play/0.0.0",
        Accept: "application/json",
      },
    }
  );
  if (!res.ok) throw new Error(`FCC ${res.status}`);
  const json = await res.json();
  return json?.data ?? [];
}

// ─── Map US Real Estate response → lead data shape ───────────────────────────
function mapPropertyData(detail) {
  if (!detail) return null;

  const desc = detail.description ?? {};
  const est = detail.estimate ?? {};
  const history = detail.sale_history ?? [];
  const owner = detail.owner ?? {};
  const lastSale = history[0] ?? {};
  const prevSale = history[1] ?? {};

  // Absentee owner detection: owner mailing address vs property address
  const ownerMailCity = (owner.mailing_address?.city ?? "").toLowerCase();
  const propCity = (detail.location?.address?.city ?? "").toLowerCase();
  const absentee = ownerMailCity && propCity && ownerMailCity !== propCity;

  // Owner-occupied heuristic: if not listed for rent and owner mailing matches
  const listedForRent = (desc.type ?? "").toLowerCase().includes("rent");
  const ownerOccupied = !absentee && !listedForRent;

  const yearsSinceSale = lastSale.date
    ? parseFloat(
        ((Date.now() - new Date(lastSale.date).getTime()) / (1000 * 60 * 60 * 24 * 365)).toFixed(1)
      )
    : null;

  return {
    property: {
      type: desc.type ?? "Single-family home",
      yearBuilt: desc.year_built ?? null,
      beds: desc.beds ?? null,
      baths: desc.baths ?? null,
      squareFeet: desc.sqft ?? null,
      estimatedValue: est.estimate ?? null,
      estimatedRent: est.rent_estimate ?? null,
    },
    ownership: {
      ownerName: owner.name ?? "Unknown",
      ownerMailingAddress: owner.mailing_address
        ? `${owner.mailing_address.line ?? ""}, ${owner.mailing_address.city ?? ""}, ${owner.mailing_address.state_code ?? ""}`
        : null,
      occupancy: ownerOccupied ? "Owner-occupied" : "Likely rental",
      ownerOccupied,
      absenteeOwner: absentee,
      rentalLikelihood: absentee ? "High" : listedForRent ? "High" : "Low",
    },
    salesHistory: {
      recentSaleDate: lastSale.date ?? null,
      lastSalePrice: lastSale.price ?? null,
      previousOwnerName: prevSale.seller_name ?? null,
      yearsSinceSale,
    },
    normalizedAddress: {
      line1: detail.location?.address?.line ?? "",
      city: detail.location?.address?.city ?? "",
      state: detail.location?.address?.state_code ?? "",
      zip: detail.location?.address?.postal_code ?? "",
      lat: detail.location?.address?.lat ?? null,
      lon: detail.location?.address?.lon ?? null,
    },
  };
}

// ─── Map FCC response → broadband facts ──────────────────────────────────────
function mapBroadband(providers) {
  if (!providers || providers.length === 0) {
    return {
      spectrumServiceable: false,
      gigAvailable: false,
      providers: [],
      summary: "No FCC broadband data found for this address.",
    };
  }

  const SPECTRUM_NAMES = ["charter", "spectrum", "charter communications"];
  const spectrumEntry = providers.find((p) =>
    SPECTRUM_NAMES.some((n) => (p.brand_name ?? "").toLowerCase().includes(n))
  );

  const gigEntry = providers.find(
    (p) => (p.max_advertised_download_speed ?? 0) >= 940
  );

  const providerList = providers.map((p) => ({
    name: p.brand_name ?? "Unknown",
    technology: p.technology_name ?? p.technology ?? "Unknown",
    downloadMbps: p.max_advertised_download_speed ?? 0,
    uploadMbps: p.max_advertised_upload_speed ?? 0,
    isSpectrum: SPECTRUM_NAMES.some((n) => (p.brand_name ?? "").toLowerCase().includes(n)),
  }));

  return {
    spectrumServiceable: !!spectrumEntry,
    gigAvailable: !!gigEntry,
    providers: providerList,
    summary: spectrumEntry
      ? `Spectrum is available (${spectrumEntry.max_advertised_download_speed ?? "?"}Mbps down). ${providers.length} total ISP(s) at this address.`
      : `Spectrum NOT found at this address. ${providers.length} other ISP(s) present.`,
  };
}

// ─── Main export: full live lookup ───────────────────────────────────────────
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

  // --- Property lookup ---
  try {
    const searchResult = await searchProperty(address);
    if (searchResult) {
      const propertyId = searchResult.property_id;
      const detail = await getPropertyDetail(propertyId);
      const mapped = mapPropertyData(detail);
      if (mapped) {
        result.property = mapped.property;
        result.ownership = mapped.ownership;
        result.salesHistory = mapped.salesHistory;
        result.normalizedAddress = mapped.normalizedAddress;
      }
    } else {
      result.errors.push("No property found for this address in US Real Estate API.");
    }
  } catch (err) {
    result.errors.push(`Property lookup failed: ${err.message}`);
  }

  // --- Broadband lookup ---
  try {
    const geo = await geocodeAddress(address);
    if (geo) {
      const providers = await getFccBroadband(geo.lat, geo.lon);
      result.broadband = mapBroadband(providers);
      if (!result.normalizedAddress) {
        result.normalizedAddress = { line1: geo.normalizedAddress, city: "", state: "", zip: "", lat: geo.lat, lon: geo.lon };
      }
    } else {
      result.errors.push("Could not geocode address for broadband lookup.");
      result.broadband = mapBroadband([]);
    }
  } catch (err) {
    result.errors.push(`Broadband lookup failed: ${err.message}`);
    result.broadband = mapBroadband([]);
  }

  return result;
}
