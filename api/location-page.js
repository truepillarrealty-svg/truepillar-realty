function decodeValue(field) {
  if (!field || typeof field !== "object") return undefined;
  if ("stringValue" in field) return field.stringValue;
  if ("booleanValue" in field) return field.booleanValue;
  if ("integerValue" in field) return Number(field.integerValue);
  if ("doubleValue" in field) return field.doubleValue;
  if ("timestampValue" in field) return field.timestampValue;
  if (field.arrayValue) return (field.arrayValue.values || []).map(decodeValue);
  if (field.mapValue) return Object.fromEntries(Object.entries(field.mapValue.fields || {}).map(([k,v]) => [k,decodeValue(v)]));
  return undefined;
}
function esc(v="") { return String(v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;"); }
function slugify(v="") { return String(v).toLowerCase().trim().replace(/&/g,"and").replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,""); }

const LOCATIONS = {
  kharghar: {name:"Kharghar", title:"Flats & New Residential Projects in Kharghar | TruePillar Realty", description:"Explore residential projects in Kharghar, Navi Mumbai. Compare configurations, published prices, developers and possession information.", test:p=>/kharghar/i.test(String(p.subLocality||p.locality||"")), copy:"Kharghar is an established residential market in Navi Mumbai, with projects across multiple sectors and a mix of new and under-construction developments. Compare the exact sector, carpet area, total purchase cost, MahaRERA registration and possession date for the relevant phase."},
  panvel: {name:"Panvel", title:"New Residential Projects & Flats in Panvel | TruePillar Realty", description:"Browse residential projects in Panvel and New Panvel. Compare configurations, developers, published prices and possession updates.", test:p=>/panvel|palaspe|palaspa/i.test(String(p.subLocality||p.locality||"")), copy:"Panvel and New Panvel offer a range of residential choices, from established neighbourhoods to newer developments across the wider Panvel corridor. Compare the exact project location, carpet area, all-inclusive cost and phase-specific MahaRERA details."},
  "navi-mumbai": {name:"Navi Mumbai", title:"Residential Projects in Navi Mumbai | TruePillar Realty", description:"Explore residential projects across Kharghar, Nerul, Vashi, Seawoods, Ghansoli and other Navi Mumbai neighbourhoods.", test:p=>/navi mumbai/i.test(String(p.region||"")), copy:"Navi Mumbai includes distinct residential markets such as Kharghar, Nerul, Vashi, Seawoods, Ghansoli and Ulwe. Compare neighbourhoods as well as individual projects, considering commute, budget, configuration, possession requirement and verified approvals."},
  thane: {name:"Thane", title:"Flats & Residential Projects in Thane | TruePillar Realty", description:"Explore residential projects in Thane. Compare configurations, developer information, published prices and possession timelines.", test:p=>/thane/i.test(String(p.region||"")), copy:"Thane offers several residential neighbourhoods with different commute patterns, project types and price points. Compare the exact micro-market, carpet area, total cost, developer and MahaRERA registration before arranging a site visit."},
  vashi: {name:"Vashi", title:"Residential Projects in Vashi, Navi Mumbai | TruePillar Realty", description:"Browse residential projects in Vashi, Navi Mumbai. Review configurations, project information and published pricing.", test:p=>/vashi/i.test(String(p.subLocality||p.locality||"")), copy:"Vashi is an established Navi Mumbai neighbourhood. When comparing projects, check the exact sector, building phase, usable carpet area, total purchase cost and current availability rather than relying only on a starting price."},
  ghansoli: {name:"Ghansoli", title:"Residential Projects in Ghansoli, Navi Mumbai | TruePillar Realty", description:"Explore residential projects in Ghansoli, Navi Mumbai. Compare developer details, configurations and published prices.", test:p=>/ghansoli/i.test(String(p.subLocality||p.locality||"")), copy:"Ghansoli is an established residential and employment-linked node in Navi Mumbai. Compare project location, access, carpet area, phase-specific approvals and possession details before making a shortlist."},
  nerul: {name:"Nerul", title:"Flats & Residential Projects in Nerul, Navi Mumbai | TruePillar Realty", description:"Browse residential projects in Nerul, Navi Mumbai. Explore project details, configurations and availability.", test:p=>/nerul/i.test(String(p.subLocality||p.locality||"")), copy:"Nerul offers a mix of established residential pockets and newer developments. Compare exact location, building phase, configuration, total cost and current possession or completion status for each project."}
};

async function loadProjects() {
  const all=[]; let token="";
  for(let page=0;page<10;page++){
    const url=new URL("https://firestore.googleapis.com/v1/projects/truepillar-realty/databases/(default)/documents/projects");
    url.searchParams.set("pageSize","1000"); if(token) url.searchParams.set("pageToken",token);
    const response=await fetch(url.toString());
    if(!response.ok) throw new Error("Firestore returned HTTP "+response.status);
    const data=await response.json();
    for(const doc of data.documents||[]){
      const p={}; for(const [k,v] of Object.entries(doc.fields||{})) p[k]=decodeValue(v);
      if(!p.title||p.published===false) continue;
      p.slug=(typeof p.slug==="string"&&p.slug.trim())?p.slug.trim().replace(/^\/+|\/+$/g,""):slugify(p.title);
      all.push(p);
    }
    token=data.nextPageToken||""; if(!token) break;
  }
  const unique=new Map(); for(const p of all) unique.set(p.slug,p);
  return [...unique.values()];
}

function render(location, key, projects) {
  const matches=projects.filter(location.test).sort((a,b)=>String(a.title).localeCompare(String(b.title)));
  const cards=matches.map(p=>{
    const image=(Array.isArray(p.images)?p.images.find(Boolean):"") || p.image || "";
    const configurations=Array.isArray(p.configurations)?p.configurations.filter(Boolean):[];
    const configRows=configurations.map(c=>{
      if(typeof c==="string") return {name:c,area:"",price:""};
      return {
        name:c.configuration||c.name||c.type||"",
        area:c.carpetArea||c.area||"",
        price:c.price||c.startingPrice||""
      };
    }).filter(c=>c.name||c.area||c.price);
    const configSummary=configRows.length
      ? configRows.map(c=>[c.name,c.area,c.price].filter(Boolean).join(" · ")).join(" | ")
      : [p.configuration,p.price].filter(Boolean).join(" · ");
    const possession=p.possession||p.possessionDate||"To be confirmed";
    const status=p.statusBadge||p.status||"Residential Project";
    const imageMarkup=image
      ? '<div class="tp-location-card-image"><img src="'+esc(image)+'" alt="'+esc(p.title)+' in '+esc(location.name)+'" loading="lazy"><span>'+esc(status)+'</span></div>'
      : '<div class="tp-location-card-image tp-location-no-image"><span>'+esc(status)+'</span><b>'+esc(p.title)+'</b><small>Project image not yet available</small></div>';
    const configMarkup=configRows.length
      ? '<div class="tp-location-configs">'+configRows.slice(0,4).map(c=>'<div class="tp-location-config"><b>'+esc(c.name||"Configuration")+'</b><small>'+esc(c.area||"Area on request")+'</small><strong>'+esc(c.price||"Price on request")+'</strong></div>').join("")+'</div>'
      : '<p class="tp-location-card-config">'+esc(configSummary||"Configuration details on request")+'</p>';
    const projectUrl="/"+encodeURIComponent(p.slug);
    const wa="https://wa.me/917718847841?text="+encodeURIComponent("Hello TruePillar Realty, please share the latest details and cost sheet for "+p.title+".");
    return '<article class="tp-location-card">'+imageMarkup+'<div class="tp-location-card-body"><div class="tp-location-card-top"><span>'+esc(p.configuration||configRows.map(c=>c.name).filter(Boolean).join(", ")||"RESIDENTIAL")+'</span><small>📍 '+esc(p.subLocality||p.locality||location.name)+'</small></div><h3><a href="'+projectUrl+'">'+esc(p.title)+'</a></h3><p class="tp-location-developer">'+esc(p.developer||p.builder||"Developer details on request")+'</p>'+configMarkup+'<div class="tp-location-possession">🔑 Possession: <b>'+esc(possession)+'</b></div><div class="tp-location-card-actions"><a class="tp-location-view" href="'+projectUrl+'">VIEW DETAILS</a><a class="tp-location-enquire" href="'+wa+'" target="_blank" rel="noopener noreferrer">WHATSAPP</a></div></div></article>';
  }).join("");
  const canonical="https://www.truepillar.in/locations/"+key;
  const schema={"@context":"https://schema.org","@type":"CollectionPage","name":"Residential projects in "+location.name,"url":canonical,"mainEntity":{"@type":"ItemList","numberOfItems":matches.length,"itemListElement":matches.map((p,i)=>({"@type":"ListItem","position":i+1,"name":p.title,"url":"https://www.truepillar.in/"+p.slug}))}};
  return '<section class="tp-location"><nav><a href="/">Home</a> › <a href="/properties">All Properties</a> › '+esc(location.name)+'</nav><p class="eyebrow">TruePillar Realty · Local Property Guide</p><h1>Residential Projects in '+esc(location.name)+'</h1><p class="intro">'+esc(location.copy)+'</p><h2>Projects listed in '+esc(location.name)+'</h2><p class="count">'+matches.length+' published project listings found in the current directory. Pricing and availability should be reconfirmed before a visit.</p>'+(matches.length?'<div class="tp-location-grid">'+cards+'</div>':'<p>No published project listings are currently available for this location. <a href="/properties">Browse all properties</a>.</p>')+'<h2>What to compare before booking</h2><ul class="checks"><li>Check carpet area and configuration in the latest developer cost sheet.</li><li>Verify the MahaRERA registration and exact phase or tower.</li><li>Calculate stamp duty, registration, parking and other applicable charges separately.</li><li>Confirm current inventory, possession timeline and occupancy certificate status where applicable.</li></ul><p class="contact">Need help shortlisting? Call or WhatsApp <a href="https://wa.me/917718847841">+91 7718847841</a> or <a href="/properties">view all listed projects</a>.</p></section><style>
.tp-location{background:#0a0a0c;color:#f8fafc;padding:44px 24px 60px;border-top:1px solid #292929}
.tp-location>*{max-width:1200px;margin-left:auto;margin-right:auto}
.tp-location nav{font-size:12px;color:#9ca3af;margin-bottom:26px}
.tp-location a{color:#d4af37;text-decoration:none}
.tp-location .eyebrow{color:#d4af37;font-size:11px;font-weight:700;letter-spacing:.16em;text-transform:uppercase}
.tp-location h1{font-size:clamp(28px,4vw,40px);margin-top:10px;color:#fff}
.tp-location h2{font-size:21px;margin-top:30px;color:#fff}
.tp-location .intro{max-width:900px;color:#c0c4cc;font-size:15px;line-height:1.8}
.tp-location .count{color:#a1a1aa;font-size:13px}
.tp-location-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px;margin:24px auto 32px;max-width:1200px}
.tp-location-card{background:#121216;border:1px solid #292929;border-radius:13px;overflow:hidden;display:flex;flex-direction:column;min-width:0;box-shadow:0 12px 28px rgba(0,0,0,.22)}
.tp-location-card-image{height:205px;background:#09090b;position:relative;overflow:hidden}
.tp-location-card-image img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .4s}
.tp-location-card:hover .tp-location-card-image img{transform:scale(1.04)}
.tp-location-card-image>span{position:absolute;left:12px;top:12px;background:rgba(0,0,0,.88);border:1px solid #d4af37;color:#d4af37;border-radius:5px;padding:5px 8px;font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.08em}
.tp-location-no-image{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:9px;padding:20px;text-align:center;color:#fff}
.tp-location-no-image b{font-size:20px}
.tp-location-no-image small{color:#9ca3af;font-size:11px}
.tp-location-card-body{padding:18px;display:flex;flex-direction:column;flex:1}
.tp-location-card-top{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:8px}
.tp-location-card-top>span{color:#d4af37;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em}
.tp-location-card-top>small{color:#a1a1aa;font-size:10px;text-align:right}
.tp-location-card h3{font-size:19px;line-height:1.25;margin:0 0 7px;color:#fff}
.tp-location-card h3 a{color:#fff}
.tp-location-card h3 a:hover{color:#d4af37}
.tp-location-developer{font-size:11px;color:#a1a1aa;margin:0 0 13px}
.tp-location-configs{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;margin:0 0 13px}
.tp-location-config{background:#09090b;border:1px solid #292929;border-radius:7px;padding:9px;min-width:0}
.tp-location-config b,.tp-location-config small,.tp-location-config strong{display:block;overflow-wrap:anywhere}
.tp-location-config b{font-size:11px;color:#fff}
.tp-location-config small{font-size:10px;color:#9ca3af;margin-top:3px}
.tp-location-config strong{font-size:11px;color:#d4af37;margin-top:5px}
.tp-location-card-config{color:#cbd5e1;font-size:11px;line-height:1.6;margin:0 0 13px}
.tp-location-possession{font-size:11px;color:#9ca3af;padding:10px 0;border-top:1px solid #292929;margin-top:auto}
.tp-location-possession b{color:#fff}
.tp-location-card-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}
.tp-location-card-actions a{display:flex;align-items:center;justify-content:center;border-radius:6px;padding:11px 6px;font-size:10px;font-weight:800;letter-spacing:.04em;text-align:center}
.tp-location-view{border:1px solid #d4af37;color:#d4af37!important}
.tp-location-enquire{background:#d4af37;color:#09090b!important}
.tp-location .checks{color:#c0c4cc;line-height:1.9;padding-left:20px}
.tp-location .contact{margin-top:28px;color:#d4d4d8}
@media(max-width:900px){.tp-location-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:580px){.tp-location{padding:28px 14px 44px}.tp-location-grid{grid-template-columns:1fr;gap:14px}.tp-location-card-image{height:210px}}
</style><script type="application/ld+json">'+JSON.stringify(schema).replace(/</g,"\\u003c")+'</script>';
}
module.exports = async function handler(req,res){
  const key=String(req.query.slug||"").toLowerCase().replace(/^\/+|\/+$/g,"");
  const location=LOCATIONS[key];
  if(!location){res.status(404).send("Location not found");return;}
  try{
    const projects=await loadProjects();
    const canonical="https://www.truepillar.in/locations/"+key;
    const page=render(location,key,projects);
    const html='<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+esc(location.title)+'</title><meta name="description" content="'+esc(location.description)+'"><link rel="canonical" href="'+canonical+'"><meta property="og:type" content="website"><meta property="og:title" content="'+esc(location.title)+'"><meta property="og:description" content="'+esc(location.description)+'"><meta property="og:url" content="'+canonical+'"><meta name="theme-color" content="#09090b"><style>*{box-sizing:border-box}body{margin:0;background:#09090b;color:#f8fafc;font-family:Inter,Arial,sans-serif}.tp-header{height:70px;border-bottom:1px solid #242424;background:#0d0d10;display:flex;align-items:center;justify-content:space-between;padding:0 max(24px,calc((100% - 1200px)/2));gap:20px}.tp-brand{font-size:17px;font-weight:900;letter-spacing:.04em;color:#fff;text-decoration:none}.tp-brand span{color:#d4af37}.tp-nav{display:flex;gap:22px;align-items:center;flex-wrap:wrap}.tp-nav a{font-size:12px;font-weight:700;color:#d4d4d8;text-decoration:none}.tp-nav a:hover{color:#d4af37}.tp-header-cta{color:#111!important;background:#d4af37;padding:10px 14px;border-radius:6px}.tp-footer{border-top:1px solid #292929;background:#111114;padding:28px 24px;color:#a1a1aa;text-align:center;font-size:12px;line-height:1.8}.tp-footer a{color:#d4af37;text-decoration:none}@media(max-width:650px){.tp-header{height:auto;min-height:64px;padding:16px 18px;align-items:flex-start;flex-direction:column}.tp-nav{gap:14px}.tp-nav a{font-size:11px}}</style></head><body><header class="tp-header"><a class="tp-brand" href="https://www.truepillar.in/">TRUEPILLAR <span>REALTY</span></a><nav class="tp-nav"><a href="/">HOME</a><a href="/properties">PROPERTIES</a><a href="/about">ABOUT US</a><a href="/contact">CONTACT US</a><a class="tp-header-cta" href="https://wa.me/917718847841">WHATSAPP US</a></nav></header>'+page+'<footer class="tp-footer"><strong>TRUEPILLAR REALTY</strong><br>Property assistance across Navi Mumbai, Mumbai, Thane and nearby markets<br><a href="https://wa.me/917718847841">WhatsApp +91 7718847841</a> · <a href="https://www.truepillar.in/properties">Explore all properties</a><br>Prices, inventory, approvals and possession details must be reconfirmed with the developer.</footer></body></html>';
    res.setHeader("Content-Type","text/html; charset=utf-8");
    res.setHeader("Cache-Control","public, s-maxage=300, stale-while-revalidate=3600");
    res.status(200).send(html);
  }catch(error){
    console.error("Location SEO page error:",error.message);
    res.status(503).send("Location page temporarily unavailable");
  }
};
