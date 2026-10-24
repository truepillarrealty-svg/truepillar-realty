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

module.exports = async function handler(req, res) {
  const slug = String(req.query.slug || "").replace(/^\/+|\/+$/g, "").toLowerCase();
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
    html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(page.title)}</title>`);
    html = html.replace(/<meta name="description" content="[^"]*">/i, `<meta name="description" content="${escapeHtml(page.description)}">`);
    html = html.replace(/<link rel="canonical"[^>]*>/i, `<link rel="canonical" href="${canonical}">`);
    html = html.replace(/<meta property="og:title" content="[^"]*">/i, `<meta property="og:title" content="${escapeHtml(page.title)}">`);
    html = html.replace(/<meta property="og:description" content="[^"]*">/i, `<meta property="og:description" content="${escapeHtml(page.description)}">`);
    html = html.replace(/<meta property="og:url" content="[^"]*">/i, `<meta property="og:url" content="${canonical}">`);
    if (page.noindex) html = html.replace(/<meta name="robots" content="[^"]*">/i, '<meta name="robots" content="noindex, nofollow">');
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=3600");
    res.status(200).send(html);
  } catch (error) {
    res.status(503).send("Page temporarily unavailable");
  }
};
