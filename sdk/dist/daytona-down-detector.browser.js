(function (global) {
  class DaytonaDownDetectorApiError extends Error {
    constructor(message, options) {
      super(message);
      this.name = "DaytonaDownDetectorApiError";
      this.status = options && options.status;
      this.body = options && options.body;
    }
  }

  class DaytonaDownDetectorClient {
    constructor(options) {
      options = options || {};
      this.baseUrl = (options.baseUrl || "http://localhost:3000").replace(/\/$/, "");
      this.fetch = options.fetchImpl || global.fetch;
      if (this.fetch === global.fetch) this.fetch = this.fetch.bind(global);
      this.headers = options.headers || {};
      if (!this.fetch) throw new Error("A fetch implementation is required.");
    }

    health() {
      return this.request("/health");
    }

    listCompanies(params) {
      return this.request("/api/companies" + query(params || {}));
    }

    getCompany(slug) {
      return this.request("/api/companies/" + encodeURIComponent(required(slug, "slug")));
    }

    createCompany(company) {
      return this.request("/api/companies", { method: "POST", body: company || {} });
    }

    getStatus(slug) {
      return this.request("/api/status/" + encodeURIComponent(required(slug, "slug")));
    }

    listOutages(params) {
      return this.request("/api/outages" + query(params || {}));
    }

    createReport(report) {
      report = report || {};
      return this.request("/api/reports", {
        method: "POST",
        body: {
          slug: required(report.slug, "slug"),
          issue: report.issue || "service_unavailable",
          region: report.region || "unknown",
          note: report.note || "",
        },
      });
    }

    listIncidents(slug) {
      return this.request("/api/incidents/" + encodeURIComponent(required(slug, "slug")));
    }

    createIncident(incident) {
      incident = incident || {};
      return this.request("/api/incidents", {
        method: "POST",
        body: {
          slug: required(incident.slug, "slug"),
          title: incident.title || "Service incident",
          status: incident.status || "investigating",
          severity: incident.severity || "minor",
          message: incident.message || "",
        },
      });
    }

    runProbe(slug) {
      return this.request("/api/probe/" + encodeURIComponent(required(slug, "slug")), { method: "POST" });
    }

    getAnalytics(slug, params) {
      return this.request("/api/analytics/" + encodeURIComponent(required(slug, "slug")) + query(params || {}));
    }

    async request(path, options) {
      options = options || {};
      const response = await this.fetch(this.baseUrl + path, {
        method: options.method || "GET",
        headers: Object.assign(
          { accept: "application/json" },
          options.body ? { "content-type": "application/json" } : {},
          this.headers,
          options.headers || {},
        ),
        body: options.body ? JSON.stringify(options.body) : undefined,
      });
      const body = await parseBody(response);
      if (!response.ok) {
        throw new DaytonaDownDetectorApiError((body && body.error) || "Request failed with " + response.status, {
          status: response.status,
          body: body,
        });
      }
      return body;
    }
  }

  function createDaytonaDownDetectorClient(options) {
    return new DaytonaDownDetectorClient(options);
  }

  function query(params) {
    const search = new URLSearchParams();
    Object.keys(params).forEach(function (key) {
      const value = params[key];
      if (value !== undefined && value !== null && value !== "") search.set(key, String(value));
    });
    const value = search.toString();
    return value ? "?" + value : "";
  }

  function required(value, name) {
    if (value === undefined || value === null || value === "") throw new Error(name + " is required.");
    return String(value);
  }

  async function parseBody(response) {
    const text = await response.text();
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch (_error) {
      return text;
    }
  }

  global.DaytonaDownDetector = {
    DaytonaDownDetectorClient: DaytonaDownDetectorClient,
    DaytonaDownDetectorApiError: DaytonaDownDetectorApiError,
    createDaytonaDownDetectorClient: createDaytonaDownDetectorClient,
    createDownDetectorClient: createDaytonaDownDetectorClient,
  };
})(typeof window !== "undefined" ? window : globalThis);
