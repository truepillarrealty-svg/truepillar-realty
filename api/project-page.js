function slugify(value = "") {
  return String(value).toLowerCase().trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function decodeValue(value) {
  if (!value || typeof value !== "object") return undefined;
  if (Object.prototype.hasOwnProperty.call(value, "stringValue")) return value.stringValue;
  if (Object.prototype.hasOwnProperty.call(value, "booleanValue")) return value.booleanValue;
  if (Object.prototype.hasOwnProperty.call(value, "integerValue")) return Number(value.integerValue);
  if (Object.prototype.hasOwnProperty.call(value, "doubleValue")) return value.doubleValue;
  if (Object.prototype.hasOwnProperty.call(value, "timestampValue")) return value.timestampValue;
  if (Object.prototype.hasOwnProperty.call(value, "nullValue")) return null;
  if (value.arrayValue) return (value.arrayValue.values || []).map(decodeValue);
  if (value.mapValue) {
    return Object.fromEntries(Object.entries(value.mapValue.fields || {}).map(([key, item]) => [key, decodeValue(item)]));
  }
  return undefined;
}

function escapeHtml(value = "") {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function textValue(value) {
  if (value === undefined || value === null || value === "") return "";
  if (Array.isArray(value)) return value.map(textValue).filter(Boolean).join(", ");
  if (typeof value === "object") return "";
  return String(value).trim();
}

function safeImage(value) {
  const candidate = textValue(value);
  return /^https:\/\/[^\s"'<>]+$/i.test(candidate) ? candidate : "";
}

function renderProjectSeoContent(project, title, description, canonical, image) {
  const locality = textValue(project.subLocality || project.locality || project.location);
  const region = textValue(project.region || project.city || "Maharashtra");
  const developer = textValue(project.developer || project.builder);
  const configurationEntries = (Array.isArray(project.configurations) ? project.configurations : [])
    .filter(item => item && typeof item === "object")
    .map(item => ({
      name: textValue(item.configuration || item.name || item.type),
      area: textValue(item.carpetArea || item.area),
      price: textValue(item.price || item.startingPrice)
    }))
    .filter(item => item.name || item.area || item.price);
  const configuration = [...new Set(configurationEntries.map(item => item.name).filter(Boolean))].join(", ") ||
    textValue(project.configuration || project.configurationsText);
  const configurationPricing = configurationEntries.map(item =>
    [item.name, item.area, item.price].filter(Boolean).join(" · ")
  ).filter(Boolean).join(" | ");
  const price = configurationPricing || textValue(project.price || project.priceRange);
  const possession = textValue(project.possession || project.possessionDate);
  const rera = textValue(project.mahareraNumber || project.reraNumber || project.rera || project.registrationNumber);
  const status = textValue(project.status || project.statusBadge);
  const projectDescription = [
    textValue(project.title) ? textValue(project.title) + " is listed by TruePillar Realty." : "",
    locality ? "Location: " + locality + (region ? ", " + region : "") + "." : "",
    developer ? "Developer: " + developer + "." : "",
    configuration ? "Configurations: " + configuration + "." : "",
    possession ? "Published possession: " + possession + "." : ""
  ].filter(Boolean).join(" ");
  const address = textValue(project.address);
  const localitySlug = /kharghar/i.test(locality) ? "kharghar"
    : /panvel|palaspe|palaspa/i.test(locality) ? "panvel"
    : /vashi/i.test(locality) ? "vashi"
    : /ghansoli/i.test(locality) ? "ghansoli"
    : /nerul/i.test(locality) ? "nerul"
    : /thane/i.test(region) ? "thane"
    : /navi mumbai/i.test(region) ? "navi-mumbai" : "";
  const facts = [
    ["Developer", developer],
    ["Location", [locality, region].filter(Boolean).join(", ")],
    ["Configurations", configuration],
    ["Indicative price", price],
    ["Possession", possession],
    ["MahaRERA registration", rera],
    ["Project status", status]
  ].filter(([, value]) => value);

  const factRows = facts.map(([label, value]) =>
    `<div class="tp-project-fact"><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`
  ).join("");

  const imageMarkup = image
    ? `<figure class="tp-project-image"><img src="${escapeHtml(image)}" alt="${escapeHtml(project.title || "Residential project")} in ${escapeHtml(locality || region)}" loading="eager"><figcaption>Project image supplied for this listing. Confirm current specifications and availability with the developer.</figcaption></figure>`
    : "";

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": canonical + "#webpage",
        "url": canonical,
        "name": title,
        "description": description,
        "isPartOf": { "@id": "https://www.truepillar.in/#website" },
        "publisher": { "@id": "https://www.truepillar.in/#real-estate-agent" },
        "about": { "@id": canonical + "#residence" },
        "breadcrumb": { "@id": canonical + "#breadcrumb" }
      },
      {
        "@type": "Residence",
        "@id": canonical + "#residence",
        "name": textValue(project.title) || "Residential project",
        "description": projectDescription || description,
        "url": canonical,
        ...(image ? { "image": image } : {}),
        ...(address || locality || region ? {
          "address": {
            "@type": "PostalAddress",
            ...(address ? { "streetAddress": address } : {}),
            ...(locality ? { "addressLocality": locality } : {}),
            "addressRegion": region,
            "addressCountry": "IN"
          }
        } : {})
      },
      {
        "@type": "BreadcrumbList",
        "@id": canonical + "#breadcrumb",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.truepillar.in/" },
          { "@type": "ListItem", "position": 2, "name": "Properties", "item": "https://www.truepillar.in/properties" },
          { "@type": "ListItem", "position": 3, "name": textValue(project.title) || "Project", "item": canonical }
        ]
      }
    ]
  };

  return `
<main id="tp-project-seo-content" class="tp-project-seo">
  <nav aria-label="Breadcrumb" class="tp-project-breadcrumb"><a href="/">Home</a><span>›</span><a href="/properties">All Properties</a><span>›</span><span>${escapeHtml(project.title || "Project")}</span></nav>
  <div class="tp-project-seo-grid">
    <article>
      <p class="tp-project-eyebrow">TruePillar Realty · Project Information</p>
      <h1>${escapeHtml(project.title || "Residential Project")}</h1>
      <p class="tp-project-lead">${escapeHtml([locality, region].filter(Boolean).join(", ") || "Mumbai Metropolitan Region")}${developer ? " · By " + escapeHtml(developer) : ""}</p>
      ${imageMarkup}
      <h2>Project Overview</h2>
      <p>${escapeHtml(projectDescription || description)}</p>
      <h2>Project Details</h2>
      <dl class="tp-project-facts">${factRows || '<div class="tp-project-fact"><dt>Details</dt><dd>Contact TruePillar Realty for the latest verified project information.</dd></div>'}</dl>
      <p class="tp-project-disclaimer">Prices, inventory, approvals and possession timelines can change. Confirm the latest cost sheet, sanctioned plans, MahaRERA details and availability before making a purchase decision. Any unverified field is intentionally not represented as confirmed.</p>
      <div class="tp-project-cta"><a href="https://wa.me/917718847841?text=${encodeURIComponent("Please share the latest details for " + (project.title || "this project"))}" rel="nofollow">Request latest price & details on WhatsApp</a><a href="/properties">Explore all properties</a>${localitySlug ? `<a href="/locations/${localitySlug}">More projects in ${escapeHtml(locality)}</a>` : ""}</div>
    </article>
  </div>
</main>
<style>
.tp-project-seo{background:#0a0a0c;color:#f8fafc;padding:36px 24px 56px;border-top:1px solid #262626}
.tp-project-seo-grid{max-width:1100px;margin:0 auto}
.tp-project-breadcrumb{max-width:1100px;margin:0 auto 28px;display:flex;flex-wrap:wrap;gap:9px;color:#9ca3af;font-size:12px}
.tp-project-breadcrumb a{color:#d4af37;text-decoration:none}
.tp-project-eyebrow{font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#d4af37;font-weight:700}
.tp-project-seo h1{font-size:clamp(28px,4vw,42px);line-height:1.15;color:#fff;margin:8px 0}
.tp-project-seo h2{font-size:20px;color:#fff;margin:28px 0 10px}
.tp-project-lead,.tp-project-seo article>p{color:#b7bec9;line-height:1.75;font-size:14px}
.tp-project-image{margin:24px 0}
.tp-project-image img{width:100%;max-height:520px;object-fit:cover;border-radius:14px;border:1px solid #292929}
.tp-project-image figcaption{font-size:11px;color:#9ca3af;margin-top:7px}
.tp-project-facts{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px;margin:16px 0}
.tp-project-fact{background:#121216;border:1px solid #292929;border-radius:10px;padding:14px}
.tp-project-fact dt{font-size:11px;color:#d4af37;text-transform:uppercase;letter-spacing:.08em}
.tp-project-fact dd{margin:5px 0 0;color:#f3f4f6;font-size:14px;line-height:1.5}
.tp-project-disclaimer{font-size:12px!important;color:#9ca3af!important;border-left:2px solid #d4af37;padding-left:12px;margin-top:20px}
.tp-project-cta{display:flex;flex-wrap:wrap;gap:12px;margin-top:22px}
.tp-project-cta a{display:inline-block;padding:12px 17px;border:1px solid #d4af37;border-radius:8px;color:#f8fafc;text-decoration:none;font-weight:650;font-size:13px}
.tp-project-cta a:first-child{background:#d4af37;color:#090909}
</style>
<script type="application/ld+json" id="tp-server-project-schema">${JSON.stringify(schema).replace(/</g, "\\u003c")}</script>`;
}

