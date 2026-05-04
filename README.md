# Lead Intel MVP

Address-first lead intelligence for Spectrum field sales.

## What it does

- Enter an address and get a lead score, best angle, opener, and source health.
- Works in mock mode without paid provider keys.
- Saves notes and status in SQLite.

## Stack

- Vite
- React
- TypeScript
- Tailwind CSS
- Express
- SQLite

## Setup

```bash
pnpm install
pnpm dev
```

## Verification

```bash
pnpm test
pnpm typecheck
pnpm build
```

## Environment

Copy `.env.example` to `.env` and set the provider keys you want to use.

The app defaults to mock mode when live keys are missing, so it still runs without paid APIs.
