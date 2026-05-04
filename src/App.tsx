import { startTransition, useEffect, useState } from "react";
import { AddressLookup } from "./components/AddressLookup";
import { LeadSummary } from "./components/LeadSummary";
import { LookupHistory } from "./components/LookupHistory";
import { NotesPanel } from "./components/NotesPanel";
import { SignalList } from "./components/SignalList";
import { SourceList } from "./components/SourceList";
import { loadHealth, loadLookupHistory, lookupLeadIntel, saveLeadState } from "./lib/api";
import type { AppHealth, LeadIntelResult, LeadStatus, LookupHistoryItem } from "./lib/types";

export function App() {
  const [health, setHealth] = useState<AppHealth | null>(null);
  const [address, setAddress] = useState("123 Main St, Nashville, TN 37211");
  const [zip, setZip] = useState("37211");
  const [result, setResult] = useState<LeadIntelResult | null>(null);
  const [history, setHistory] = useState<LookupHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<LeadStatus>("new");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const [nextHealth, nextHistory] = await Promise.all([loadHealth(), loadLookupHistory(8)]);
      if (cancelled) return;
      setHealth(nextHealth);
      setHistory(nextHistory);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!result) {
      return;
    }

    setStatus(result.userNotes.status);
    setNotes(result.userNotes.notes);
  }, [result]);

  async function handleLookup() {
    setLoading(true);
    setError(null);

    try {
      const nextResult = await lookupLeadIntel({
        address,
        zip: zip.trim() || undefined,
      });

      startTransition(() => {
        setResult(nextResult);
        setStatus(nextResult.userNotes.status);
        setNotes(nextResult.userNotes.notes);
      });

      const nextHistory = await loadLookupHistory(8);
      startTransition(() => {
        setHistory(nextHistory);
      });
    } catch (lookupError) {
      const message = lookupError instanceof Error ? lookupError.message : "Lookup failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveNotes() {
    if (!result) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const saved = await saveLeadState({
        inputAddress: result.inputAddress,
        status,
        notes,
      });

      setResult((current) =>
        current
          ? {
              ...current,
              userNotes: saved,
            }
          : current,
      );

      const nextHistory = await loadLookupHistory(8);
      setHistory(nextHistory);
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : "Save failed";
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen text-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
        <header className="mb-6 flex flex-col gap-4 border-b border-white/10 pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.38em] text-emerald-300/80">Spectrum field sales</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Lead Intel</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              Address in, score out. Move fast, keep the pitch tactical, and skip the leads that do not deserve a knock.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.28em] text-slate-300">
              {health?.mockMode ? "Mock mode" : "Live mode"}
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.28em] text-slate-400">
              {health?.databaseUrl ?? "Loading db"}
            </span>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.3fr_.9fr]">
          <div className="space-y-6">
            <section className="rounded-[1.75rem] border border-white/10 bg-slate-950/70 p-6 shadow-2xl shadow-black/30">
              <AddressLookup
                address={address}
                zip={zip}
                loading={loading}
                onAddressChange={setAddress}
                onZipChange={setZip}
                onSubmit={handleLookup}
              />
            </section>

            <LeadSummary result={result} loading={loading} error={error} />

            <div className="grid gap-6 xl:grid-cols-2">
              <SignalList result={result} />
              <SourceList result={result} />
            </div>
          </div>

          <div className="space-y-6">
            <NotesPanel
              result={result}
              status={status}
              notes={notes}
              saving={saving}
              onStatusChange={setStatus}
              onNotesChange={setNotes}
              onSave={handleSaveNotes}
            />
            <LookupHistory
              history={history}
              onSelect={(selectedAddress) => {
                setAddress(selectedAddress);
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
