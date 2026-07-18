/* Angelkarte Service Worker – Offline-Modus
   Shell + Daten: stale-while-revalidate · OSM-Tiles: cache-first (max. 600)
   API-Aufrufe (Wetter, Pegel): immer Netz */
const CACHE='angelkarte-shell-v91';
const TILES='angelkarte-tiles-v1';
const SHELL=[
  './','index.html','manifest.json',
  /* ES-Module (App-Code) */
  'js/app.js','js/state.js','js/dom.js','js/util.js','js/data.js','js/astro.js','js/mapcore.js',
  'js/region.js','js/ui.js','js/map.js','js/tackle.js','js/geo.js','js/plan.js','js/sicht.js','js/rating.js','js/reed.js','js/saison.js','js/myspots.js','js/weather.js',
  'js/tools.js','js/regeln.js','js/fangbuch.js','js/trip.js','js/fullscreen.js',
  /* Regionsdaten */
  'data/regionen.json','data/erzgebirge.json','data/elbe.json','data/main.json','data/mecklenburg.json','data/mainz.json','data/giessen.json',
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet.markercluster/1.5.3/MarkerCluster.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet.markercluster/1.5.3/MarkerCluster.Default.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet.markercluster/1.5.3/leaflet.markercluster.min.js'
];

self.addEventListener('install',e=>{
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).catch(()=>{}));
});

self.addEventListener('activate',e=>{
  e.waitUntil((async()=>{
    for(const k of await caches.keys())
      if(k!==CACHE&&k!==TILES) await caches.delete(k);
    await self.clients.claim();
  })());
});

async function trim(cache,max){
  const keys=await cache.keys();
  if(keys.length<=max) return;
  for(let i=0;i<keys.length-max;i++) await cache.delete(keys[i]);
}

self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET') return;
  const u=new URL(e.request.url);

  /* Live-APIs nie cachen */
  if(u.hostname==='api.open-meteo.com'||u.hostname.endsWith('pegelonline.wsv.de')) return;

  /* Kartenkacheln (OSM + Esri-Luftbild): cache-first, Hintergrund-Refresh, begrenzte Größe */
  if(u.hostname.endsWith('tile.openstreetmap.org')||u.hostname.endsWith('server.arcgisonline.com')){
    e.respondWith((async()=>{
      const c=await caches.open(TILES);
      const hit=await c.match(e.request);
      if(hit){
        fetch(e.request).then(r=>{if(r.ok)c.put(e.request,r.clone());}).catch(()=>{});
        return hit;
      }
      try{
        const r=await fetch(e.request);
        if(r.ok){ c.put(e.request,r.clone()); trim(c,900); }
        return r;
      }catch(err){ return new Response('',{status:503}); }
    })());
    return;
  }

  /* Shell, Daten, CDN: stale-while-revalidate */
  if(u.origin===self.location.origin||u.hostname==='cdnjs.cloudflare.com'
     ||u.hostname==='fonts.googleapis.com'||u.hostname==='fonts.gstatic.com'){
    e.respondWith((async()=>{
      const c=await caches.open(CACHE);
      const hit=await c.match(e.request);
      if(hit){
        fetch(e.request).then(r=>{if(r.ok)c.put(e.request,r.clone());}).catch(()=>{});
        return hit;
      }
      try{
        const r=await fetch(e.request);
        if(r.ok) c.put(e.request,r.clone());
        return r;
      }catch(err){
        return (await c.match('index.html'))||new Response('Offline',{status:503});
      }
    })());
  }
});
