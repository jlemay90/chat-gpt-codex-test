import type { LeadIntelResult } from "../lib/types";

interface SourceListProps {
  result: LeadIntelResult | null;
}

function statusTone(status: string): string {
  if (status === "success") return "text-emerald-300";
  if (status === "partial") return "text-amber-300";
  if (status === "error") return "text-rose-300";
  return "text-slate-400";
}

export function SourceList({ result }: SourceListProps) {
  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-slate-950/70 p-6 shadow-2xl shadow-black/30">
      <p className="text-xs uppercase tracking-[0.34em] text-slate-500">Sources</p>
      <h2 className="mt-2 text-lg font-semibold text-slate-50">Provider health</h2>

      {!result ? (
        <p className="mt-4 text-sm text-slate-300">Provider status appears here after the first lookup.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {result.sources.map((source) => (
            <div key={source.provider} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-100">{source.provider}</p>
                  <p className={`text-xs uppercase tracking-[0.28em] ${statusTone(source.status)}`}>{source.status}</p>
                </div>
                <div className="text-right text-xs text-slate-400">
                  <p>{source.latencyMs == null ? "n/a" : `${source.latencyMs} ms`}</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {source.fieldsReturned.length > 0 ? (
                  source.fieldsReturned.map((field) => (
                    <span key={field} className="rounded-full border border-white/10 bg-slate-900/80 px-2.5 py-1 text-xs text-slate-300">
                      {field}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-500">{source.error ?? "No fields returned"}</span>
                )}
              </div>
              {source.error ? <p className="mt-3 text-sm text-rose-200">{source.error}</p> : null}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
