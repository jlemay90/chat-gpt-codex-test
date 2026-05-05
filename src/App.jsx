import { useState } from "react";
import { AddressSearch } from "./components/AddressSearch";
import { BroadbandCard } from "./components/BroadbandCard";
import { LeadScoreCard } from "./components/LeadScoreCard";
import { NotesCard } from "./components/NotesCard";
import { OwnershipCard } from "./components/OwnershipCard";
import { PitchCard } from "./components/PitchCard";
import { PropertySnapshot } from "./components/PropertySnapshot";
import { SalesHistoryCard } from "./components/SalesHistoryCard";
import { generatePitch } from "./lib/generatePitch";
import { resolveMockLead } from "./data/mockLead";
import { liveLookup } from "./lib/liveApi";
import { loadNotes, loadRecentSearches, saveNotes, saveRecentSearch } from "./lib/storage";
import { scoreLead } from "./lib/scoreLead";

const DEFAULT_ADDRESS = "123 Main St, Nashville, TN 37211";
const DEFAULT_LEAD = resolveMockLead(DEFAULT_ADDRESS);
const DEFAULT_SCORE = scoreLead(DEFAULT_LEAD);
const DEFAULT_PITCH = generatePitch(DEFAULT_LEAD, DEFAULT_SCORE);

function mergeLiveIntoLead(mockLead, liveData) {
  const merged = { ...mockLead };
  if (liveData.property) {
    merged.property = {
      type: liveData.property.type ?? mockLead.property.type,
      yearBuilt: liveData.property.yearBuilt ?? mockLead.property.yearBuilt,
      beds: liveData.property.beds ?? mockLead.property.beds,
      baths: liveData.property.baths ?? mockLead.property.baths,
      squareFeet: liveData.property.squareFeet ?? mockLead.property.squareFeet,
      estimatedValue: liveData.property.estimatedValue ?? mockLead.property.estimatedValue,
      estimatedRent: liveData.property.estimatedRent ?? mockLead.property.estimatedRent,
    };
  }
  if (liveData.ownership) {
    merged.ownership = {
      ownerName: liveData.ownership.ownerName ?? mockLead.ownership.ownerName,
      occupancy: liveData.ownership.occupancy ?? mockLead.ownership.occupancy,
      ownerOccupied: liveData.ownership.ownerOccupied ?? mockLead.ownership.ownerOccupied,
      absenteeOwner: liveData.ownership.absenteeOwner ?? mockLead.ownership.absenteeOwner,
      rentalLikelihood: liveData.ownership.rentalLikelihood ?? mockLead.ownership.rentalLikelihood,
    };
  }
  if (liveData.salesHistory) {
    merged.salesHistory = {
      recentSaleDate: liveData.salesHistory.recentSaleDate ?? mockLead.salesHistory.recentSaleDate,
      lastSalePrice: liveData.salesHistory.lastSalePrice ?? mockLead.salesHistory.lastSalePrice,
      previousOwnerName: liveData.salesHistory.previousOwnerName ?? mockLead.salesHistory.previousOwnerName,
      yearsSinceSale: liveData.salesHistory.yearsSinceSale ?? mockLead.salesHistory.yearsSinceSale,
    };
  }
  if (liveData.normalizedAddress) {
    const na = liveData.normalizedAddress;
    const parts = [na.line1, na.city, na.state, na.zip].filter(Boolean);
    if (parts.length > 0) merged.address = parts.join(", ");
  }
  return merged;
}

