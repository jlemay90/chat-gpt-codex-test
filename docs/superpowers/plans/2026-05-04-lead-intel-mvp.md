# Lead Intel MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an address-first lead intelligence app that normalizes an address, merges provider data into one `LeadIntelResult`, computes a transparent lead score, and presents a tactical field-sales UI with mock mode and saved notes.

**Architecture:** One Express backend handles lookup orchestration, provider adapters, scoring, and SQLite persistence. One React + Vite frontend consumes the API and focuses on a compact sales workspace with score, opener, evidence, sources, notes, and lookup history. Shared types live in a small `shared` module so the server and client agree on the shape of `LeadIntelResult`.

**Tech Stack:** Node.js, TypeScript, React, Vite, Tailwind CSS, Express, SQLite, Vitest.

---

## File Map

- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `vite.config.ts`
- Create: `tailwind.config.ts`
- Create: `postcss.config.cjs`
- Create: `index.html`
- Create: `.env.example`
- Create: `shared/leadIntel.ts`
- Create: `server/app.ts`
- Create: `server/index.ts`
- Create: `server/env.ts`
- Create: `server/db.ts`
- Create: `server/fixtures/mockLeadIntel.ts`
- Create: `server/types.ts`
- Create: `server/adapters/index.ts`
- Create: `server/adapters/geocodio.ts`
- Create: `server/adapters/rentcast.ts`
- Create: `server/adapters/rapidapiOwnership.ts`
- Create: `server/adapters/rapidapiRealEstate.ts`
- Create: `server/adapters/mock.ts`
- Create: `server/scoring/scoreLead.ts`
- Create: `server/scoring/signalRules.ts`
- Create: `server/routes/lookup.ts`
- Create: `server/routes/leads.ts`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/styles.css`
- Create: `src/lib/api.ts`
- Create: `src/lib/format.ts`
- Create: `src/lib/types.ts`
- Create: `src/components/AddressLookup.tsx`
- Create: `src/components/LeadSummary.tsx`
- Create: `src/components/SignalList.tsx`
- Create: `src/components/SourceList.tsx`
- Create: `src/components/NotesPanel.tsx`
- Create: `src/components/LookupHistory.tsx`
- Create: `tests/scoreLead.test.ts`
- Create: `tests/adapters.test.ts`
- Create: `tests/lookupRoute.test.ts`
- Create: `tests/persistence.test.ts`
- Create: `src/__tests__/App.test.tsx`

---

### Task 1: Define the shared result model and score helper contract

**Files:**
- Create: `shared/leadIntel.ts`
- Create: `server/types.ts`
- Test: `tests/scoreLead.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { scoreLead } from "../server/scoring/scoreLead";

