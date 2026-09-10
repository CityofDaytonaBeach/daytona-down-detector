# Daytona Down Detector

Daytona Down Detector is a JSON-backed outage detection API and JavaScript SDK for monitoring technology platforms, civic-tech vendors, and government websites.

Created for the City of Daytona.

Lead Developer: Daniel Gurczynski

GitHub repository: `CityofDaytonaBeach/daytona-down-detector`

## What It Does

- Monitors major technical companies, civic-tech platforms, and government website services.
- Starts with 25,000 records, including Microsoft, CivicPlus, iCompass, IMS, InvGate, Jotform, and generated city/county/state government-style sites.
- Uses JSON files only. No database, no SQL tables, and no external storage setup required.
- Accepts public issue reports for monitored sites and services.
- Scores outages using recent reports, active incidents, and optional live HTTP probes.
- Includes a JavaScript SDK that can be loaded from jsDelivr in React, HTML, Node, Next.js, Vite, or any JavaScript app.

## Requirements

- Node.js 18+
- A deployed API server for production use
- No database required

## Free GitHub Pages Site

This repo includes a free static dashboard for GitHub Pages:

```text
index.html
```

After uploading this repo to GitHub and enabling Pages, the site URL will be:

```text
https://CityofDaytonaBeach.github.io/daytona-down-detector/
```

How to enable it:

1. Upload or push this repo to `CityofDaytonaBeach/daytona-down-detector`.
2. Go to GitHub repo `Settings`.
3. Open `Pages`.
4. Set source to `Deploy from a branch`.
5. Select branch `main` and folder `/root`.
6. Save.

The GitHub Pages version works two ways:

- Static demo mode: free, no server required, reads `data/companies.json`, shows 100 searchable status cards as operational demo data.
- Live API mode: add `?api=https://your-api-domain.com` to use a deployed Daytona Down Detector API through the jsDelivr SDK.

Example live API URL:

```text
https://CityofDaytonaBeach.github.io/daytona-down-detector/?api=https://your-api-domain.com
```

## Quick Start

```bash
npm run seed
npm start
```

The API runs locally at:

```text
http://localhost:3000
```

Use a different port:

```bash
PORT=4000 npm start
```

PowerShell:

```powershell
$env:PORT = "4000"; npm start
```

## Important Deployment Note

jsDelivr hosts the SDK JavaScript file only. Your API must still be running somewhere, such as a city server, VPS, Render, Railway, Fly.io, Azure, AWS, or another Node hosting provider.

In every SDK example, replace this:

```text
https://your-api-domain.com
```

With the deployed URL of your Daytona Down Detector API.

## jsDelivr SDK URLs

After uploading this repository to GitHub under `CityofDaytonaBeach/daytona-down-detector`, these SDK URLs are ready to use:

```text
https://cdn.jsdelivr.net/gh/CityofDaytonaBeach/daytona-down-detector@a8647cb/sdk/dist/daytona-down-detector.esm.js
https://cdn.jsdelivr.net/gh/CityofDaytonaBeach/daytona-down-detector@a8647cb/sdk/dist/daytona-down-detector.browser.js
```

Use the ESM URL for React, Vite, modern browsers, and module-based apps.

Use the browser URL for a plain `<script>` tag.

## SDK Usage

ES module:

```js
import { createDaytonaDownDetectorClient } from "https://cdn.jsdelivr.net/gh/CityofDaytonaBeach/daytona-down-detector@a8647cb/sdk/dist/daytona-down-detector.esm.js";

const client = createDaytonaDownDetectorClient({
  baseUrl: "https://your-api-domain.com",
  fetchImpl: window.fetch.bind(window),
});

const status = await client.getStatus("microsoft-com");
console.log(status);
```

Plain HTML:

```html
<script src="https://cdn.jsdelivr.net/gh/CityofDaytonaBeach/daytona-down-detector@a8647cb/sdk/dist/daytona-down-detector.browser.js"></script>
<script>
  const client = DaytonaDownDetector.createDaytonaDownDetectorClient({
    baseUrl: "https://your-api-domain.com"
  });

  client.getStatus("microsoft-com").then(console.log);
</script>
```

