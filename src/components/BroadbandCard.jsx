export function BroadbandCard({ broadband }) {
  if (!broadband) {
    return (
      <section className="card">
        <div className="section-head">
          <div>
            <p className="eyebrow">Broadband availability</p>
            <h2 className="section-title">ISP coverage at this address</h2>
          </div>
          <span className="status-chip">Loading…</span>
        </div>
      </section>
    );
  }

  return (
    <section className="card card--wide">
      <div className="section-head">
        <div>
          <p className="eyebrow">Broadband availability</p>
          <h2 className="section-title">ISP coverage at this address</h2>
        </div>
        <span className={`status-chip ${broadband.spectrumServiceable ? "status-chip--good" : "status-chip--warn"}`}>
          {broadband.spectrumServiceable ? "Spectrum serviceable" : "Spectrum not found"}
        </span>
      </div>

      <p className="metric-note" style={{ marginBottom: "12px" }}>{broadband.summary}</p>

      {broadband.providers && broadband.providers.length > 0 ? (
        <div className="broadband-table">
          <div className="broadband-row broadband-row--header">
            <span>Provider</span>
            <span>Technology</span>
            <span>Down</span>
            <span>Up</span>
          </div>
          {broadband.providers.map((p, i) => (
            <div
              key={i}
              className={`broadband-row ${p.isSpectrum ? "broadband-row--spectrum" : ""}`}
            >
              <span className="broadband-name">{p.name}</span>
              <span>{p.technology}</span>
              <span>{p.downloadMbps} Mbps</span>
              <span>{p.uploadMbps} Mbps</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="metric-note">No ISP data available for this address.</p>
      )}

      {!broadband.spectrumServiceable && broadband.providers.length > 0 && (
        <p className="metric-note" style={{ marginTop: "10px", color: "var(--danger)" }}>
          Spectrum is not listed at this address. Verify serviceability before knocking.
        </p>
      )}
    </section>
  );
}
