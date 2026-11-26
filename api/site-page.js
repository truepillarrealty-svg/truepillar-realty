const PAGES = {
  "": {
    title: "TruePillar Realty | Premium Homes in Navi Mumbai, Thane & Mumbai | Zero Brokerage",
    description: "Find your dream property with TruePillar Realty. Browse verified residential projects across Navi Mumbai, Thane, Mumbai and Dombivli. Get pricing, floor plans and free site visit assistance."
  },
  "properties": {
    title: "Properties for Sale in Navi Mumbai, Mumbai & Thane | TruePillar Realty",
    description: "Browse residential properties across Navi Mumbai, Kharghar, Panvel, Thane, Mumbai and Dombivli. Compare configurations, prices and possession details with TruePillar Realty."
  },
  "about": {
    title: "About TruePillar Realty | MahaRERA Registered Real Estate Consultants",
    description: "Learn about TruePillar Realty, your property assistance partner for residential projects across Navi Mumbai, Mumbai, Thane and Dombivli. MahaRERA A031272401680."
  },
  "contact": {
    title: "Contact TruePillar Realty | Book a Property Site Visit",
    description: "Contact TruePillar Realty for project pricing, floor plans, availability and site visits. Call or WhatsApp +91 7718847841."
  },
  "admin": {
    title: "Admin Dashboard | TruePillar Realty",
    description: "Secure administration for TruePillar Realty property listings.",
    noindex: true
  }
};

function escapeHtml(value = "") {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function slugify(value = "") {
  return String(value).toLowerCase().trim().replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function fieldValue(field) {
  if (!field) return undefined;
  if (field.stringValue !== undefined) return field.stringValue;
  if (field.booleanValue !== undefined) return field.booleanValue;
  if (field.integerValue !== undefined) return field.integerValue;
  if (field.doubleValue !== undefined) return field.doubleValue;
  if (field.timestampValue !== undefined) return field.timestampValue;
  return undefined;
}

async function getPublishedProjects() {
  const projects = [];
  let pageToken = "";
  for (let page = 0; page < 10; page++) {
    const endpoint = new URL("https://firestore.googleapis.com/v1/projects/truepillar-realty/databases/(default)/documents/projects");
    endpoint.searchParams.set("pageSize", "1000");
    if (pageToken) endpoint.searchParams.set("pageToken", pageToken);
    const response = await fetch(endpoint.toString());
    if (!response.ok) throw new Error(`Firestore returned HTTP ${response.status}`);
    const data = await response.json();
    for (const doc of data.documents || []) {
      const fields = doc.fields || {};
      const project = {};
      for (const [key, value] of Object.entries(fields)) project[key] = fieldValue(value);
      if (project.published === false || !project.title) continue;
      project.slug = (typeof project.slug === "string" && project.slug.trim())
        ? project.slug.trim().replace(/^\\/+|\\/+$/g, "")
        : slugify(project.title);
      if (project.slug) projects.push(project);
    }
    pageToken = data.nextPageToken || "";
    if (!pageToken) break;
  }
  const unique = new Map();
  for (const project of projects) unique.set(project.slug, project);
  return [...unique.values()].sort((a, b) => String(a.title).localeCompare(String(b.title)));
}

function renderProjectDirectory(projects) {
  const items = projects.map((project, index) => {
    const location = [project.subLocality, project.region].filter(Boolean).join(", ");
    const details = [
      project.configuration || "",
      project.price || "",
      project.possession || ""
    ].filter(Boolean).map(escapeHtml).join(" · ");
    const url = "https://www.truepillar.in/" + encodeURIComponent(project.slug);
    return `<li class="tp-seo-project"><a href="${url}">${escapeHtml(project.title)}</a><span>${escapeHtml(location)}</span>${details ? `<small>${details}</small>` : ""}</li>`;
  }).join("\n");

  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Residential projects listed by TruePillar Realty",
    "numberOfItems": projects.length,
    "itemListElement": projects.map((project, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": project.title,
      "url": "https://www.truepillar.in/" + project.slug
    }))
  };

  return `
<section id="tp-seo-project-directory" aria-labelledby="tp-seo-project-heading">
  <div class="tp-seo-project-inner">
    <p class="tp-seo-eyebrow">TruePillar Realty · Project Directory</p>
    <h2 id="tp-seo-project-heading">Explore ${projects.length} Residential Projects</h2>
    <p class="tp-seo-intro">Browse residential projects across Navi Mumbai, Panvel, Kharghar, Thane, Mumbai and nearby locations. Open any project to view available details, configurations, pricing information and possession updates.</p>
    <ul class="tp-seo-project-list">${items}</ul>
    <p class="tp-seo-contact">Need help comparing projects? Call or WhatsApp <a href="https://wa.me/917718847841">+91 7718847841</a>.</p>
  </div>
</section>
<style>
#tp-seo-project-directory{background:#0a0a0c;color:#f8fafc;border-top:1px solid #292929;padding:48px 24px}
.tp-seo-project-inner{max-width:1200px;margin:0 auto}
.tp-seo-eyebrow{color:#d4af37;font-size:11px;font-weight:700;letter-spacing:.18em;text-transform:uppercase}
#tp-seo-project-heading{font-size:clamp(24px,3vw,36px);margin:8px 0 12px;color:#fff}
.tp-seo-intro{max-width:820px;color:#a1a1aa;font-size:14px;line-height:1.7}
.tp-seo-project-list{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:12px;list-style:none;padding:0;margin:28px 0}
.tp-seo-project{border:1px solid #292929;border-radius:10px;padding:14px;background:#121216;display:flex;flex-direction:column;gap:5px}
.tp-seo-project a{color:#f8fafc;font-weight:650;text-decoration:none}
.tp-seo-project a:hover{color:#d4af37}
.tp-seo-project span,.tp-seo-project small{color:#a1a1aa;font-size:12px;line-height:1.5}
.tp-seo-contact{color:#d4d4d8;font-size:13px}
.tp-seo-contact a{color:#d4af37}
</style>
<script type="application/ld+json" id="tp-seo-project-itemlist">${JSON.stringify(itemList).replace(/</g, "\\u003c")}</script>`;
}

