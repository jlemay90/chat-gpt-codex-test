import type { LeadIntelResult, LeadStatus } from "../lib/types";

interface NotesPanelProps {
  result: LeadIntelResult | null;
  status: LeadStatus;
  notes: string;
  saving: boolean;
  onStatusChange(status: LeadStatus): void;
  onNotesChange(notes: string): void;
  onSave(): void;
}

const STATUS_OPTIONS: Array<{ value: LeadStatus; label: string }> = [
  { value: "new", label: "New" },
  { value: "knocked", label: "Knocked" },
  { value: "not_home", label: "Not home" },
  { value: "interested", label: "Interested" },
  { value: "follow_up", label: "Follow up" },
  { value: "sold", label: "Sold" },
  { value: "skip", label: "Skip" },
];

export function NotesPanel({
  result,
  status,
  notes,
  saving,
  onStatusChange,
  onNotesChange,
  onSave,
}: NotesPanelProps) {
  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-slate-950/70 p-6 shadow-2xl shadow-black/30">
      <p className="text-xs uppercase tracking-[0.34em] text-slate-500">Notes</p>
      <h2 className="mt-2 text-lg font-semibold text-slate-50">Field follow-up</h2>

      {!result ? (
        <p className="mt-4 text-sm text-slate-300">Run a lookup before saving notes or status.</p>
      ) : (
        <div className="mt-4 space-y-4">
          <div className="space-y-2">
            <label htmlFor="lead-status" className="text-sm font-medium text-slate-200">
              Status
            </label>
            <select
              id="lead-status"
              value={status}
              onChange={(event) => onStatusChange(event.target.value as LeadStatus)}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-slate-50 outline-none transition focus:border-emerald-400/80 focus:ring-2 focus:ring-emerald-400/20"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="lead-notes" className="text-sm font-medium text-slate-200">
              Notes
            </label>
            <textarea
              id="lead-notes"
              value={notes}
              onChange={(event) => onNotesChange(event.target.value)}
              rows={8}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-slate-50 outline-none transition placeholder:text-slate-500 focus:border-emerald-400/80 focus:ring-2 focus:ring-emerald-400/20"
              placeholder="Knocked at 6:10 PM. Interested in faster speeds and a mobile bundle."
            />
          </div>

          <div className="flex items-center justify-between gap-4">
            <p className="text-xs uppercase tracking-[0.28em] text-slate-500">
              {result.userNotes.lastTouchedAt ? `Last touched ${result.userNotes.lastTouchedAt}` : "No prior touch"}
            </p>
            <button
              type="button"
              onClick={onSave}
              disabled={saving}
              className="rounded-2xl border border-emerald-400/40 bg-emerald-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:bg-emerald-400/50"
            >
              {saving ? "Saving..." : "Save notes"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
