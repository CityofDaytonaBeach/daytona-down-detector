import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, "..", "data");
const TARGET_CATALOG_SIZE = 25000;

const knownDomains = [
  "microsoft.com", "google.com", "apple.com", "amazon.com", "meta.com", "netflix.com", "nvidia.com", "openai.com",
  "anthropic.com", "x.ai", "tesla.com", "spacex.com", "adobe.com", "oracle.com", "salesforce.com", "ibm.com",
  "intel.com", "amd.com", "qualcomm.com", "broadcom.com", "cisco.com", "dell.com", "hp.com", "lenovo.com",
  "samsung.com", "sony.com", "lg.com", "panasonic.com", "toshiba.com", "huawei.com", "xiaomi.com", "oppo.com",
  "vivo.com", "asus.com", "acer.com", "logitech.com", "cloudflare.com", "akamai.com", "fastly.com", "digitalocean.com",
  "linode.com", "vultr.com", "heroku.com", "vercel.com", "netlify.com", "github.com", "gitlab.com", "bitbucket.org",
  "atlassian.com", "slack.com", "zoom.us", "dropbox.com", "box.com", "docusign.com", "notion.so", "airtable.com",
  "figma.com", "canva.com", "miro.com", "asana.com", "monday.com", "trello.com", "clickup.com", "smartsheet.com",
  "servicenow.com", "workday.com", "sap.com", "stripe.com", "paypal.com", "squareup.com", "adyen.com", "shopify.com",
  "twilio.com", "sendgrid.com", "mailchimp.com", "hubspot.com", "zendesk.com", "intercom.com", "freshworks.com", "datadoghq.com",
  "splunk.com", "newrelic.com", "dynatrace.com", "elastic.co", "mongodb.com", "redis.com", "confluent.io", "snowflake.com",
  "databricks.com", "palantir.com", "tableau.com", "looker.com", "alteryx.com", "sas.com", "teradata.com", "informatica.com",
  "vmware.com", "redhat.com", "canonical.com", "docker.com", "kubernetes.io", "hashicorp.com", "ansible.com", "terraform.io",
  "okta.com", "auth0.com", "duo.com", "1password.com", "lastpass.com", "bitwarden.com", "crowdstrike.com", "paloaltonetworks.com",
  "fortinet.com", "zscaler.com", "cloudstrike.com", "sentinelone.com", "rapid7.com", "tenable.com", "snyk.io", "sonarsource.com",
  "jetbrains.com", "visualstudio.com", "npmjs.com", "yarnpkg.com", "pypi.org", "dockerhub.com", "npmjs.org", "postman.com",
  "segment.com", "mixpanel.com", "amplitude.com", "hotjar.com", "optimizely.com", "launchdarkly.com", "sentry.io", "pagerduty.com",
  "opsgenie.com", "statuspage.io", "grafana.com", "prometheus.io", "honeycomb.io", "circleci.com", "travis-ci.com", "jenkins.io",
  "buildkite.com", "linear.app", "retool.com", "zapier.com", "make.com", "ifttt.com", "aircall.io", "calendly.com",
  "webex.com", "gotomeeting.com", "ringcentral.com", "8x8.com", "loom.com", "typeform.com", "surveymonkey.com", "qualtrics.com",
  "yahoo.com", "duckduckgo.com", "baidu.com", "tencent.com", "alibaba.com", "jd.com", "rakuten.com", "booking.com",
  "uber.com", "lyft.com", "doordash.com", "instacart.com", "airbnb.com", "spotify.com", "soundcloud.com", "discord.com",
  "reddit.com", "pinterest.com", "snap.com", "tiktok.com", "bytedance.com", "roblox.com", "epicgames.com", "ea.com",
  "activision.com", "unity.com", "autodesk.com", "intuit.com", "quickbooks.intuit.com", "coinbase.com", "kraken.com", "binance.com",
  "robinhood.com", "plaid.com", "brex.com", "ramp.com", "wise.com", "klarna.com", "affirm.com", "chime.com",
  "sofi.com", "norton.com", "mcafee.com", "trendmicro.com", "eset.com", "kaspersky.com", "ring.com", "roku.com",
  "sonos.com", "fitbit.com", "garmin.com", "waymo.com", "cruise.com", "rivian.com", "lucidmotors.com", "nio.com",
  "arm.com", "tsmc.com", "asml.com", "micron.com", "westerndigital.com", "seagate.com", "sandisk.com", "synology.com",
  "invgate.com", "civicplus.com", "icompasstech.com", "ims-online.com", "jotform.com", "granicus.com", "tylertech.com",
  "opengov.com", "municode.com", "civicactions.com", "accela.com", "questica.com", "viewpointcloud.com", "seamlessdocs.com",
  "nextrequest.com", "archivesocial.com", "revize.com", "govoffice.com", "egov.com", "govdelivery.com", "socrata.com",
  "govqa.com", "laserfiche.com", "neogov.com", "esri.com", "cityworks.com", "centralsquare.com", "cleargov.com",
  "routefifty.com", "bangthetable.com", "engagementhq.com", "openforms.com", "formstack.com", "cognitoforms.com",
];