module.exports = async function handler(req, res) {
  const slug = String(req.query.slug || "").replace(/^\\/+|\\/+$/g, "").toLowerCase();
  const page = PAGES[slug];
  if (!page) {
    res.status(404).send("Page not found");
    return;
  }
  try {
    const response = await fetch("https://www.truepillar.in/index.html");
    if (!response.ok) throw new Error("Could not load website shell");
    let html = await response.text();
    const canonical = "https://www.truepillar.in" + (slug ? "/" + slug : "/");
    html = html.replace(/<title>[\\s\\S]*?<\\/title>/i, `<title>${escapeHtml(page.title)}</title>`);
    html = html.replace(/<meta name="description" content="[^"]*">/i, `<meta name="description" content="${escapeHtml(page.description)}">`);
    html = html.replace(/<link rel="canonical"[^>]*>/i, `<link rel="canonical" href="${canonical}">`);
    html = html.replace(/<meta property="og:title" content="[^"]*">/i, `<meta property="og:title" content="${escapeHtml(page.title)}">`);
    html = html.replace(/<meta property="og:description" content="[^"]*">/i, `<meta property="og:description" content="${escapeHtml(page.description)}">`);
    html = html.replace(/<meta property="og:url" content="[^"]*">/i, `<meta property="og:url" content="${canonical}">`);
    if (page.noindex) html = html.replace(/<meta name="robots" content="[^"]*">/i, '<meta name="robots" content="noindex, nofollow">');

    if (slug === "properties") {
      try {
        const projects = await getPublishedProjects();
        if (projects.length) {
          html = html.replace("</body>", renderProjectDirectory(projects) + "\\n</body>");
        } else {
          console.warn("Properties SEO directory: Firestore returned no published projects.");
        }
      } catch (directoryError) {
        console.error("Properties SEO directory could not be generated:", directoryError.message);
      }
    }

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=3600");
    res.status(200).send(html);
  } catch (error) {
    console.error("Site page error:", error.message);
    res.status(503).send("Page temporarily unavailable");
  }
};
