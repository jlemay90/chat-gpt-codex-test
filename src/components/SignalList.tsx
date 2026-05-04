import type { LeadIntelResult } from "../lib/types";

interface SignalListProps {
  result: LeadIntelResult | null;
}

export function SignalList({ result }: SignalListProps) {
  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-slate-950/70 p-6 shadow-2xl shadow-black/30">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.34em] text-slate-500">Signals</p>
          <h2 className="mt-2 text-lg font-semibold text-slate-50">Why this score landed where it did</h2>
        </div>
      </div>

      {!result ? (
        <p className="mt-4 text-sm text-slate-300">Run a lookup to see the strongest signals and why they matter.</p>
      ) : (
        <div className="mt-4 space-y-4">
          <div className="space-y-3">
            {result.leadScore.signalBreakdown.map((signal) => (
              <div key={signal.label} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm font-medium text-slate-100">{signal.label}</p>
                  <span
                    className={`text-sm font-semibold ${
                      signal.points >= 0 ? "text-emerald-300" : "text-rose-300"
                    }`}
                  >
                    {signal.points >= 0 ? "+" : ""}
                    {signal.points}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-300">{signal.detail}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Reasons</p>
            <ul className="mt-2 space-y-2 text-sm text-slate-200">
              {result.leadScore.reasons.map((reason) => (
                <li key={reason} className="flex items-start gap-2">
                  <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-emerald-300" />
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}
