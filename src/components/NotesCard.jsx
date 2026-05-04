export function NotesCard({ address, notes, onNotesChange }) {
  return (
    <section className="card card--wide">
      <div className="section-head">
        <div>
          <p className="eyebrow">Notes</p>
          <h2 className="section-title">Saved locally for this address</h2>
        </div>
        <span className="status-chip">localStorage</span>
      </div>

      <label className="field-label" htmlFor="notes-input">
        Notes for {address}
      </label>
      <textarea
        id="notes-input"
        className="notes-input"
        rows={7}
        value={notes}
        onChange={(event) => onNotesChange(event.target.value)}
        placeholder="Call after 6 PM. Interested in speed and mobile bundle."
      />
      <p className="helper-copy">
        These notes are saved under the address you searched, so you can come back later and keep working fast.
      </p>
    </section>
  );
}