const civicVendorDomains = [
  "invgate.com", "civicplus.com", "icompasstech.com", "ims-online.com", "jotform.com", "granicus.com", "tylertech.com",
  "opengov.com", "municode.com", "accela.com", "questica.com", "viewpointcloud.com", "seamlessdocs.com", "nextrequest.com",
  "revize.com", "govoffice.com", "egov.com", "govdelivery.com", "socrata.com", "govqa.com", "laserfiche.com", "neogov.com",
  "esri.com", "cityworks.com", "centralsquare.com", "cleargov.com", "bangthetable.com", "engagementhq.com", "openforms.com",
  "formstack.com", "cognitoforms.com", "onbase.com", "everbridge.com", "nixle.com", "civicready.com", "massnotification.com",
  "seeClickFix.com", "seeclickfix.com", "citizenserve.com", "permitium.com", "energov.com", "mygovernmentonline.org",
  "govpilot.com", "zencity.io", "polco.us", "flashvote.com", "peakdemocracy.com", "publicinput.com", "socialpinpoint.com",
  "mapbox.com", "arcgis.com", "carto.com", "openstreetmap.org", "myrec.com", "recdesk.com", "civicrec.com", "perfectmind.com",
  "activecommunities.com", "rectrac.com", "paygov.us", "pointandpay.com", "invoicecloud.com", "officialpayments.com",
  "paymentus.com", "securepaygov.com", "utilitybilling.com", "civicclerk.com", "boarddocs.com", "diligent.com",
  "legistar.com", "novusagenda.com", "primegov.com", "agendaquick.com", "ecode360.com", "civiclive.com", "visioninternet.com",
];

const cityNames = [
  "newyork", "losangeles", "chicago", "houston", "phoenix", "philadelphia", "sanantonio", "sandiego", "dallas", "austin",
  "jacksonville", "fortworth", "sanfrancisco", "columbus", "charlotte", "indianapolis", "seattle", "denver", "washington", "boston",
  "elpaso", "nashville", "detroit", "oklahomacity", "portland", "lasvegas", "memphis", "louisville", "baltimore", "milwaukee",
  "albuquerque", "tucson", "fresno", "sacramento", "mesa", "kansascity", "atlanta", "omaha", "coloradosprings", "raleigh",
  "miami", "virginiabeach", "oakland", "minneapolis", "tulsa", "arlington", "neworleans", "wichita", "cleveland", "tampa",
  "bakersfield", "aurora", "honolulu", "anaheim", "santana", "riverside", "corpuschristi", "lexington", "stockton", "henderson",
  "saintpaul", "stlouis", "cincinnati", "pittsburgh", "greensboro", "anchorage", "plano", "lincoln", "orlando", "irvine",
  "newark", "toledo", "durham", "chulavista", "fortwayne", "jerseycity", "stpetersburg", "laredo", "madison", "chandler",
  "buffalo", "lubbock", "scottsdale", "reno", "glendale", "gilbert", "winston-salem", "northlasvegas", "norfolk", "chesapeake",
  "garland", "irving", "hialeah", "fremont", "boise", "richmond", "batonrouge", "spokane", "desmoines", "tacoma",
  "sanbernardino", "modesto", "fontana", "santaclarita", "birmingham", "oxnard", "fayetteville", "rochester", "moreno valley", "glendaleaz",
  "huntingtonbeach", "saltlakecity", "grandrapids", "amarillo", "yonkers", "aurorail", "montgomery", "akron", "little rock", "huntsville",
  "augusta", "portstlucie", "grandprairie", "columbusga", "tallahassee", "overlandpark", "tempe", "mckinney", "mobile", "cape coral",
];

const countyNames = [
  "orange", "cook", "harris", "maricopa", "sandiego", "losangeles", "dallas", "tarrant", "bexar", "king", "miamidade",
  "riverside", "clark", "broward", "wayne", "alameda", "middlesex", "suffolk", "fairfax", "travis", "fulton", "shelby",
  "hamilton", "franklin", "jefferson", "montgomery", "washington", "greene", "madison", "monroe", "lake", "union",
];

const stateCodes = [
  "al", "ak", "az", "ar", "ca", "co", "ct", "de", "fl", "ga", "hi", "id", "il", "in", "ia", "ks", "ky", "la", "me", "md",
  "ma", "mi", "mn", "ms", "mo", "mt", "ne", "nv", "nh", "nj", "nm", "ny", "nc", "nd", "oh", "ok", "or", "pa", "ri", "sc",
  "sd", "tn", "tx", "ut", "vt", "va", "wa", "wv", "wi", "wy",
];

const govVariants = ["city", "town", "village", "county", "boc", "clerk", "police", "fire", "parks", "utilities"];

