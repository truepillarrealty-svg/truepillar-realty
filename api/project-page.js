function slugify(value = "") {
  return String(value).toLowerCase().trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function valueOf(field) {
  if (!field) return undefined;
  if (field.stringValue !== undefined) return field.stringValue;
  if (field.booleanValue !== undefined) return field.booleanValue;
  if (field.integerValue !== undefined) return field.integerValue;
  if (field.doubleValue !== undefined) return field.doubleValue;
  return undefined;
}

function escapeHtml(value = "") {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

module.exports = async function handler(req, res) {
  const requestedSlug = String(req.query.slug || "").replace(/^\/+|\/+$/g, "").toLowerCase();
  if (!requestedSlug || requestedSlug.includes("/")) {
    res.status(400).send("Invalid project slug");
    return;
  }

  try {
    const response = await fetch("https://firestore.googleapis.com/v1/projects/truepillar-realty/databases/(default)/documents/projects?pageSize=1000");
    if (!response.ok) throw new Error("Could not read public project data");
    const data = await response.json();
    const documents = data.documents || [];
    const project = documents.map(doc => {
      const fields = doc.fields || {};
      const p = {};
      for (const [key, field] of Object.entries(fields)) p[key] = valueOf(field);
      p.id = doc.name ? doc.name.split("/").pop() : "";
      p.slug = (typeof p.slug === "string" && p.slug.trim()) ? p.slug.trim().replace(/^\/+|\/+$/g, "") : slugify(p.title || "");
      return p;
    }).find(p => p.slug.toLowerCase() === requestedSlug && p.published !== false);

    if (!project) {
      res.status(404).setHeader("Content-Type", "text/html; charset=utf-8");
      res.send("<!doctype html><html><head><meta name=\"robots\" content=\"noindex\"><title>Project not found | TruePillar Realty</title></head><body><h1>Project not found</h1><a href=\"/properties\">Browse properties</a></body></html>");
      return;
    }

    const pageResponse = await fetch("https://www.truepillar.in/index.html");
    if (!pageResponse.ok) throw new Error("Could not load website shell");
    let html = await pageResponse.text();
    const title = `${project.title || "Property"} in ${project.subLocality || project.region || "Mumbai"} | Price, Floor Plan & Site Visit | TruePillar Realty`;
    const description = `${project.title || "Residential project"} by ${project.developer || "the developer"} in ${project.subLocality || project.region || "Mumbai"}, ${project.region || "Maharashtra"}. ${project.configuration || "Available configurations"} starting from ${project.price || "price on request"}. View details and book a free site visit with TruePillar Realty.`;
    const canonical = "https://www.truepillar.in/" + project.slug;
    html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`);
    html = html.replace(/<meta name="description" content="[^"]*">/i, `<meta name="description" content="${escapeHtml(description)}">`);
    html = html.replace(/<link rel="canonical"[^>]*>/i, `<link rel="canonical" href="${canonical}">`);
    html = html.replace(/<meta property="og:title" content="[^"]*">/i, `<meta property="og:title" content="${escapeHtml(title)}">`);
    html = html.replace(/<meta property="og:description" content="[^"]*">/i, `<meta property="og:description" content="${escapeHtml(description)}">`);
    html = html.replace(/<meta property="og:url" content="[^"]*">/i, `<meta property="og:url" content="${canonical}">`);
    const schema = {
      "@context": "https://schema.org",
      "@type": "Residence",
      "name": project.title || "Residential project",
      "description": description,
      "url": canonical,
      "address": {
        "@type": "PostalAddress",
        "streetAddress": project.address || "",
        "addressLocality": project.subLocality || "",
        "addressRegion": project.region || "",
        "addressCountry": "IN"
      }
    };
    html = html.replace("</head>", `<script type="application/ld+json" id="tp-server-project-schema">${JSON.stringify(schema).replace(/</g, "\\u003c")}</script>\n</head>`);
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=3600");
    res.status(200).send(html);
  } catch (error) {
    console.error("Project SEO page error:", error.message);
    res.status(503).setHeader("Content-Type", "text/plain; charset=utf-8");
    res.send("Project page temporarily unavailable");
  }
};
