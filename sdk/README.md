# Daytona Down Detector SDK

JavaScript SDK for Daytona Down Detector, a JSON-backed outage detection API created for the City of Daytona.

Lead Developer: Daniel Gurczynski

## Usage

After this repository is uploaded to GitHub, use jsDelivr from any app:

```text
https://cdn.jsdelivr.net/gh/CityofDaytonaBeach/daytona-down-detector@a8647cb/sdk/dist/daytona-down-detector.esm.js
https://cdn.jsdelivr.net/gh/CityofDaytonaBeach/daytona-down-detector@a8647cb/sdk/dist/daytona-down-detector.browser.js
```

ES module:

```js
import { createDaytonaDownDetectorClient } from "https://cdn.jsdelivr.net/gh/CityofDaytonaBeach/daytona-down-detector@a8647cb/sdk/dist/daytona-down-detector.esm.js";

const client = createDaytonaDownDetectorClient({ baseUrl: "https://your-api-domain.com" });
const status = await client.getStatus("microsoft-com");
```

Browser script:

```html
<script src="https://cdn.jsdelivr.net/gh/CityofDaytonaBeach/daytona-down-detector@a8647cb/sdk/dist/daytona-down-detector.browser.js"></script>
<script>
  const client = DaytonaDownDetector.createDaytonaDownDetectorClient({
    baseUrl: "https://your-api-domain.com"
  });
</script>
```

Local import:

```js
import { createDownDetectorClient } from "./sdk/src/index.js";

const downDetector = createDownDetectorClient({
  baseUrl: "http://localhost:3000",
});

const health = await downDetector.health();
const companies = await downDetector.listCompanies({ search: "civicplus", limit: 10 });
const status = await downDetector.getStatus("microsoft-com");

await downDetector.createCompany({
  name: "My City Portal",
  domain: "city.example.gov",
  category: "government",
  tags: ["government", "public-sector"],
});

await downDetector.createReport({
  slug: "microsoft-com",
  issue: "login",
  region: "us-east",
  note: "Users cannot sign in",
});
```

## Methods

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

## React Add-Site Example

```jsx
import { useState } from "react";
import { createDownDetectorClient } from "./sdk/src/index.js";

const client = createDownDetectorClient({ baseUrl: "http://localhost:3000" });

export function AddMonitoredSite() {
  const [domain, setDomain] = useState("");
  const [created, setCreated] = useState(null);

  async function onSubmit(event) {
    event.preventDefault();
    const result = await client.createCompany({ domain, category: "government" });
    setCreated(result.company);
    setDomain("");
  }

  return (
    <form onSubmit={onSubmit}>
      <input value={domain} onChange={(event) => setDomain(event.target.value)} placeholder="city.example.gov" />
      <button type="submit">Add Site</button>
      {created ? <p>Added {created.name}</p> : null}
    </form>
  );
}
```

## Smoke Test

Start the API first, then run:

```bash
npm run smoke
```