const prefixes = [
  "apex", "atlas", "aurora", "binary", "blue", "bright", "carbon", "cedar", "cipher", "cloud", "cobalt", "core",
  "crystal", "delta", "digital", "eagle", "ember", "ever", "falcon", "forge", "fusion", "global", "green", "halo",
  "hyper", "ion", "iris", "juno", "kinetic", "laser", "logic", "lunar", "matrix", "mercury", "mobile", "nova",
  "onyx", "orbit", "phoenix", "pixel", "prime", "quantum", "rapid", "relay", "rocket", "secure", "signal", "silver",
  "sky", "solar", "spark", "stellar", "summit", "swift", "synapse", "terra", "titan", "vector", "velocity", "vertex",
  "vision", "wave", "zenith",
];
const suffixes = [
  "ai", "apps", "analytics", "automation", "cloud", "compute", "data", "dev", "digital", "edge", "fintech", "games",
  "labs", "logic", "media", "mobile", "networks", "payments", "robotics", "security", "semiconductor", "software",
  "systems", "telecom", "ventures", "works",
];

function titleCase(value) {
  return value.replace(/[-.]/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function slugFromDomain(domain) {
  return domain.toLowerCase().replace(/^www\./, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function categoryFor(domain) {
  if (/\.gov$|\.us$|county|clerk|police|fire|parks|utilities/.test(domain)) return "government";
  if (/civic|gov|muni|agenda|clerk|jotform|invgate|icompass|granicus|tylertech|opengov|accela|socrata/.test(domain)) return "civic-tech";
  if (/cloud|vercel|netlify|akamai|fastly|digitalocean|linode|vultr|heroku/.test(domain)) return "cloud-infrastructure";
  if (/security|okta|auth|crowd|fortinet|zscaler|password|norton|mcafee/.test(domain)) return "security";
  if (/pay|stripe|coin|bank|fin|wise|klarna|affirm|chime|plaid/.test(domain)) return "fintech";
  if (/game|roblox|epic|ea|activision|unity/.test(domain)) return "gaming";
  if (/ai|openai|anthropic|x.ai/.test(domain)) return "ai";
  if (/data|mongo|redis|snowflake|elastic|grafana|splunk|tableau/.test(domain)) return "data-observability";
  return "technology";
}

const domains = [...new Set(knownDomains.map((domain) => domain.toLowerCase()))];

for (const domain of civicVendorDomains) {
  if (!domains.includes(domain.toLowerCase())) domains.push(domain.toLowerCase());
}

for (const state of stateCodes) {
  for (const city of cityNames) {
    const cleanCity = city.replace(/[^a-z0-9]/g, "");
    domains.push(`${cleanCity}.${state}.gov`);
    domains.push(`${cleanCity}${state}.gov`);
    domains.push(`${cleanCity}city.gov`);
    domains.push(`cityof${cleanCity}.gov`);
    domains.push(`${cleanCity}-${state}.gov`);
    for (const variant of govVariants) {
      domains.push(`${variant}.${cleanCity}.${state}.us`);
    }
  }
}

for (const state of stateCodes) {
  for (const county of countyNames) {
    domains.push(`${county}county.${state}.gov`);
    domains.push(`${county}county${state}.gov`);
    domains.push(`${county}-county-${state}.gov`);
    domains.push(`www.${county}county${state}.gov`);
  }
}

for (const prefix of prefixes) {
  for (const suffix of suffixes) {
    if (domains.length >= TARGET_CATALOG_SIZE) break;
    domains.push(`${prefix}${suffix}.com`);
  }
  if (domains.length >= TARGET_CATALOG_SIZE) break;
}

let generatedIndex = 1;
while (new Set(domains).size < TARGET_CATALOG_SIZE) {
  for (const state of stateCodes) {
    for (const suffix of ["portal", "payments", "permits", "meetings", "records", "forms", "service", "alerts", "agenda", "open-data"]) {
      if (new Set(domains).size >= TARGET_CATALOG_SIZE) break;
      domains.push(`gov-${suffix}-${state}-${generatedIndex}.us`);
      generatedIndex += 1;
    }
    if (new Set(domains).size >= TARGET_CATALOG_SIZE) break;
  }
}

const companies = [...new Set(domains)].slice(0, TARGET_CATALOG_SIZE).map((domain, index) => {
  const baseName = domain.split(".")[0].replace(/-/g, " ");
  const category = categoryFor(domain);
  return {
    id: index + 1,
    slug: slugFromDomain(domain),
    name: titleCase(baseName),
    domain,
    category,
    tags: [category, category === "government" ? "public-sector" : "technology", domain.split(".").at(-1)],
    monitorUrl: `https://${domain}`,
    createdAt: new Date().toISOString(),
  };
});

await mkdir(dataDir, { recursive: true });
await rm(path.join(dataDir, "sites"), { recursive: true, force: true });
await mkdir(path.join(dataDir, "sites"), { recursive: true });
await writeFile(path.join(dataDir, "companies.json"), `${JSON.stringify(companies, null, 2)}\n`);
await writeFile(path.join(dataDir, "reports.json"), "[]\n");
await writeFile(path.join(dataDir, "incidents.json"), "[]\n");
await writeFile(path.join(dataDir, "probes.json"), "{}\n");
console.log(`Seeded ${companies.length} companies to ${path.join(dataDir, "companies.json")}`);
