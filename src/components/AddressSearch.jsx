export function AddressSearch({
  address,
  recentSearches,
  onAddressChange,
  onSearch,
  onPickRecent,
}) {
  return (
    <section className="card card--hero">
      <div className="section-head">
        <div>
          <p className="eyebrow">Mock lookup</p>
          <h2 className="section-title">Score an address in seconds</h2>
        </div>
        <span className="status-chip">Mock data only</span>
      </div>

      <form
        className="search-form"
        onSubmit={(event) => {
          event.preventDefault();
          onSearch();
        }}
      >
        <label className="field-label" htmlFor="address-input">
          Address
        </label>
        <div className="search-row">
          <input
            id="address-input"
            className="text-input text-input--large"
            value={address}
            onChange={(event) => onAddressChange(event.target.value)}
            placeholder="123 Main St, Nashville, TN 37211"
            autoComplete="street-address"
          />
          <button className="primary-button" type="submit">
            Score address
          </button>
        </div>
      </form>

      <div className="helper-row">
        <p className="helper-copy">
          Field-sales ready, mobile-first, and saved locally. No APIs connected yet.
        </p>
      </div>

      <div className="recent-searches">
        <div className="recent-head">
          <p className="recent-label">Recent searches</p>
          <p className="recent-note">Saved in localStorage</p>
        </div>
        <div className="chip-list">
          {recentSearches.length === 0 ? (
            <span className="muted-copy">No recent searches yet.</span>
          ) : (
            recentSearches.map((item) => (
              <button
                type="button"
                key={`${item.address}-${item.savedAt ?? "saved"}`}
                className="chip chip--interactive"
                onClick={() => onPickRecent(item.address)}
              >
                {item.address}
              </button>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
