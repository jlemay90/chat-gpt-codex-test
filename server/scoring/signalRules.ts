export interface ScoreInput {
  recentSale: boolean;
  ownerOccupied: boolean;
  singleFamily: boolean;
  spectrumServiceable: boolean;
  gigAvailable: boolean;
  mobileBundleFit: boolean;
  rental: boolean;
  llcOrTrust: boolean;
  lowConfidence: boolean;
  knownUpgradeArea?: boolean;
}

export interface SignalRule {
  key: keyof ScoreInput;
  points: number;
  label: string;
  detail: string;
}

export const SIGNAL_RULES: SignalRule[] = [
  { key: "recentSale", points: 20, label: "Recent Mover", detail: "Bought or moved in within the last 24 months." },
  { key: "ownerOccupied", points: 15, label: "Likely Owner Occupied", detail: "Mailing address and ownership pattern point to an owner-occupied home." },
  { key: "singleFamily", points: 10, label: "Single-Family Home", detail: "Residential single-family homes are a strong Spectrum fit." },
  { key: "spectrumServiceable", points: 20, label: "Spectrum Serviceable", detail: "Address appears serviceable for Spectrum." },
  { key: "gigAvailable", points: 10, label: "Gig Available", detail: "Higher-speed service is available or likely nearby." },
  { key: "mobileBundleFit", points: 10, label: "Mobile Bundle Fit", detail: "The home is a good candidate for bundled mobile plus internet." },
  { key: "knownUpgradeArea", points: 20, label: "Known Upgrade Area", detail: "Nearby market activity suggests a strong upgrade pitch." },
  { key: "rental", points: -5, label: "Likely Rental", detail: "Rental properties tend to need a different pitch." },
  { key: "llcOrTrust", points: -8, label: "LLC/Trust Owner", detail: "Entity ownership usually needs a more cautious approach." },
  { key: "lowConfidence", points: -10, label: "Low Confidence Data", detail: "The lookup is missing enough source coverage to trust the score fully." },
];

