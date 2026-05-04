interface AddressLookupProps {
  address: string;
  zip: string;
  loading: boolean;
  onAddressChange(address: string): void;
  onZipChange(zip: string): void;
  onSubmit(): void;
}

export function AddressLookup({
  address,
  zip,
  loading,
  onAddressChange,
  onZipChange,
  onSubmit,
}: AddressLookupProps) {
  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-4">
          <label htmlFor="lead-address" className="text-sm font-medium text-slate-200">
            Street address
          </label>
          <span className="text-xs uppercase tracking-[0.28em] text-slate-500">Address first</span>
        </div>
        <input
          id="lead-address"
          value={address}
          onChange={(event) => onAddressChange(event.target.value)}
          className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-base text-slate-50 outline-none transition placeholder:text-slate-500 focus:border-emerald-400/80 focus:ring-2 focus:ring-emerald-400/20"
          placeholder="123 Main St, Nashville, TN"
          autoComplete="street-address"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_160px_auto] sm:items-end">
        <div className="flex flex-col gap-2">
          <label htmlFor="lead-zip" className="text-sm font-medium text-slate-200">
            ZIP code
          </label>
          <input
            id="lead-zip"
            value={zip}
            onChange={(event) => onZipChange(event.target.value)}
            className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-base text-slate-50 outline-none transition placeholder:text-slate-500 focus:border-emerald-400/80 focus:ring-2 focus:ring-emerald-400/20"
            placeholder="37211"
            autoComplete="postal-code"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="rounded-2xl border border-emerald-400/40 bg-emerald-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:bg-emerald-400/50"
        >
          {loading ? "Looking up..." : "Run lookup"}
        </button>
      </div>
    </form>
  );
}
