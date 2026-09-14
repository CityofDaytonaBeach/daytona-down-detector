export class DownDetectorApiError extends Error {
  constructor(message, { status, body } = {}) {
    super(message);
    this.name = "DownDetectorApiError";
    this.status = status;
    this.body = body;
  }
}

export class DownDetectorClient {
  constructor({ baseUrl = "http://localhost:3000", fetchImpl = globalThis.fetch, headers = {} } = {}) {
    if (!fetchImpl) throw new Error("A fetch implementation is required.");
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.fetch = fetchImpl === globalThis.fetch ? fetchImpl.bind(globalThis) : fetchImpl;
    this.headers = headers;
  }

  health() {
    return this.request("/health");
  }

  listCompanies(params = {}) {
    return this.request(`/api/companies${query(params)}`);
  }

  getCompany(slug) {
    return this.request(`/api/companies/${encodeURIComponent(required(slug, "slug"))}`);
  }

  createCompany({ domain, name, category, tags, slug, monitorUrl, url }) {
    return this.request("/api/companies", {
      method: "POST",
      body: { domain, name, category, tags, slug, monitorUrl, url },
    });
  }

  getStatus(slug) {
    return this.request(`/api/status/${encodeURIComponent(required(slug, "slug"))}`);
  }

  listOutages(params = {}) {
    return this.request(`/api/outages${query(params)}`);
  }

  createReport({ slug, issue = "service_unavailable", region = "unknown", note = "" }) {
    return this.request("/api/reports", {
      method: "POST",
      body: { slug: required(slug, "slug"), issue, region, note },
    });
  }

  listIncidents(slug) {
    return this.request(`/api/incidents/${encodeURIComponent(required(slug, "slug"))}`);
  }

  createIncident({ slug, title = "Service incident", status = "investigating", severity = "minor", message = "" }) {
    return this.request("/api/incidents", {
      method: "POST",
      body: { slug: required(slug, "slug"), title, status, severity, message },
    });
  }

  runProbe(slug) {
    return this.request(`/api/probe/${encodeURIComponent(required(slug, "slug"))}`, { method: "POST" });
  }

  getAnalytics(slug, params = {}) {
    return this.request(`/api/analytics/${encodeURIComponent(required(slug, "slug"))}${query(params)}`);
  }

  async request(path, options = {}) {
    const response = await this.fetch(`${this.baseUrl}${path}`, {
      method: options.method || "GET",
      headers: {
        accept: "application/json",
        ...(options.body ? { "content-type": "application/json" } : {}),
        ...this.headers,
        ...(options.headers || {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
    const body = await parseBody(response);
    if (!response.ok) {
      throw new DownDetectorApiError(body?.error || `Request failed with ${response.status}`, {
        status: response.status,
        body,
      });
    }
    return body;
  }
}

export function createDownDetectorClient(options) {
  return new DownDetectorClient(options);
}

function query(params) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") search.set(key, String(value));
  }
  const value = search.toString();
  return value ? `?${value}` : "";
}

function required(value, name) {
  if (value === undefined || value === null || value === "") throw new Error(`${name} is required.`);
  return String(value);
}

async function parseBody(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export default DownDetectorClient;