describe("scoreLead", () => {
  it("returns an A+ score for a recent owner-occupied single-family serviceable home", () => {
    const result = scoreLead({
      recentSale: true,
      ownerOccupied: true,
      singleFamily: true,
      spectrumServiceable: true,
      gigAvailable: true,
      mobileBundleFit: true,
      rental: false,
      llcOrTrust: false,
      lowConfidence: false,
    });

    expect(result.score).toBeGreaterThanOrEqual(90);
    expect(result.grade).toBe("A+");
    expect(result.bestAngle).toContain("upgrade");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm vitest tests/scoreLead.test.ts -v`
Expected: FAIL because `scoreLead` does not exist yet.

- [ ] **Step 3: Write minimal implementation**

```ts
export function scoreLead(input: ScoreInput): ScoreResult {
  return {
    score: 95,
    grade: "A+",
    bestAngle: "Speed upgrade pitch",
    recommendedAction: "knock",
    reasons: [],
  };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm vitest tests/scoreLead.test.ts -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add shared/leadIntel.ts server/types.ts server/scoring/scoreLead.ts tests/scoreLead.test.ts
git commit -m "feat: define lead intel scoring contract"
```

---

### Task 2: Implement transparent scoring and signal labeling

**Files:**
- Create: `server/scoring/signalRules.ts`
- Modify: `server/scoring/scoreLead.ts`
- Test: `tests/scoreLead.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
it("downgrades low-confidence rental leads and explains why", () => {
  const result = scoreLead({
    recentSale: false,
    ownerOccupied: false,
    singleFamily: false,
    spectrumServiceable: true,
    gigAvailable: false,
    mobileBundleFit: false,
    rental: true,
    llcOrTrust: true,
    lowConfidence: true,
  });

  expect(result.score).toBeLessThan(50);
  expect(result.grade).toBe("Skip");
  expect(result.reasons.join(" ")).toContain("low confidence");
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm vitest tests/scoreLead.test.ts -v`
Expected: FAIL because the score logic still returns the placeholder result.

- [ ] **Step 3: Write minimal implementation**

```ts
const SIGNALS = [
  { key: "recentSale", points: 20, label: "Recent Mover" },
  { key: "ownerOccupied", points: 15, label: "Likely Owner Occupied" },
  { key: "singleFamily", points: 10, label: "Single-Family Home" },
  { key: "spectrumServiceable", points: 20, label: "Spectrum Serviceable" },
  { key: "gigAvailable", points: 10, label: "Gig Available" },
  { key: "mobileBundleFit", points: 10, label: "Mobile Bundle Fit" },
  { key: "rental", points: -5, label: "Likely Rental" },
  { key: "llcOrTrust", points: -8, label: "LLC/Trust Owner" },
  { key: "lowConfidence", points: -10, label: "Low Confidence Data" },
];
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm vitest tests/scoreLead.test.ts -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add server/scoring/signalRules.ts server/scoring/scoreLead.ts tests/scoreLead.test.ts
git commit -m "feat: add transparent lead scoring"
```

---

### Task 3: Build the provider adapter layer with mock mode

**Files:**
- Create: `server/adapters/index.ts`
- Create: `server/adapters/geocodio.ts`
- Create: `server/adapters/rentcast.ts`
- Create: `server/adapters/rapidapiOwnership.ts`
- Create: `server/adapters/rapidapiRealEstate.ts`
- Create: `server/adapters/mock.ts`
- Create: `server/fixtures/mockLeadIntel.ts`
- Test: `tests/adapters.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { buildMockLeadIntel } from "../server/adapters/mock";

describe("mock adapter", () => {
  it("returns a complete lead intel payload for demo mode", () => {
    const result = buildMockLeadIntel("123 Main St, Nashville, TN 37211");

    expect(result.normalizedAddress.city).toBeTruthy();
    expect(result.leadScore.score).toBeGreaterThanOrEqual(0);
    expect(result.sources.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm vitest tests/adapters.test.ts -v`
Expected: FAIL because the mock adapter is not implemented yet.

- [ ] **Step 3: Write minimal implementation**

```ts
export function buildMockLeadIntel(inputAddress: string): LeadIntelResult {
  return {
    inputAddress,
    normalizedAddress: {
      line1: "123 Main St",
      city: "Nashville",
      state: "TN",
      zip: "37211",
      county: "Davidson",
      lat: 36.1,
      lng: -86.7,
      confidence: "high",
    },
    // ...stable demo values for property, ownership, history, broadband, recommendation, sources, and notes
  };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm vitest tests/adapters.test.ts -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add server/adapters server/fixtures/mockLeadIntel.ts tests/adapters.test.ts
git commit -m "feat: add mock provider adapters"
```

---

### Task 4: Implement the lookup API and provider fan-out

**Files:**
- Create: `server/app.ts`
- Create: `server/index.ts`
- Create: `server/routes/lookup.ts`
- Create: `server/env.ts`
- Test: `tests/lookupRoute.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../server/app";

describe("POST /api/lookup", () => {
  it("returns a lead intel result in mock mode", async () => {
    const app = createApp({ mockMode: true });
    const response = await request(app)
      .post("/api/lookup")
      .send({ address: "123 Main St, Nashville, TN 37211" });

    expect(response.status).toBe(200);
    expect(response.body.leadScore.score).toBeDefined();
    expect(response.body.sources.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm vitest tests/lookupRoute.test.ts -v`
Expected: FAIL because the Express app and route are not wired yet.

- [ ] **Step 3: Write minimal implementation**

```ts
app.post("/api/lookup", async (req, res) => {
  const result = await lookupLeadIntel(req.body.address);
  res.json(result);
});
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm vitest tests/lookupRoute.test.ts -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add server/app.ts server/index.ts server/routes/lookup.ts server/env.ts tests/lookupRoute.test.ts
git commit -m "feat: add lead lookup api"
```

---

### Task 5: Add SQLite persistence for notes, status, and history

**Files:**
- Create: `server/db.ts`
- Create: `server/routes/leads.ts`
- Test: `tests/persistence.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { createLeadStore } from "../server/db";

describe("lead store", () => {
  it("saves and reloads notes for an address", async () => {
    const store = createLeadStore(":memory:");
    await store.saveLeadState({
      inputAddress: "123 Main St, Nashville, TN 37211",
      status: "follow_up",
      notes: "Call after 6 PM",
    });

    const loaded = await store.getLeadState("123 Main St, Nashville, TN 37211");
    expect(loaded?.notes).toContain("Call after 6 PM");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm vitest tests/persistence.test.ts -v`
Expected: FAIL because the SQLite store does not exist yet.

- [ ] **Step 3: Write minimal implementation**

```ts
export function createLeadStore(dbPath: string) {
  return {
    saveLeadState: async (state) => {
      // insert or update by normalized address key
    },
    getLeadState: async (address) => {
      // return current row or null
    },
  };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm vitest tests/persistence.test.ts -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add server/db.ts server/routes/leads.ts tests/persistence.test.ts
git commit -m "feat: persist lead notes and status"
```

---

### Task 6: Build the tactical sales UI and local history workspace

**Files:**
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/styles.css`
- Create: `src/lib/api.ts`
- Create: `src/lib/format.ts`
- Create: `src/lib/types.ts`
- Create: `src/components/AddressLookup.tsx`
- Create: `src/components/LeadSummary.tsx`
- Create: `src/components/SignalList.tsx`
- Create: `src/components/SourceList.tsx`
- Create: `src/components/NotesPanel.tsx`
- Create: `src/components/LookupHistory.tsx`
- Test: `src/__tests__/App.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { render, screen } from "@testing-library/react";
import { App } from "../App";

test("shows the address lookup workspace and notes panel", () => {
  render(<App />);
  expect(screen.getByText(/lead intel/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/address/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm vitest src/__tests__/App.test.tsx -v`
Expected: FAIL because the UI is not built yet.

- [ ] **Step 3: Write minimal implementation**

```tsx
export function App() {
  return (
    <main>
      <h1>Lead Intel</h1>
      <AddressLookup />
      <LeadSummary />
      <NotesPanel />
    </main>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm vitest src/__tests__/App.test.tsx -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src tests src/App.tsx src/main.tsx src/styles.css
git commit -m "feat: build tactical lead sales ui"
```

---

### Task 7: Add environment samples, mock defaults, and smoke verification

**Files:**
- Create: `.env.example`
- Create: `README.md`
- Modify: `package.json`

- [ ] **Step 1: Write the failing test**

```ts
import { expect, it } from "vitest";
import { loadLeadIntelEnv } from "../server/env";

it("defaults to mock mode when no provider keys are set", () => {
  const env = loadLeadIntelEnv({});
  expect(env.mockMode).toBe(true);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm vitest tests/env.test.ts -v`
Expected: FAIL because environment parsing is not implemented yet.

- [ ] **Step 3: Write minimal implementation**

```ts
export function loadLeadIntelEnv(raw: NodeJS.ProcessEnv) {
  return {
    mockMode: !raw.GEOCODIO_API_KEY && !raw.RENTCAST_API_KEY && !raw.RAPIDAPI_KEY,
  };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm vitest tests/env.test.ts -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add .env.example README.md package.json server/env.ts tests/env.test.ts
git commit -m "chore: add env samples and mock defaults"
```

---

## Self-Review Checklist

- Every spec item is covered by a task: address lookup, mock mode, scoring, adapter layer, notes/status, transparent sources, server-only keys, and tactical UI.
- No task introduces maps, route optimization, or automated texting.
- All file paths are exact and scoped to a single responsibility.
- Test-first sequencing is preserved for each behavior.
- The plan keeps CRM scope intentionally narrow.
