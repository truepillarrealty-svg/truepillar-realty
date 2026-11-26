const BASE_URLS = [
  "https://www.truepillar.in/",
  "https://www.truepillar.in/properties",
  "https://www.truepillar.in/about",
  "https://www.truepillar.in/contact",
  "https://www.truepillar.in/privacy-policy.html",
  "https://www.truepillar.in/locations/kharghar",
  "https://www.truepillar.in/locations/panvel",
  "https://www.truepillar.in/locations/navi-mumbai",
  "https://www.truepillar.in/locations/thane",
  "https://www.truepillar.in/locations/vashi",
  "https://www.truepillar.in/locations/ghansoli",
  "https://www.truepillar.in/locations/nerul"
];

// Complete backup inventory of the 109 project URLs currently published in Firestore.
// The live Firestore list is still merged in at request time, so future admin additions
// are included automatically; this snapshot protects the sitemap during a Firestore outage.
const FALLBACK_PROJECT_SLUGS = [
  "paradise-sai-world-empire",
  "satyam-le-36",
  "bhoomi-serenity",
  "queens-necklace",
  "vastu-park",
  "sai-proviso-atlantis",
  "sai-residency",
  "paradise-sai-platinum",
  "metrosatyam-grand-atlantis",
  "shreeji-divine",
  "paradise-sai-suncity",
  "lodha-casa-premier",
  "tharwani-pristinea",
  "godrej-varanya",
  "paradise-sai-prerna",
  "today-codename-upvan",
  "ak-sapphire-kharghar",
  "aramus-the-domus-menarco-kharghar",
  "arihant-advika-vashi-sector-9",
  "arihant-aleenta-vashi-sector-9",
  "arihant-aloki-phase-4-karjat",
  "arihant-aspire-palaspe-phata",
  "arihant-clan-aalishan-phase-2-kharghar-sector-37",
  "arihant-world-villas-chouk",
  "aurum-q-living-ghansoli",
  "balaji-delta-hills-ulwe",
  "bhagwati-celestria-ttc-industrial-area",
  "dwarka-chs-kopar-khairane-sector-14",
  "emaar-casa-venero-alibaug",
  "embassy-serenity-alibaug",
  "ev-23-malibu-west-kopar-khairane-sector-23",
  "ev-23-miami-west-kopar-khairane",
  "ev-9-square-vashi-sector-9",
  "gajra-bhoomi-serenity-kharghar",
  "gami-avant-vashi-sector-18",
  "gami-ayur-vashi-sector-18",
  "gami-mirava-panvel-sector-21",
  "gami-satyam-skyscape-ghansoli",
  "gami-telon-ghansoli-sector-3",
  "gami-vraj-sanpada-sector-24",
  "geecee-emerald-kharghar",
  "godrej-bayview-vashi-vashi-sector-9",
  "godrej-eternal-palms-sanpada",
  "godrej-golf-crest-panvel",
  "godrej-golf-side-estate-panvel",
  "godrej-green-terraces-panvel",
  "godrej-the-highlands-panvel",
  "godrej-woodside-estate-karjat-khopoli-marg",
  "goodwill-wisteria-vashi-sector-19d",
  "haware-intelligentia-centroid-vashi-sector-19e",
  "haware-intelligentia-supreme-kalamboli",
  "hitech-cosmos-kharghar",
  "hoabl-forever-land-pimploli-bk",
  "juhi-elegance-ghansoli-sector-9",
  "k-raheja-jade-city-juinagar",
  "kalpataru-park-riviera-panvel",
  "kamdhenu-crown-sanpada-sector-19",
  "kamdhenu-pinnacle-nerul-sector-13",
  "kolte-patil-la-vita-vashi-sector-2",
  "lakhani-bliss-ulwe-sector-9",
  "landt-crestoria-estate-panvel",
  "landt-seawoods-residences-phase-2-seawoods",
  "landt-seawoods-residences-seawoods",
  "landt-the-villas-at-seawoods-residences-seawoods",
  "landt-west-manor-seawoods",
  "lnt-west-square-seawoods",
  "lodha-aero-estate-khopoli",
  "lodha-alibaug-alibaug",
  "lodha-villa-cerro-khopoli",
  "marathon-nexzone-nirvana-palaspe-phata",
  "metro-aykon-vashi-sector-19d",
  "metro-kings-court-old-panvel",
  "metro-satyam-queens-necklace-rohinjan",
  "paradise-sai-palm-view-nerul",
  "paradise-sai-prerna-kharghar-sector-34a",
  "paradise-sai-world-one-nerul",
  "paradise-sai-world-pyramid-nerul",
  "platinum-sicily-nerul",
  "progressive-aura-ulwe-sector-3",
  "pyramid-centria-nerul-sector-10a",
  "qualcon-celestia-kharghar",
  "raheja-atlantis-juinagar",
  "raheja-lunaris-juinagar",
  "raheja-solaris-juinagar",
  "sai-neel-riddhi-empire-old-panvel",
  "saiyogi-sai-residency-kharghar",
  "satyam-altura-sanpada-sector-7",
  "satyam-ashtavinayak-vashi-sector-15",
  "satyam-grand-atlantis-kharghar-sector-36",
  "satyam-one-crest-kharghar-sector-20",
  "satyam-stella-kopar-khairane-sector-3",
  "satyam-surya-manhattan-kharghar",
  "satyam-trinity-towers-kharghar-sector-36",
  "satyam-veloura-vashi-sector-14",
  "shapoorji-pallonji-indias-wellness-capital-khopoli",
  "tata-orbis-ghansoli",
  "today-altus-24-airoli",
  "today-kharghar-hills-adivali",
  "today-nova-vista-nerul",
  "today-saubhagyam-palaspe-phata",
  "today-tattvam-new-panvel",
  "today-upvan-dhansar",
  "total-violet-hill-alibaug",
  "tricity-aspire-kharghar-sector-34a",
  "tricity-aura-roadpali",
  "tricity-bayview-roadpali",
  "varsha-balaji-park-kharghar",
  "varsha-balaji-sapphire-nerul-sector-19a",
  "varsha-balaji-vista-new-panvel-east"
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
      if (slug && !["properties", "about", "contact", "admin", "site-visit"].includes(slug)) {
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

  const urls = [...BASE_URLS, ...projectSlugs.map(slug => `https://www.truepillar.in/${slug}`)];
  const uniqueUrls = [...new Set(urls)];
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    uniqueUrls.map(url => `  <url><loc>${url}</loc></url>`).join("\n") +
    "\n</urlset>\n";

  res.setHeader("X-Sitemap-Source", source);
  res.status(200).send(body);
};
