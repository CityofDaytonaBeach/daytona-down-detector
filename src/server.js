import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");
const dataDir = path.join(rootDir, "data");
const companiesFile = path.join(dataDir, "companies.json");
const reportsFile = path.join(dataDir, "reports.json");
const incidentsFile = path.join(dataDir, "incidents.json");
const probesFile = path.join(dataDir, "probes.json");

const PORT = Number(process.env.PORT || 3000);
const REPORT_WINDOW_MINUTES = Number(process.env.REPORT_WINDOW_MINUTES || 60);

async function ensureStore() {
  await mkdir(dataDir, { recursive: true });
  for (const [file, fallback] of [
    [reportsFile, []],
    [incidentsFile, []],
    [probesFile, {}],
  ]) {
    if (!existsSync(file)) await writeJson(file, fallback);
  }
}

async function readJson(file, fallback) {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return fallback;
    throw error;
  }
}

async function writeJson(file, value) {
  const tmpFile = `${file}.${process.pid}.tmp`;
  await writeFile(tmpFile, `${JSON.stringify(value, null, 2)}\n`);
  await rename(tmpFile, file);
}

function send(res, status, body, headers = {}) {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "content-type",
    ...headers,
  });
  res.end(JSON.stringify(body, null, 2));
}

async function readBody(req) {
  let raw = "";
  for await (const chunk of req) raw += chunk;
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    const error = new Error("Request body must be valid JSON.");
    error.status = 400;
    throw error;
  }
}

function companyUrl(company) {
  return `https://${company.domain}`;
}

