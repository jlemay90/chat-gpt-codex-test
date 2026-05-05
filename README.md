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
npm run api:start
```

API health check while running locally:

```bash
curl http://localhost:8787/api/health
```

## Deploy to Azure (Primary)

Azure deploy is split across two workflows:
- Frontend: `.github/workflows/deploy-azure-swa.yml` (Static Web Apps)
- API: `.github/workflows/deploy-azure-api.yml` (App Service)

Use this runbook for resource creation + OIDC + GitHub secrets/vars:
- `docs/azure-launch-runbook.md`

Required GitHub **secrets**:
- `AZURE_CLIENT_ID`
- `AZURE_TENANT_ID`
- `AZURE_SUBSCRIPTION_ID`

Required GitHub **variables**:
- `AZURE_RESOURCE_GROUP`
- `AZURE_WEBAPP_NAME`
- `AZURE_STATIC_WEBAPP_NAME`

Push to `main` after secrets/vars are configured.

## Deploy to GitHub Pages (Backup)

This repo keeps GitHub Pages as a free backup deployment:
- Workflow: `.github/workflows/deploy-pages.yml`
- URL: `https://jlemay90.github.io/chat-gpt-codex-test/`

The Pages build uses `npm run build:pages`, which applies base path `/chat-gpt-codex-test/`.

## Notes

- This v1 uses mock data only.
- No real APIs are connected yet.
