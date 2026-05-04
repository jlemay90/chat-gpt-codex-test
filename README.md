# Lead Intel

Lead Intel is a mock-data Vite React app for Spectrum field sales reps. Type an address, see a lead-quality dashboard, and keep notes and recent searches in localStorage.

## What it includes

- Address search
- Mock lead lookup results
- Lead score and letter grade
- Property, ownership, and sales history cards
- Recommended sales angle and generated opener
- Notes saved per address in localStorage
- Recent searches saved in localStorage

## Run locally

```bash
npm install
npm run dev
```

The dev server runs on `http://localhost:3000`.

## Verify

```bash
npm test
npm run build
```

## Deploy to Vercel

1. Import the repo into Vercel.
2. Use the Vite preset or set these values manually:
   - Build command: `npm run build`
   - Output directory: `dist`
3. Deploy.

## Deploy to Replit

1. Create a new Replit project from this GitHub repo.
2. Set the run command to `npm run dev`.
3. Make sure Replit exposes port `3000`.
4. If you want a production preview inside Replit, use `npm run preview`.

## Notes

- This v1 uses mock data only.
- No real APIs are connected yet.
