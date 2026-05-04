import { useState } from "react";
import { AddressSearch } from "./components/AddressSearch";
import { LeadScoreCard } from "./components/LeadScoreCard";
import { NotesCard } from "./components/NotesCard";
import { OwnershipCard } from "./components/OwnershipCard";
import { PitchCard } from "./components/PitchCard";
import { PropertySnapshot } from "./components/PropertySnapshot";
import { SalesHistoryCard } from "./components/SalesHistoryCard";
import { generatePitch } from "./lib/generatePitch";
import { resolveMockLead } from "./data/mockLead";
import { loadNotes, loadRecentSearches, saveNotes, saveRecentSearch } from "./lib/storage";
import { scoreLead } from "./lib/scoreLead";

const DEFAULT_ADDRESS = "123 Main St, Nashville, TN 37211";
const DEFAULT_LEAD = resolveMockLead(DEFAULT_ADDRESS);
const DEFAULT_SCORE = scoreLead(DEFAULT_LEAD);
const DEFAULT_PITCH = generatePitch(DEFAULT_LEAD, DEFAULT_SCORE);

export function App() {
  const [query, setQuery] = useState(DEFAULT_ADDRESS);
  const [recentSearches, setRecentSearches] = useState(() => loadRecentSearches());
  const [activeAddress, setActiveAddress] = useState(DEFAULT_ADDRESS);
  const [lead, setLead] = useState(() => DEFAULT_LEAD);
  const [scoreResult, setScoreResult] = useState(() => DEFAULT_SCORE);
  const [pitch, setPitch] = useState(() => DEFAULT_PITCH);
  const [notes, setNotes] = useState(() => loadNotes(DEFAULT_ADDRESS));

  function runLookup(address) {
    const nextAddress = String(address ?? "").trim();
    if (!nextAddress) {
      return;
    }

    const nextLead = resolveMockLead(nextAddress);
    const nextScore = scoreLead(nextLead);
    const nextPitch = generatePitch(nextLead, nextScore);

    setQuery(nextAddress);
    setActiveAddress(nextAddress);
    setLead(nextLead);
    setScoreResult(nextScore);
    setPitch(nextPitch);

    const nextNotes = loadNotes(nextAddress);
    setNotes(nextNotes);

    const nextRecentSearches = saveRecentSearch(nextAddress);
    setRecentSearches(nextRecentSearches);
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
            Mock-data dashboard for field reps. Type an address, see if it is worth knocking, and keep your notes local.
          </p>
        </div>
        <div className="topbar-badges">
          <span className="status-chip">V1 mock mode</span>
          <span className="status-chip status-chip--soft">No APIs connected</span>
        </div>
      </header>

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
          <NotesCard address={activeAddress} notes={notes} onNotesChange={handleNotesChange} />
        </section>
      </main>
    </div>
  );
}
