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
    const details=[p.configuration,p.price,p.possession].filter(Boolean).map(esc).join(" · ");
    return '<li><a href="/'+encodeURIComponent(p.slug)+'">'+esc(p.title)+'</a><span>'+esc([p.subLocality,p.region].filter(Boolean).join(", "))+'</span>'+(details?'<small>'+details+'</small>':"")+'</li>';
  }).join("");
  const canonical="https://www.truepillar.in/locations/"+key;
  const schema={"@context":"https://schema.org","@type":"CollectionPage","name":"Residential projects in "+location.name,"url":canonical,"mainEntity":{"@type":"ItemList","numberOfItems":matches.length,"itemListElement":matches.map((p,i)=>({"@type":"ListItem","position":i+1,"name":p.title,"url":"https://www.truepillar.in/"+p.slug}))}};
  return '<section class="tp-location"><nav><a href="/">Home</a> › <a href="/properties">All Properties</a> › '+esc(location.name)+'</nav><p class="eyebrow">TruePillar Realty · Local Property Guide</p><h1>Residential Projects in '+esc(location.name)+'</h1><p class="intro">'+esc(location.copy)+'</p><h2>Projects listed in '+esc(location.name)+'</h2><p class="count">'+matches.length+' published project listings found in the current directory. Pricing and availability should be reconfirmed before a visit.</p>'+(matches.length?'<ul class="cards">'+cards+'</ul>':'<p>No published project listings are currently available for this location. <a href="/properties">Browse all properties</a>.</p>')+'<h2>What to compare before booking</h2><ul class="checks"><li>Check carpet area and configuration in the latest developer cost sheet.</li><li>Verify the MahaRERA registration and exact phase or tower.</li><li>Calculate stamp duty, registration, parking and other applicable charges separately.</li><li>Confirm current inventory, possession timeline and occupancy certificate status where applicable.</li></ul><p class="contact">Need help shortlisting? Call or WhatsApp <a href="https://wa.me/917718847841">+91 7718847841</a> or <a href="/properties">view all listed projects</a>.</p></section><style>.tp-location{background:#0a0a0c;color:#f8fafc;padding:44px 24px 60px;border-top:1px solid #292929}.tp-location>*{max-width:1200px;margin-left:auto;margin-right:auto}.tp-location nav{font-size:12px;color:#9ca3af;margin-bottom:26px}.tp-location a{color:#d4af37;text-decoration:none}.tp-location .eyebrow{color:#d4af37;font-size:11px;font-weight:700;letter-spacing:.16em;text-transform:uppercase}.tp-location h1{font-size:clamp(28px,4vw,40px);margin-top:10px;color:#fff}.tp-location h2{font-size:21px;margin-top:30px;color:#fff}.tp-location .intro{max-width:900px;color:#c0c4cc;font-size:15px;line-height:1.8}.tp-location .count{color:#a1a1aa;font-size:13px}.tp-location .cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:12px;list-style:none;padding:0;margin-top:22px}.tp-location .cards li{display:flex;flex-direction:column;gap:6px;padding:15px;background:#121216;border:1px solid #292929;border-radius:10px}.tp-location .cards li>a{color:#fff;font-weight:700}.tp-location .cards span,.tp-location .cards small{font-size:12px;color:#a1a1aa;line-height:1.5}.tp-location .checks{color:#c0c4cc;line-height:1.9;padding-left:20px}.tp-location .contact{margin-top:28px;color:#d4d4d8}</style><script type="application/ld+json">'+JSON.stringify(schema).replace(/</g,"\\u003c")+'</script>';
}

module.exports = async function handler(req,res){
  const key=String(req.query.slug||"").toLowerCase().replace(/^\/+|\/+$/g,"");
  const location=LOCATIONS[key];
  if(!location){res.status(404).send("Location not found");return;}
  try{
    const response=await fetch("https://www.truepillar.in/index.html");
    if(!response.ok) throw new Error("Could not load website shell");
    let html=await response.text();
    const canonical="https://www.truepillar.in/locations/"+key;
    html=html.replace(/<title>[\s\S]*?<\/title>/i,"<title>"+esc(location.title)+"</title>");
    html=html.replace(/<meta name="description" content="[^"]*">/i,'<meta name="description" content="'+esc(location.description)+'">');
    html=html.replace(/<link rel="canonical"[^>]*>/i,'<link rel="canonical" href="'+canonical+'">');
    html=html.replace(/<meta property="og:title" content="[^"]*">/i,'<meta property="og:title" content="'+esc(location.title)+'">');
    html=html.replace(/<meta property="og:description" content="[^"]*">/i,'<meta property="og:description" content="'+esc(location.description)+'">');
    html=html.replace(/<meta property="og:url" content="[^"]*">/i,'<meta property="og:url" content="'+canonical+'">');
    const projects=await loadProjects();
    html=html.replace("</body>",render(location,key,projects)+"\n</body>");
    res.setHeader("Content-Type","text/html; charset=utf-8");
    res.setHeader("Cache-Control","public, s-maxage=300, stale-while-revalidate=3600");
    res.status(200).send(html);
  }catch(error){
    console.error("Location SEO page error:",error.message);
    res.status(503).send("Location page temporarily unavailable");
  }
};
