# Azure Launch Runbook (Lead Intel)

This runbook deploys Lead Intel to Azure with:
- Frontend: Azure Static Web Apps (Free)
- API: Azure App Service Linux (Free F1)
- Auth: GitHub Actions OIDC (no long-lived deploy secret)

## 1) Prerequisites

- Install Git and Azure CLI on your machine.
- Rotate any exposed third-party API keys before wiring real providers.
- Ensure the GitHub repo exists: `jlemay90/chat-gpt-codex-test`.

## 2) Fixed Resource Defaults

- Resource group: `rg-lead-intel-eastus`
- Static Web App: `lead-intel-web-jlemay90`
- App Service plan: `asp-lead-intel-f1-eastus`
- Web App API: `lead-intel-api-jlemay90-<unique>`
- Region: `eastus` (if Static Web Apps region is unavailable in your subscription, use `eastus2`)

## 3) Create Azure Resources

```bash
az login

az group create \
  --name rg-lead-intel-eastus \
  --location eastus

az appservice plan create \
  --resource-group rg-lead-intel-eastus \
  --name asp-lead-intel-f1-eastus \
  --is-linux \
  --sku F1

az webapp create \
  --resource-group rg-lead-intel-eastus \
  --plan asp-lead-intel-f1-eastus \
  --name lead-intel-api-jlemay90-<unique> \
  --runtime "NODE|20-lts"

az webapp config appsettings set \
  --resource-group rg-lead-intel-eastus \
  --name lead-intel-api-jlemay90-<unique> \
  --settings \
    LEAD_INTEL_MOCK_MODE=true \
    DATABASE_URL=sqlite:///home/site/wwwroot/data/lead_intel.db \
    SCM_DO_BUILD_DURING_DEPLOYMENT=true \
    ENABLE_ORYX_BUILD=true

az staticwebapp create \
  --name lead-intel-web-jlemay90 \
  --resource-group rg-lead-intel-eastus \
  --location eastus \
  --sku Free
```

## 4) Create OIDC App Registration for GitHub Actions

```bash
APP_NAME=lead-intel-gha-oidc
RG_SCOPE=$(az group show --name rg-lead-intel-eastus --query id -o tsv)

APP_CLIENT_ID=$(az ad app create --display-name "$APP_NAME" --query appId -o tsv)
APP_OBJECT_ID=$(az ad app list --display-name "$APP_NAME" --query "[0].id" -o tsv)

SP_OBJECT_ID=$(az ad sp create --id "$APP_CLIENT_ID" --query id -o tsv)

az role assignment create \
  --assignee-object-id "$SP_OBJECT_ID" \
  --assignee-principal-type ServicePrincipal \
  --role Contributor \
  --scope "$RG_SCOPE"
```

Create federated credentials (one for each Azure workflow):

`federated-api-main.json`
```json
{
  "name": "gh-main-deploy-azure-api",
  "issuer": "https://token.actions.githubusercontent.com",
  "subject": "repo:jlemay90/chat-gpt-codex-test:ref:refs/heads/main",
  "description": "GitHub Actions OIDC for Azure API deploy",
  "audiences": ["api://AzureADTokenExchange"]
}
```

`federated-swa-main.json`
```json
{
  "name": "gh-main-deploy-azure-swa",
  "issuer": "https://token.actions.githubusercontent.com",
  "subject": "repo:jlemay90/chat-gpt-codex-test:ref:refs/heads/main",
  "description": "GitHub Actions OIDC for Azure SWA deploy",
  "audiences": ["api://AzureADTokenExchange"]
}
```

```bash
az ad app federated-credential create --id "$APP_OBJECT_ID" --parameters federated-api-main.json
az ad app federated-credential create --id "$APP_OBJECT_ID" --parameters federated-swa-main.json
```

## 5) Configure GitHub Repository Secrets and Variables

Add these **Secrets** in GitHub (`Settings -> Secrets and variables -> Actions`):
- `AZURE_CLIENT_ID` = app client ID (`$APP_CLIENT_ID`)
- `AZURE_TENANT_ID` = your tenant ID (`az account show --query tenantId -o tsv`)
- `AZURE_SUBSCRIPTION_ID` = your subscription ID (`az account show --query id -o tsv`)

Add these **Repository Variables**:
- `AZURE_RESOURCE_GROUP` = `rg-lead-intel-eastus`
- `AZURE_WEBAPP_NAME` = `lead-intel-api-jlemay90-<unique>`
- `AZURE_STATIC_WEBAPP_NAME` = `lead-intel-web-jlemay90`

## 6) Deploy

Push to `main`. Three workflows should run:
- `Deploy to GitHub Pages`
- `Deploy Azure Frontend (Static Web Apps)`
- `Deploy Azure API (App Service)`

## 7) Verify

- Frontend (Azure SWA): open the SWA URL from Azure portal.
- API health:
  - `https://<your-api-name>.azurewebsites.net/api/health`
  - Expected: `{ "ok": true, "mockMode": true, ... }`
- Backup frontend (GitHub Pages):
  - `https://jlemay90.github.io/chat-gpt-codex-test/`