module.exports = async function handler(req, res) {
  const requestedSlug = String(req.query.slug || "").replace(/^\/+|\/+$/g, "").toLowerCase();
  if (!requestedSlug || requestedSlug.includes("/")) {
    res.status(400).send("Invalid project slug");
    return;
  }

  try {
    const documents = [];
    let pageToken = "";
    for (let page = 0; page < 10; page++) {
      const endpoint = new URL("https://firestore.googleapis.com/v1/projects/truepillar-realty/databases/(default)/documents/projects");
      endpoint.searchParams.set("pageSize", "1000");
      if (pageToken) endpoint.searchParams.set("pageToken", pageToken);
      const response = await fetch(endpoint.toString());
      if (!response.ok) throw new Error("Could not read public project data");
      const data = await response.json();
      documents.push(...(data.documents || []));
      pageToken = data.nextPageToken || "";
      if (!pageToken) break;
    }

    const projects = documents.map(doc => {
      const fields = doc.fields || {};
      const project = {};
      for (const [key, field] of Object.entries(fields)) project[key] = decodeValue(field);
      project.id = doc.name ? doc.name.split("/").pop() : "";
      project.slug = (typeof project.slug === "string" && project.slug.trim())
        ? project.slug.trim().replace(/^\/+|\/+$/g, "")
        : slugify(project.title || "");
      return project;
    });
    const project = projects.find(item =>
      item.slug.toLowerCase() === requestedSlug && item.published !== false && item.title
    );

    if (!project) {
      res.status(404).setHeader("Content-Type", "text/html; charset=utf-8");
      res.send("<!doctype html><html><head><meta name=\"robots\" content=\"noindex\"><title>Project not found | TruePillar Realty</title></head><body><h1>Project not found</h1><a href=\"/properties\">Browse properties</a></body></html>");
      return;
    }

    const pageResponse = await fetch("https://www.truepillar.in/index.html");
    if (!pageResponse.ok) throw new Error("Could not load website shell");
    let html = await pageResponse.text();

    const title = `${project.title} in ${textValue(project.subLocality || project.region || "Mumbai")} | Project Details & Price | TruePillar Realty`;
    const seoConfigRows = (Array.isArray(project.configurations) ? project.configurations : [])
      .filter(item => item && typeof item === "object")
      .map(item => ({
        name: textValue(item.configuration || item.name || item.type),
        area: textValue(item.carpetArea || item.area),
        price: textValue(item.price || item.startingPrice)
      }))
      .filter(item => item.name || item.area || item.price);
    const configuration = [...new Set(seoConfigRows.map(item => item.name).filter(Boolean))].join(", ") ||
      textValue(project.configuration || project.configurationsText);
    const configurationPricing = seoConfigRows.map(item =>
      [item.name, item.area, item.price].filter(Boolean).join(" · ")
    ).filter(Boolean).join("; ");
    const detailParts = [
      project.developer ? "by " + textValue(project.developer) : "",
      [project.subLocality, project.region].filter(Boolean).map(textValue).join(", "),
      configuration,
      configurationPricing
    ].filter(Boolean);
    let description = `${project.title}${detailParts.length ? " – " + detailParts.join(", ") : ""}. View project details and request current availability from TruePillar Realty.`;
    description = description.replace(/\s+/g, " ").slice(0, 155);
    const canonical = "https://www.truepillar.in/" + project.slug;
    const possibleImages = Array.isArray(project.images) ? project.images : [];
    const image = safeImage(project.image) || safeImage(possibleImages.find(Boolean));

    html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`);
    html = html.replace(/<meta name="description" content="[^"]*">/i, `<meta name="description" content="${escapeHtml(description)}">`);
    html = html.replace(/<link rel="canonical"[^>]*>/i, `<link rel="canonical" href="${canonical}">`);
    html = html.replace(/<meta property="og:title" content="[^"]*">/i, `<meta property="og:title" content="${escapeHtml(title)}">`);
    html = html.replace(/<meta property="og:description" content="[^"]*">/i, `<meta property="og:description" content="${escapeHtml(description)}">`);
    html = html.replace(/<meta property="og:url" content="[^"]*">/i, `<meta property="og:url" content="${canonical}">`);
    if (image) html = html.replace("</head>", `<meta property="og:image" content="${escapeHtml(image)}"><meta name="twitter:image" content="${escapeHtml(image)}"></head>`);

    // The React/Vite application already renders the visible project details.
    // Inject only structured data here to avoid rendering a second, duplicate project section below the app.
    const seoContent = renderProjectSeoContent(project, title, description, canonical, image);
    const schemaMarkup = seoContent.match(/<script type="application\/ld\+json" id="tp-server-project-schema">[\s\S]*?<\/script>/i);
    if (schemaMarkup) html = html.replace("</head>", schemaMarkup[0] + "\n</head>");

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=3600");
    res.status(200).send(html);
  } catch (error) {
    console.error("Project SEO page error:", error.message);
    res.status(503).setHeader("Content-Type", "text/plain; charset=utf-8");
    res.send("Project page temporarily unavailable");
  }
};
