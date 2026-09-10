# Daytona Down Detector

Daytona Down Detector is a JSON-backed outage detection API and JavaScript SDK for monitoring technology platforms, civic-tech vendors, and government websites.

Created for the City of Daytona.

Lead Developer: Daniel Gurczynski

## Features

- No database or tables required. Data is stored in readable `data/*.json` files.
- Starts with 25,000 monitored records covering major tech companies, civic-tech platforms, city/county/state-style government sites, and vendors such as CivicPlus, iCompass, IMS, InvGate, and Jotform.
- Combines user reports, active incidents, and optional live HTTP probes into a single outage score.
- Returns status state, confidence, top reported issues, top regions, active incident count, and probe metadata.
- Includes a JavaScript SDK that can be used from React, Node, Next.js, Vite, or other JavaScript apps.

## Requirements

- Node.js 18+
- No database setup

## Quick Start

```bash
npm run seed
npm start
```

The API listens on `http://localhost:3000` by default.

Use a different port:

```bash
PORT=4000 npm start
```

On Windows PowerShell:

```powershell
$env:PORT = "4000"; npm start
```

## API Endpoints

- `GET /health`
- `GET /api/companies?search=microsoft&limit=20&offset=0&status=operational`
- `POST /api/companies` with `{ "name": "My City Portal", "domain": "city.example.gov", "category": "government" }`
- `GET /api/companies/:slug`
- `GET /api/status/:slug`
- `GET /api/outages?limit=20`
- `POST /api/reports` with `{ "slug": "microsoft-com", "issue": "login", "region": "us-east", "note": "optional" }`
- `GET /api/incidents/:slug`
- `POST /api/probe/:slug`
- `GET /api/analytics/:slug?windowMinutes=1440`

## Example API Usage

Create a monitored site:

```bash
curl -X POST http://localhost:3000/api/companies \
  -H "content-type: application/json" \
  -d "{\"name\":\"City of Daytona Portal\",\"domain\":\"daytonabeach.gov\",\"category\":\"government\"}"
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

## JavaScript SDK

The SDK is included in `sdk/`.

After this repository is uploaded to GitHub, the jsDelivr URLs are:

```text
https://cdn.jsdelivr.net/gh/CityofDaytonaBeach/daytona-down-detector@main/sdk/dist/daytona-down-detector.esm.js
https://cdn.jsdelivr.net/gh/CityofDaytonaBeach/daytona-down-detector@main/sdk/dist/daytona-down-detector.browser.js
```

These URLs will work after this repository is uploaded to `CityofDaytonaBeach/daytona-down-detector` on GitHub.

ES module usage in any app:

```js
import { createDaytonaDownDetectorClient } from "https://cdn.jsdelivr.net/gh/CityofDaytonaBeach/daytona-down-detector@main/sdk/dist/daytona-down-detector.esm.js";

const client = createDaytonaDownDetectorClient({
  baseUrl: "https://your-api-domain.com",
});

const status = await client.getStatus("microsoft-com");
```

Plain browser script usage:

```html
<script src="https://cdn.jsdelivr.net/gh/CityofDaytonaBeach/daytona-down-detector@main/sdk/dist/daytona-down-detector.browser.js"></script>
<script>
  const client = DaytonaDownDetector.createDaytonaDownDetectorClient({
    baseUrl: "https://your-api-domain.com"
  });

  client.getStatus("microsoft-com").then(console.log);
</script>
```

Local SDK usage:

```js
import { createDownDetectorClient } from "./sdk/src/index.js";

const client = createDownDetectorClient({ baseUrl: "http://localhost:3000" });

const status = await client.getStatus("microsoft-com");
const companies = await client.listCompanies({ search: "civicplus", limit: 10 });

await client.createCompany({
  name: "City of Daytona Portal",
  domain: "daytonabeach.gov",
  category: "government",
});
```

## React Example

Use the jsDelivr ESM URL directly in React if your bundler allows URL imports, or copy `sdk/src/index.js` into your app.

```jsx
import { useEffect, useState } from "react";
import { createDaytonaDownDetectorClient } from "https://cdn.jsdelivr.net/gh/CityofDaytonaBeach/daytona-down-detector@main/sdk/dist/daytona-down-detector.esm.js";

const client = createDaytonaDownDetectorClient({ baseUrl: "https://your-api-domain.com" });

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

## Data Files

- `data/companies.json`: monitored companies, vendors, and government sites
- `data/reports.json`: crowd/user outage reports
- `data/incidents.json`: manually tracked incidents
- `data/probes.json`: latest HTTP probe results

Run `npm run seed` to regenerate the default 25,000-record catalog and reset reports/incidents/probes.

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

## Project Credit

Created for the City of Daytona.

Lead Developer: Daniel Gurczynski
