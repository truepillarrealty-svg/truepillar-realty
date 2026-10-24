const BASE_URLS = [
  "https://truepillar.in/",
  "https://truepillar.in/properties",
  "https://truepillar.in/about",
  "https://truepillar.in/contact"
];

const FALLBACK_PROJECT_SLUGS = [
  "paradise-sai-world-empire",
  "satyam-le-36"
];

function slugify(value = "") {
  return String(value).toLowerCase().trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function fieldValue(field) {
  if (!field) return undefined;
  if (field.stringValue !== undefined) return field.stringValue;
  if (field.booleanValue !== undefined) return field.booleanValue;
  if (field.integerValue !== undefined) return field.integerValue;
  if (field.doubleValue !== undefined) return field.doubleValue;
  return undefined;
}

async function getPublishedProjectSlugs() {
  const projectId = "truepillar-realty";
  let pageToken = "";
  const slugs = new Set();

  for (let page = 0; page < 10; page++) {
    const url = new URL(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/projects`);
    url.searchParams.set("pageSize", "1000");
    if (pageToken) url.searchParams.set("pageToken", pageToken);

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`Firestore returned HTTP ${response.status}`);
    }
    const data = await response.json();

    for (const document of data.documents || []) {
      const fields = document.fields || {};
      const published = fieldValue(fields.published);
      if (published === false) continue;

      const savedSlug = fieldValue(fields.slug);
      const title = fieldValue(fields.title);
      const slug = (typeof savedSlug === "string" && savedSlug.trim())
        ? savedSlug.trim().replace(/^\/+|\/+$/g, "")
        : slugify(title || "");
      if (slug && !["properties", "about", "contact", "admin"].includes(slug)) {
        slugs.add(slug);
      }
    }

    pageToken = data.nextPageToken || "";
    if (!pageToken) break;
  }

  return [...slugs];
}

module.exports = async function handler(req, res) {
  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");

  let projectSlugs = FALLBACK_PROJECT_SLUGS;
  let source = "fallback";

  try {
    const dynamicSlugs = await getPublishedProjectSlugs();
    projectSlugs = [...new Set([...FALLBACK_PROJECT_SLUGS, ...dynamicSlugs])];
    source = "firestore";
  } catch (error) {
    console.error("Dynamic sitemap Firestore lookup failed:", error.message);
  }

  const urls = [...BASE_URLS, ...projectSlugs.map(slug => `https://truepillar.in/${slug}`)];
  const uniqueUrls = [...new Set(urls)];
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    uniqueUrls.map(url => `  <url><loc>${url}</loc></url>`).join("\n") +
    "\n</urlset>\n";

  res.setHeader("X-Sitemap-Source", source);
  res.status(200).send(body);
};
