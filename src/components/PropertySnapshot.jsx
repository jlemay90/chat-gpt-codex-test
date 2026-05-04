export function PropertySnapshot({ property }) {
  return (
    <section className="card">
      <div className="section-head">
        <div>
          <p className="eyebrow">Property snapshot</p>
          <h2 className="section-title">Structure at a glance</h2>
        </div>
      </div>

      <div className="facts-grid">
        <Fact label="Type" value={property.type} />
        <Fact label="Year built" value={property.yearBuilt} />
        <Fact label="Beds" value={property.beds} />
        <Fact label="Baths" value={property.baths} />
        <Fact label="Square feet" value={property.squareFeet.toLocaleString()} />
        <Fact label="Estimated value" value={`$${property.estimatedValue.toLocaleString()}`} />
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
