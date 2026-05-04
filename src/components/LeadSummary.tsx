import type { LeadIntelResult } from "../lib/types";
import { formatAddress, formatDate, formatDecimal, formatMoney } from "../lib/format";

interface LeadSummaryProps {
  result: LeadIntelResult | null;
  loading: boolean;
  error: string | null;
}

function scoreTone(score: number): string {
  if (score >= 90) return "text-emerald-300";
  if (score >= 70) return "text-sky-300";
  if (score >= 45) return "text-amber-300";
  return "text-rose-300";
}

export function LeadSummary({ result, loading, error }: LeadSummaryProps) {
  if (!result) {
    return (
      <section className="rounded-[1.75rem] border border-white/10 bg-slate-950/70 p-6 shadow-2xl shadow-black/30">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.34em] text-slate-500">Decision surface</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-50">Run an address to see the pitch</h2>
          </div>
          <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
            {loading ? "Scoring..." : "Waiting"}
          </div>
        </div>

        <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300">
          The app will normalize the address, merge provider signals, assign a score, and show the opener that fits best.
        </p>

        {error ? (
          <div className="mt-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        ) : null}
      </section>
    );
  }

  const tone = scoreTone(result.leadScore.score);

  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-slate-950/70 p-6 shadow-2xl shadow-black/30">
      <div className="grid gap-6 lg:grid-cols-[160px_1fr] lg:items-start">
        <div className="flex flex-col items-start gap-3">
          <div className={`text-5xl font-semibold tracking-tight ${tone}`}>{result.leadScore.score}</div>
          <div className={`inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm font-semibold ${tone}`}>
            {result.leadScore.grade}
          </div>
          <p className="text-xs uppercase tracking-[0.32em] text-slate-500">{result.leadScore.confidence} confidence</p>
        </div>

        <div className="space-y-5">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.34em] text-slate-500">Lead Intel result</p>
            <h2 className="text-2xl font-semibold text-slate-50">{formatAddress(result)}</h2>
            <p className="max-w-3xl text-sm leading-6 text-slate-300">{result.recommendation.opener}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Metric label="Best angle" value={result.leadScore.bestAngle} />
            <Metric label="Action" value={result.leadScore.recommendedAction.replaceAll("_", " ")} />
            <Metric label="Value" value={formatMoney(result.property.estimatedValue)} />
            <Metric label="Rent" value={formatMoney(result.property.estimatedRent)} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Metric label="Owner" value={result.ownership.currentOwnerName ?? "Unknown"} />
            <Metric label="Type" value={result.property.propertyType ?? "Unknown"} />
            <Metric label="Last sale" value={formatDate(result.salesHistory.lastSaleDate)} />
            <Metric label="Years since sale" value={formatDecimal(result.salesHistory.yearsSinceSale)} />
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.34em] text-slate-500">What to say first</p>
            <p className="mt-2 text-base text-slate-100">{result.recommendation.followUpAngle}</p>
            <p className="mt-3 text-sm leading-6 text-slate-300">{result.recommendation.objectionPreempt}</p>
            <p className="mt-4 text-sm text-emerald-200">
              Lead with {result.recommendation.offerToLeadWith}.
            </p>
          </div>

          {error ? (
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {error}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3">
      <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-medium text-slate-50">{value}</p>
    </div>
  );
}