export function App() {
  const [query, setQuery] = useState(DEFAULT_ADDRESS);
  const [recentSearches, setRecentSearches] = useState(() => loadRecentSearches());
  const [activeAddress, setActiveAddress] = useState(DEFAULT_ADDRESS);
  const [lead, setLead] = useState(() => DEFAULT_LEAD);
  const [scoreResult, setScoreResult] = useState(() => DEFAULT_SCORE);
  const [pitch, setPitch] = useState(() => DEFAULT_PITCH);
  const [notes, setNotes] = useState(() => loadNotes(DEFAULT_ADDRESS));
  const [broadband, setBroadband] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [dataSource, setDataSource] = useState("mock");
  const [apiErrors, setApiErrors] = useState([]);

  async function runLookup(address) {
    const nextAddress = String(address ?? "").trim();
    if (!nextAddress) return;

    setIsLoading(true);
    setApiErrors([]);
    setBroadband(null);
    setDataSource("loading");

    const mockLead = resolveMockLead(nextAddress);
    const mockScore = scoreLead(mockLead);
    const mockPitch = generatePitch(mockLead, mockScore);
    setLead(mockLead);
    setScoreResult(mockScore);
    setPitch(mockPitch);
    setQuery(nextAddress);
    setActiveAddress(nextAddress);
    setNotes(loadNotes(nextAddress));
    setRecentSearches(saveRecentSearch(nextAddress));

    try {
      const liveData = await liveLookup(nextAddress);
      if (liveData.errors.length > 0) setApiErrors(liveData.errors);
      const enrichedLead = mergeLiveIntoLead(mockLead, liveData);
      const enrichedScore = scoreLead(enrichedLead);
      const enrichedPitch = generatePitch(enrichedLead, enrichedScore);
      setLead(enrichedLead);
      setScoreResult(enrichedScore);
      setPitch(enrichedPitch);
      setBroadband(liveData.broadband);
      setDataSource(liveData.property || liveData.ownership ? "live" : "mock");
    } catch (err) {
      setApiErrors([`Live lookup failed: ${err.message}. Showing mock data.`]);
      setDataSource("mock");
      setBroadband({ spectrumServiceable: false, gigAvailable: false, providers: [], summary: "Broadband data unavailable." });
    } finally {
      setIsLoading(false);
    }
  }

  function handleNotesChange(value) {
    setNotes(value);
    saveNotes(activeAddress, value);
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Spectrum field sales</p>
          <h1 className="brand">Lead Intel</h1>
          <p className="topbar-copy">
            Type an address to pull live property data, ownership signals, and broadband availability.
          </p>
        </div>
        <div className="topbar-badges">
          {isLoading ? (
            <span className="status-chip status-chip--loading">Fetching live data…</span>
          ) : (
            <span className={`status-chip ${dataSource === "live" ? "status-chip--good" : ""}`}>
              {dataSource === "live" ? "Live data" : dataSource === "mock" ? "Mock data" : "Loading…"}
            </span>
          )}
          {broadband?.spectrumServiceable === true && (
            <span className="status-chip status-chip--good">Spectrum serviceable</span>
          )}
          {broadband?.spectrumServiceable === false && !isLoading && (
            <span className="status-chip status-chip--warn">Spectrum not confirmed</span>
          )}
        </div>
      </header>

      {apiErrors.length > 0 && (
        <div className="api-error-banner">
          {apiErrors.map((e, i) => (
            <p key={i}>{e}</p>
          ))}
        </div>
      )}

      <main className="dashboard">
        <AddressSearch
          address={query}
          recentSearches={recentSearches}
          onAddressChange={setQuery}
          onSearch={() => runLookup(query)}
          onPickRecent={(value) => runLookup(value)}
        />
        <section className="dashboard-grid dashboard-grid--top">
          <LeadScoreCard lead={lead} scoreResult={scoreResult} />
          <PitchCard pitch={pitch} />
        </section>
        <section className="dashboard-grid dashboard-grid--triple">
          <PropertySnapshot property={lead.property} />
          <OwnershipCard ownership={lead.ownership} />
          <SalesHistoryCard salesHistory={lead.salesHistory} />
        </section>
        <section className="dashboard-grid dashboard-grid--bottom">
          <BroadbandCard broadband={broadband} />
          <NotesCard address={activeAddress} notes={notes} onNotesChange={handleNotesChange} />
        </section>
      </main>
    </div>
  );
}
