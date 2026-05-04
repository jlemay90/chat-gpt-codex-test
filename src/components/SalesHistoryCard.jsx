export function SalesHistoryCard({ salesHistory }) {
  return (
    <section className="card">
      <div className="section-head">
        <div>
          <p className="eyebrow">Sales history</p>
          <h2 className="section-title">Recent transaction context</h2>
        </div>
      </div>

      <div className="stacked-summary">
        <div className="fact">
          <p className="fact-label">Recent sale date</p>
          <p className="fact-value">{formatDate(salesHistory.recentSaleDate)}</p>
        </div>
        <div className="facts-grid facts-grid--compact">
          <Fact label="Years since sale" value={salesHistory.yearsSinceSale.toFixed(1)} />
          <Fact label="Last sale price" value={`$${salesHistory.lastSalePrice.toLocaleString()}`} />
        </div>
        <div className="fact">
          <p className="fact-label">Previous owner</p>
          <p className="fact-value">{salesHistory.previousOwnerName}</p>
        </div>
      </div>
    </section>
  );
}

function Fact({ label, value }) {
  return (
    <div className="fact">
      <p className="fact-label">{label}</p>
      <p className="fact-value">{value}</p>
    </div>
  );
}

function formatDate(value) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
}
