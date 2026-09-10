const baseUrl = process.env.API_URL || "http://localhost:3000";

async function request(path, options) {
  const response = await fetch(`${baseUrl}${path}`, options);
  const body = await response.json();
  if (!response.ok) throw new Error(`${path} failed: ${response.status} ${JSON.stringify(body)}`);
  return body;
}

const health = await request("/health");
const companies = await request("/api/companies?search=microsoft&limit=5");
const report = await request("/api/reports", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ slug: "microsoft-com", issue: "login", region: "us-east", note: "Smoke test report" }),
});
const status = await request("/api/status/microsoft-com");
const outages = await request("/api/outages?limit=5");

console.log(JSON.stringify({
  health,
  foundCompanies: companies.items.length,
  reportCreated: Boolean(report.report.id),
  microsoftState: status.state,
  outageCount: outages.total,
}, null, 2));