function slugFromDomain(domain) {
  return domain.toLowerCase().replace(/^www\./, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function titleCase(value) {
  return value.replace(/[-.]/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function normalizeDomain(value) {
  try {
    const input = String(value || "").trim().toLowerCase();
    const url = new URL(input.includes("://") ? input : `https://${input}`);
    return url.hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function isValidDomain(domain) {
  return /^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}$/.test(domain) && !domain.includes("..");
}

function getStatus(company, reports, incidents, probes, now = Date.now()) {
  const windowMs = REPORT_WINDOW_MINUTES * 60 * 1000;
  const recentReports = reports.filter(
    (report) => report.slug === company.slug && now - Date.parse(report.createdAt) <= windowMs,
  );
  const activeIncidents = incidents.filter(
    (incident) => incident.slug === company.slug && incident.status !== "resolved",
  );
  const probe = probes[company.slug];
  const failedProbe = probe && probe.ok === false && now - Date.parse(probe.checkedAt) <= windowMs;
  const reportScore = Math.min(70, recentReports.length * 7);
  const incidentScore = activeIncidents.length ? 40 : 0;
  const probeScore = failedProbe ? 35 : 0;
  const score = Math.min(100, reportScore + incidentScore + probeScore);
  const state = score >= 70 ? "major_outage" : score >= 35 ? "degraded" : score >= 15 ? "possible_issue" : "operational";
  const confidence = Math.min(99, 35 + recentReports.length * 8 + activeIncidents.length * 25 + (probe ? 12 : 0));
  const issueCounts = recentReports.reduce((counts, report) => {
    counts[report.issue] = (counts[report.issue] || 0) + 1;
    return counts;
  }, {});
  const regionCounts = recentReports.reduce((counts, report) => {
    counts[report.region] = (counts[report.region] || 0) + 1;
    return counts;
  }, {});

  return {
    slug: company.slug,
    name: company.name,
    domain: company.domain,
    state,
    score,
    confidence,
    reportWindowMinutes: REPORT_WINDOW_MINUTES,
    recentReportCount: recentReports.length,
    activeIncidentCount: activeIncidents.length,
    topIssues: topCounts(issueCounts),
    topRegions: topCounts(regionCounts),
    probe: probe || null,
    updatedAt: new Date(now).toISOString(),
  };
}

function topCounts(counts) {
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));
}

async function runProbe(company) {
  const started = Date.now();
  try {
    const response = await fetch(companyUrl(company), {
      method: "HEAD",
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
    });
    return {
      ok: response.ok,
      statusCode: response.status,
      latencyMs: Date.now() - started,
      checkedAt: new Date().toISOString(),
      url: companyUrl(company),
    };
  } catch (error) {
    return {
      ok: false,
      error: error.message,
      latencyMs: Date.now() - started,
      checkedAt: new Date().toISOString(),
      url: companyUrl(company),
    };
  }
}

function findCompany(companies, slug) {
  return companies.find((company) => company.slug === slug || company.domain === slug);
}

function paginate(items, url) {
  const limit = Math.min(Number(url.searchParams.get("limit") || 50), 200);
  const offset = Math.max(Number(url.searchParams.get("offset") || 0), 0);
  return { total: items.length, limit, offset, items: items.slice(offset, offset + limit) };
}

async function route(req, res) {
  if (req.method === "OPTIONS") return send(res, 204, {});

  const url = new URL(req.url, `http://${req.headers.host}`);
  const parts = url.pathname.split("/").filter(Boolean);
  const companies = await readJson(companiesFile, []);
  const reports = await readJson(reportsFile, []);
  const incidents = await readJson(incidentsFile, []);
  const probes = await readJson(probesFile, {});

  if (req.method === "GET" && url.pathname === "/health") {
    return send(res, 200, { ok: true, companies: companies.length, now: new Date().toISOString() });
  }

  if (req.method === "GET" && url.pathname === "/api/companies") {
    const search = (url.searchParams.get("search") || "").toLowerCase();
    const status = url.searchParams.get("status");
    let items = companies;
    if (search) {
      items = items.filter((company) =>
        [company.name, company.domain, company.category, ...(company.tags || [])].join(" ").toLowerCase().includes(search),
      );
    }
    if (status) {
      items = items.filter((company) => getStatus(company, reports, incidents, probes).state === status);
    }
    return send(res, 200, paginate(items, url));
  }

  if (req.method === "POST" && url.pathname === "/api/companies") {
    const body = await readBody(req);
    const domain = normalizeDomain(body.domain || body.monitorUrl || body.url);
    if (!isValidDomain(domain)) return send(res, 400, { error: "A valid domain is required." });

    const slug = slugFromDomain(body.slug || domain);
    if (companies.some((company) => company.domain === domain || company.slug === slug)) {
      return send(res, 409, { error: "Company already exists.", slug });
    }

    const category = String(body.category || "technology").slice(0, 80);
    const company = {
      id: companies.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1,
      slug,
      name: String(body.name || titleCase(domain.split(".")[0])).slice(0, 120),
      domain,
      category,
      tags: Array.isArray(body.tags) ? body.tags.map((tag) => String(tag).slice(0, 60)).slice(0, 12) : [category, "technology", domain.split(".").at(-1)],
      monitorUrl: `https://${domain}`,
      createdAt: new Date().toISOString(),
    };

    companies.push(company);
    await writeJson(companiesFile, companies);
    return send(res, 201, { company, status: getStatus(company, reports, incidents, probes) });
  }

  if (req.method === "GET" && parts[0] === "api" && parts[1] === "companies" && parts[2]) {
    const company = findCompany(companies, parts[2]);
    if (!company) return send(res, 404, { error: "Company not found." });
    return send(res, 200, { ...company, status: getStatus(company, reports, incidents, probes) });
  }

  if (req.method === "GET" && parts[0] === "api" && parts[1] === "status" && parts[2]) {
    const company = findCompany(companies, parts[2]);
    if (!company) return send(res, 404, { error: "Company not found." });
    return send(res, 200, getStatus(company, reports, incidents, probes));
  }

  if (req.method === "GET" && url.pathname === "/api/outages") {
    const statuses = companies.map((company) => getStatus(company, reports, incidents, probes));
    const down = statuses.filter((status) => status.state !== "operational").sort((a, b) => b.score - a.score);
    return send(res, 200, paginate(down, url));
  }

  if (req.method === "POST" && url.pathname === "/api/reports") {
    const body = await readBody(req);
    const company = findCompany(companies, String(body.slug || ""));
    if (!company) return send(res, 404, { error: "Company not found." });
    const report = {
      id: randomUUID(),
      slug: company.slug,
      issue: String(body.issue || "service_unavailable").slice(0, 80),
      region: String(body.region || "unknown").slice(0, 80),
      note: String(body.note || "").slice(0, 500),
      createdAt: new Date().toISOString(),
    };
    reports.unshift(report);
    await writeJson(reportsFile, reports.slice(0, 50000));
    return send(res, 201, { report, status: getStatus(company, reports, incidents, probes) });
  }

  if (req.method === "GET" && parts[0] === "api" && parts[1] === "incidents" && parts[2]) {
    const company = findCompany(companies, parts[2]);
    if (!company) return send(res, 404, { error: "Company not found." });
    return send(res, 200, incidents.filter((incident) => incident.slug === company.slug));
  }

  if (req.method === "POST" && parts[0] === "api" && parts[1] === "probe" && parts[2]) {
    const company = findCompany(companies, parts[2]);
    if (!company) return send(res, 404, { error: "Company not found." });
    const probe = await runProbe(company);
    probes[company.slug] = probe;
    await writeJson(probesFile, probes);
    return send(res, 200, { probe, status: getStatus(company, reports, incidents, probes) });
  }

  if (req.method === "GET" && parts[0] === "api" && parts[1] === "analytics" && parts[2]) {
    const company = findCompany(companies, parts[2]);
    if (!company) return send(res, 404, { error: "Company not found." });
    const windowMinutes = Math.min(Number(url.searchParams.get("windowMinutes") || 1440), 10080);
    const cutoff = Date.now() - windowMinutes * 60 * 1000;
    const scopedReports = reports.filter((report) => report.slug === company.slug && Date.parse(report.createdAt) >= cutoff);
    return send(res, 200, {
      slug: company.slug,
      windowMinutes,
      totalReports: scopedReports.length,
      issues: topCounts(scopedReports.reduce((counts, report) => ({ ...counts, [report.issue]: (counts[report.issue] || 0) + 1 }), {})),
      regions: topCounts(scopedReports.reduce((counts, report) => ({ ...counts, [report.region]: (counts[report.region] || 0) + 1 }), {})),
    });
  }

  return send(res, 404, { error: "Not found." });
}

await ensureStore();
if (!existsSync(companiesFile)) {
  console.error("Missing data/companies.json. Run npm run seed first.");
  process.exit(1);
}

createServer((req, res) => {
  route(req, res).catch((error) => {
    send(res, error.status || 500, { error: error.message || "Internal server error." });
  });
}).listen(PORT, () => {
  console.log(`Daytona Down Detector API listening on http://localhost:${PORT}`);
});
