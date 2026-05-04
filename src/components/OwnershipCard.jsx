export function OwnershipCard({ ownership }) {
  return (
    <section className="card">
      <div className="section-head">
        <div>
          <p className="eyebrow">Ownership / occupancy</p>
          <h2 className="section-title">Who likely owns it</h2>
        </div>
      </div>

      <div className="stacked-summary">
        <div className="fact">
          <p className="fact-label">Owner</p>
          <p className="fact-value">{ownership.ownerName}</p>
        </div>
        <div className="chip-row">
          <span className="chip">{ownership.occupancy}</span>
          <span className={`chip ${ownership.ownerOccupied ? "chip--good" : "chip--warn"}`}>
            {ownership.ownerOccupied ? "Owner occupied" : "Likely rental"}
          </span>
          <span className={`chip ${ownership.absenteeOwner ? "chip--warn" : "chip--good"}`}>
            {ownership.absenteeOwner ? "Absentee owner" : "Local decision maker"}
          </span>
        </div>
        <p className="metric-note">
          Rental likelihood: <strong>{ownership.rentalLikelihood}</strong>. Use that signal to decide whether to knock or follow up.
        </p>
      </div>
    </section>
  );
}
