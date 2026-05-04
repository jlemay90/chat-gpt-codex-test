import type { LookupHistoryItem } from "../lib/types";
import { formatHistoryAddress } from "../lib/format";

interface LookupHistoryProps {
  history: LookupHistoryItem[];
  onSelect(address: string): void;
}

function scoreTone(score: number | null): string {
  if (score == null) return "text-slate-400";
  if (score >= 90) return "text-emerald-300";
  if (score >= 70) return "text-sky-300";
  if (score >= 45) return "text-amber-300";
  return "text-rose-300";
}

export function LookupHistory({ history, onSelect }: LookupHistoryProps) {
  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-slate-950/70 p-6 shadow-2xl shadow-black/30">
      <p className="text-xs uppercase tracking-[0.34em] text-slate-500">History</p>
      <h2 className="mt-2 text-lg font-semibold text-slate-50">Recent lookups</h2>

      {history.length === 0 ? (
        <p className="mt-4 text-sm text-slate-300">No lookups yet.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {history.map((item) => (
            <button
              key={`${item.inputAddress}-${item.lookedUpAt}`}
              type="button"
              onClick={() => onSelect(item.inputAddress)}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left transition hover:border-emerald-400/40 hover:bg-white/10"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-100">{formatHistoryAddress(item)}</p>
                  <p className="text-xs uppercase tracking-[0.28em] text-slate-500">{item.lookedUpAt}</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-semibold ${scoreTone(item.score)}`}>{item.score == null ? "n/a" : item.score}</p>
                  <p className={`text-xs uppercase tracking-[0.24em] ${scoreTone(item.score)}`}>{item.grade ?? "n/a"}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
