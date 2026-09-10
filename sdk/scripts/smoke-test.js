import { createDownDetectorClient } from "../src/index.js";

const client = createDownDetectorClient({ baseUrl: process.env.API_URL || "http://localhost:3000" });

const health = await client.health();
const domain = `sdk-smoke-${Date.now()}.example.com`;
const createdCompany = await client.createCompany({
  name: "SDK Smoke Site",
  domain,
  category: "test-monitor",
  tags: ["test-monitor", "sdk"],
});
const companies = await client.listCompanies({ search: "civicplus", limit: 3 });
const status = await client.getStatus("microsoft-com");
const report = await client.createReport({
  slug: "microsoft-com",
  issue: "login",
  region: "us-east",
  note: "SDK smoke test report",
});
const analytics = await client.getAnalytics("microsoft-com", { windowMinutes: 60 });
const outages = await client.listOutages({ limit: 5 });

console.log(JSON.stringify({
  health,
  createdCompany: createdCompany.company.slug,
  civicplusResults: companies.items.length,
  microsoftStateBeforeReport: status.state,
  reportCreated: Boolean(report.report.id),
  analyticsReports: analytics.totalReports,
  outageCount: outages.total,
}, null, 2));