Local SDK import:

```js
import { createDownDetectorClient } from "./sdk/src/index.js";

const client = createDownDetectorClient({
  baseUrl: "http://localhost:3000",
});
```

## React Example

```jsx
import { useEffect, useState } from "react";
import { createDaytonaDownDetectorClient } from "./sdk/dist/daytona-down-detector.esm.js";

const client = createDaytonaDownDetectorClient({
  baseUrl: "https://your-api-domain.com",
});

export function DaytonaStatusCard() {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    client.getStatus("microsoft-com").then(setStatus);
  }, []);

  if (!status) return <p>Loading...</p>;

  return (
    <section>
      <h2>{status.name}</h2>
      <p>Status: {status.state}</p>
      <p>Reports: {status.recentReportCount}</p>
      <p>Confidence: {status.confidence}%</p>
    </section>
  );
}
```

## Local HTML SDK Test Page

Open this file in a browser to test the jsDelivr SDK URL against your local API:

```text
test-sdk.html
```

The page includes search and renders 100 status cards from `http://localhost:3000`.

If jsDelivr is still serving an older cached SDK file, use this local-only test page first:

```text
test-sdk-local.html
```

The SDK import used by the page is:

```js
import { createDaytonaDownDetectorClient } from "https://cdn.jsdelivr.net/gh/CityofDaytonaBeach/daytona-down-detector@a8647cb/sdk/dist/daytona-down-detector.esm.js";
```

## Add A Site From Any App

```js
await client.createCompany({
  name: "City of Daytona Beach Portal",
  domain: "daytonabeach.gov",
  category: "government",
  tags: ["government", "public-sector"],
});
```

## Report An Outage

```js
await client.createReport({
  slug: "microsoft-com",
  issue: "login",
  region: "us-east",
  note: "Users cannot sign in",
});
```

## API Endpoints

- `GET /health`
- `GET /api/companies?search=microsoft&limit=20&offset=0&status=operational`
- `POST /api/companies`
- `GET /api/companies/:slug`
- `GET /api/status/:slug`
- `GET /api/outages?limit=20`
- `POST /api/reports`
- `GET /api/incidents/:slug`
- `POST /api/probe/:slug`
- `GET /api/analytics/:slug?windowMinutes=1440`

## API Examples

Create a monitored site:

```bash
curl -X POST http://localhost:3000/api/companies \
  -H "content-type: application/json" \
  -d "{\"name\":\"City of Daytona Beach Portal\",\"domain\":\"daytonabeach.gov\",\"category\":\"government\"}"
```

Report an issue:

```bash
curl -X POST http://localhost:3000/api/reports \
  -H "content-type: application/json" \
  -d "{\"slug\":\"microsoft-com\",\"issue\":\"login\",\"region\":\"us-east\",\"note\":\"Users cannot sign in\"}"
```

Check status:

```bash
curl http://localhost:3000/api/status/microsoft-com
```

## SDK Methods

- `health()`
- `listCompanies({ search, status, limit, offset })`
- `getCompany(slug)`
- `createCompany({ domain, name, category, tags, slug, monitorUrl, url })`
- `getStatus(slug)`
- `listOutages({ limit, offset })`
- `createReport({ slug, issue, region, note })`
- `listIncidents(slug)`
- `runProbe(slug)`
- `getAnalytics(slug, { windowMinutes })`

## Data Files

- `data/companies.json`: monitored companies, vendors, and government sites
- `data/reports.json`: public outage reports
- `data/incidents.json`: manually tracked incidents
- `data/probes.json`: latest HTTP probe results

Run this to regenerate the default 25,000-record catalog and reset reports, incidents, and probes:

```bash
npm run seed
```

## Smoke Tests

API smoke test:

```bash
npm run smoke
```

SDK smoke test:

```bash
cd sdk
npm run smoke
```

## GitHub Upload

Recommended repository name:

```text
daytona-down-detector
```

Recommended GitHub owner:

```text
CityofDaytonaBeach
```

Once uploaded to GitHub, apps can load the SDK directly from jsDelivr using the URLs above.

## Project Credit

Created for the City of Daytona.

Lead Developer: Daniel Gurczynski
