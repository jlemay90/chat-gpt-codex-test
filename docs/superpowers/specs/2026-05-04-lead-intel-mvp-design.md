# Lead Intel MVP Design

**Goal:** Build an address-first lead intelligence app for Spectrum field sales that normalizes an address, gathers property and ownership signals from provider adapters, computes a transparent lead score, and returns a tactical pitch with notes and status support.

**Architecture:** A single Express API exposes `POST /api/lookup` and a small set of lead note endpoints. The API fans out to provider adapters for Geocodio, RentCast, RapidAPI property ownership, and optional RapidAPI real-estate enrichment, then merges partial results into one normalized `LeadIntelResult`. The React frontend is a field-sales workspace, not a CRM, and focuses on fast address entry, score explanation, opener guidance, source visibility, and local note history. SQLite stores the latest lead state plus lookup history.

**Out of scope for v1:** maps, route optimization, automated texting, and generic CRM pipeline management.

## Core Flow

1. Rep enters a street address and optional ZIP code.
2. The backend normalizes and geocodes the address.
3. The backend calls property, ownership, rental, and optional area/listing adapters.
4. The backend computes a confidence-weighted score and grade with transparent reasons.
5. The frontend shows the score, best angle, opener, supporting facts, and source health.
6. The rep saves notes and status for follow-up.

## Key Building Blocks

- `shared/leadIntel.ts` defines the result schema and reusable types.
- `server/adapters/*` contains one adapter per provider plus a mock adapter for offline mode.
- `server/scoring/*` computes the 0-100 score and human-readable reasons.
- `server/db.ts` wraps SQLite persistence for notes, status, and lookup history.
- `src/*` renders the tactical field-sales interface and consumes the API.

## Error Handling

Provider failures never crash a lookup. Each provider returns source metadata with `success`, `partial`, `error`, or `skipped` status, plus latency and field coverage. If paid keys are missing, the app falls back to mock mode and still returns a complete demo result.

## Testing Strategy

- Unit tests for scoring bands, signal reasons, and adapter normalization.
- Integration test for `POST /api/lookup` to verify provider fan-out and graceful degradation.
- Persistence test for save/update behavior on notes and status.
- Frontend smoke test for address lookup, score display, and notes panel rendering.
