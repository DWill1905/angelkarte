/* Leaflet-Karte, Marker, Filter, Popups, Standort, Liste */
import type { Spot } from './types';
import { buttonById, byId, inputById } from './dom.js';
import { state } from './state.js';
import { tackleHtml } from './tackle.js';
import { ratingHtml } from './rating.js';
import { fokusFor, hotspotAktiv, istKante, spotImFokus } from './saison.js';
import { haversine } from './astro.js';
import { CATS, FISH, fischArtenFor } from './data.js';
import { openTools } from './tools.js';
import { sunLine } from './ui.js';
import { ICON, esc } from './util.js';
import { loadWeather } from './weather.js';
/* Basiskarten. OSM ist Standard (beschriftet, gut für Orientierung); das Luftbild zeigt
   Buhnenfelder, Krautkanten und Altarm-Struktur, die in OSM schlicht nicht drin sind. */
const osmLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{
  maxZoom:18, attribution:'&copy; OpenStreetMap'
});
const satLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{
  maxZoom:18, attribution:'Luftbild &copy; Esri, Maxar, Earthstar Geographics'
});
osmLayer.addTo(state.map);
state.satAn=false;

/** Zwischen Karte und Luftbild umschalten. Gibt den neuen Zustand zurück. */
export function satToggle(): boolean {
  state.satAn=!state.satAn;
  if(state.satAn){ state.map.removeLayer(osmLayer); satLayer.addTo(state.map); }
  else { state.map.removeLayer(satLayer); osmLayer.addTo(state.map); }
  document.body.classList.toggle('sat-an', state.satAn);
  const b=byId('satBtn');
  if(b){ b.setAttribute('aria-pressed',String(state.satAn)); b.classList.toggle('on',state.satAn); }
  return state.satAn;
}
L.control.scale({imperial:false}).addTo(state.map);

/* Marker-Clustering (Leaflet.markercluster): bündelt dicht stehende Spots zu einer Zahl,
   bricht beim Reinzoomen auf. Fällt sauber zurück auf die Karte, wenn das Plugin fehlt. */
state.cluster = (typeof (L as any).markerClusterGroup === 'function')
  ? (L as any).markerClusterGroup({ maxClusterRadius: 48, showCoverageOnHover: false, spiderfyOnMaxZoom: true, disableClusteringAtZoom: 13, removeOutsideVisibleBounds: false })
  : null;
if (state.cluster) state.cluster.addTo(state.map);

export function pinIcon(cat: string, fokus = false){
  const c=CATS[cat].color;
  return L.divIcon({className:'spot-pin'+(fokus?' pin-fokus':''),iconSize:[28,40],iconAnchor:[14,38],popupAnchor:[0,-34],
    html:`<svg width="28" height="40" viewBox="0 0 28 40" aria-hidden="true">
      <path d="M14 1C7 1 1.5 6.5 1.5 13.5 1.5 23 14 38 14 38s12.5-15 12.5-24.5C26.5 6.5 21 1 14 1z"
        fill="${c}" stroke="rgba(255,255,255,.85)" stroke-width="2"/>
      <circle cx="14" cy="13.5" r="4.5" fill="rgba(255,255,255,.9)"/></svg>`});
}
export function mapsLink(s: Spot): string {return 'https://www.google.com/maps/dir/?api=1&destination='+s.lat+','+s.lng;}
export function monatLabel(ym){
  const M=['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
  const m=/^(\d{4})-(\d{2})$/.exec(ym||'');
  return m ? M[+m[2]-1]+' '+m[1] : (ym||'');
}
/** Regulatorische Badges (Motor, Schleppen, Nationalpark) – kurz und deutlich unter dem Titel. */
function badgesHtml(s: Spot): string {
  const b: string[] = [];
  if (s.motor === 'elektro') b.push('<span class="pop-badge stop">⛔ Verbrennungsmotor verboten</span>');
  if (s.schleppen === false) b.push('<span class="pop-badge stop">⚓ Schleppangeln verboten</span>');
  if (s.keinBoot) b.push('<span class="pop-badge stop">⛔ Boot/Belly-Boot verboten</span>');
  if (s.nationalpark) b.push('<span class="pop-badge np">🏞 Nationalpark – Befahrensregeln</span>');
  if (s.rlpFruehjahr) b.push('<span class="pop-badge stop">⚠ 15.4.–31.5. Kunstköder &amp; aktive Führung verboten</span>');
  if (s.flussmitte) b.push('<span class="pop-badge info">🪧 Karte nur bis Flussmitte (RLP)</span>');
  return b.length ? `<div class="pop-badges">${b.join('')}</div>` : '';
}

export function popupHtml(s: Spot): string {
  const c=CATS[s.cat];
  const beangelbar = s.cat!=='sperr' && s.cat!=='info';
  /* Reihenfolge nach Relevanz am Wasser:
     Kopf → Chancen heute → aktuelle Bedingungen → Warnung → Erlaubnis → Details (zu) → Aktionen.
     Vorher standen die Erlaubnisformalitäten vor der Fangchance, und Methode/Rig/Strecke
     bliesen das Popup auf 15 Zeilen auf. */
  return `<span class="pop-cat" style="background:${c.color}">${c.label}</span><span class="pop-nr">${s.nr}</span>
    <div class="pop-title">${s.name}</div>
    <div class="pop-dist" data-dist="${s.lat},${s.lng}"></div>
    ${badgesHtml(s)}
    ${ratingHtml(s)}
    ${!s.line&&beangelbar?'<div class="pop-row" data-wind="1"></div>':''}
    ${beangelbar?'<div class="pop-row" data-wt="'+esc((s.arten||[]).join(","))+'"></div>':''}
    <div class="pop-note${s.warn?' pop-warn':''}">${s.note}</div>
    ${s.schonzeitInfo?'<div class="pop-row"><b>Schonzeit-Besonderheit</b>'+s.schonzeitInfo+'</div>':''}
    <div class="pop-row"><b>Erlaubnis</b>${s.karte}</div>
    ${s.kartenLinks&&s.kartenLinks.length?'<div class="pop-links">'+s.kartenLinks.map(l=>'<a class="pop-link" href="'+l.url+'" target="_blank" rel="noopener">'+ICON('pin')+esc(l.label)+'</a>').join('')+'</div>':''}
    ${beangelbar?`<details class="pop-details">
      <summary>Gewässer &amp; Methode</summary>
      <div class="pop-details-body">
        ${s.strecke?'<div class="pop-row"><b>Strecke</b>'+s.strecke+'</div>':''}
        <div class="pop-row"><b>Zielfisch</b>${s.fisch}</div>
        <div class="pop-row"><b>Methode &amp; Köder</b>${s.methode}</div>
        ${s.rig?'<div class="pop-row"><b>Gerät &amp; Rig</b>'+s.rig+'</div>':''}
        ${s.zugang?'<div class="pop-row"><b>Zugang</b>'+(s.zugang==='boot'?'Überwiegend Bootssee – vom Ufer kaum möglich':'Vom Ufer beangelbar')+'</div>':''}
        ${s.hotspots&&s.hotspots.length?'<div class="pop-row"><b>Hotspots (kleine Punkte auf der Karte)</b>'+s.hotspots.map(h=>h.name).join(' · ')+'</div>':''}
      </div>
    </details>`:''}
    ${tackleHtml(s)}
    <div class="verif">${s.verif==='C'?'⚠ Beleglage schwach – Bestand dokumentiert, Zugang/Gastkarte ungesichert':s.verif==='B'?'⚠ Datenlage teils unbelegt – vor Ort verifizieren':'✓ Kerndaten belegt (Ortsdaten/Primärquellen)'}${state.REGION&&state.REGION.geprueft?' · Daten geprüft '+esc(monatLabel(state.REGION.geprueft)):''}</div>
    <div class="pop-actions">
      <a class="pop-btn nav" href="${mapsLink(s)}" target="_blank" rel="noopener">Route</a>
      <button class="pop-btn log" onclick="prefillFang('${s.name.replace(/'/g,"\\'")}')">Fang loggen</button>
      ${s.cat!=='sperr'&&s.cat!=='info'?`<button class="pop-btn trip" data-spot="${esc(s.name)}" onclick="toggleTripSpot('${s.name.replace(/'/g,"\\'")}')">☆ Merken</button>`:''}
      ${s.my?'<button class="pop-btn" style="background:#4a201a;color:#f0b6a8" onclick="delMySpot('+s.myId+')">Löschen</button>':''}
    </div>`;
}

Object.assign(state.active, Object.fromEntries(Object.keys(CATS).map(k=>[k,true])));

export function spotVisible(s: Spot): boolean {
  if(!state.active[s.cat]) return false;
  /* Ufer-Filter: reine Bootsseen ausblenden (Sperr-/Info-Spots & eigene Spots bleiben sichtbar) */
  if(state.uferOnly && s.zugang==='boot') return false;
  if(!state.fishSel.length) return true; /* kein Zielfisch-Filter aktiv */
  /* Mehrfachauswahl: Spot bleibt sichtbar, wenn er MINDESTENS eine gewählte Art führt (ODER-Logik). */
  const arten=fischArtenFor(state.fishSel);
  return s.arten.some(a=>arten.includes(a));
}
export function applyFilters(){
  const cl = state.cluster;
  /* Linien-Spots (Polylines) nie in den Cluster – markercluster ist für Punkt-Marker;
     Polylines im Cluster lassen ihr Popup sofort wieder zuklappen. */
  const zeige = (m: any, ziel: any)=>{ if(ziel){ if(!ziel.hasLayer(m)) ziel.addLayer(m); } else if(!state.map.hasLayer(m)) m.addTo(state.map); };
  const verstecke = (m: any, ziel: any)=>{ if(ziel){ if(ziel.hasLayer(m)) ziel.removeLayer(m); } else if(state.map.hasLayer(m)) m.remove(); };
  state.SPOTS.forEach(s=>{
    const v=spotVisible(s);
    const ziel = (cl && !s.line) ? cl : null; /* Punkt-Spot -> Cluster, Linie -> direkt auf Karte */
    if(v) zeige(s.marker, ziel); else verstecke(s.marker, ziel);
    (s.hotMarkers||[]).forEach(m=> v?zeige(m, cl):verstecke(m, cl)); /* Hotspots sind Punkte -> Cluster */
  });
  dimFishChips();
  renderList();
}

/* Fisch-Chips ausgrauen, für die es unter dem aktuellen Kategorie-/Ufer-Filter kein sichtbares
   Gewässer gibt (z.B. „Hecht", wenn nur „Friedfisch" aktiv ist). Rein visuell, bleibt klickbar. */
function dimFishChips(){
  fishEl.querySelectorAll('.chip[data-fish]').forEach((x: HTMLElement)=>{
    const id=x.dataset.fish||'';
    if(!id){ x.classList.remove('gone','dim'); return; } /* „Alle" nie ausblenden */
    const arten=fischArtenFor([id]);
    const da=state.SPOTS.some(s=> state.active[s.cat] && !(state.uferOnly && s.zugang==='boot') && (s.arten||[]).some(a=>arten.includes(a)));
    const sel=state.fishSel.includes(id);
    x.classList.toggle('gone', !da && !sel); /* passt nicht zur Kategorie & nicht gewählt → ausblenden */
    x.classList.toggle('dim', !da && sel);   /* gewählt, aber jetzt inkompatibel → dimmen (bleibt abwählbar) */
  });
}

export const LINECOL={gelb:'#e8b93c',gruen:'#6fae6f',allg:'#7d9bc9',sperr:'#c94f3d'};

/* Einklappbare Karten-Legende: erklärt die Pin-Farben (nur die in der Region vorhandenen Kategorien)
   und die Cluster. Farben stammen aus CATS – eine Quelle. */
export function buildLegend(){
  const el=byId('legBody'); if(!el) return;
  const present=[...new Set(state.SPOTS.map(s=>s.cat))].filter(c=>CATS[c]);
  el.innerHTML = present.map(c=>
    `<div class="leg-row"><span class="leg-dot" style="background:${CATS[c].color}"></span>${esc(CATS[c].label)}</div>`).join('')
    + '<div class="leg-row"><span class="leg-cluster">5</span>mehrere Spots – reinzoomen</div>'
    + (state.REGION&&state.REGION.flusskm&&state.REGION.flusskm.length?'<div class="leg-row"><span class="leg-km">km</span>Strom-km · <b>fett</b>=Pegel (amtlich), ≈=geschätzt</div>':'');
}
(function(){
  const t=byId('legToggle'), b=byId('legBody');
  if(t&&b) t.onclick=()=>{ const open=b.hidden; b.hidden=!open; t.setAttribute('aria-expanded',String(open)); };
})();

/* Fluss-Kilometer (Rhein) als dezente, nicht-klickbare Labels entlang des Laufs.
   Näherungsweise interpoliert – zur Orientierung an km-basierten Erlaubnisscheinen. */
export function buildRheinKm(){
  (state.kmMarker||[]).forEach(m=>{ if(state.map.hasLayer(m)) state.map.removeLayer(m); });
  state.kmMarker=[];
  const km=state.REGION&&state.REGION.flusskm;
  if(!km||!km.length) return;
  km.forEach(p=>{
    const exakt=!!p.pegel;
    const txt=String(p.km).replace('.',',');
    const icon=L.divIcon({className:'km-mark'+(exakt?' km-exakt':''),html:(exakt?'':'≈')+txt,iconSize:[exakt?34:30,15],iconAnchor:[exakt?17:15,7]});
    const m=L.marker([p.lat,p.lng],{icon,interactive:false,keyboard:false,zIndexOffset:-600,
      title:exakt?`Pegel ${p.pegel} – Strom-km ${txt} (amtlich, WSV)`:`Strom-km ${txt} (interpoliert, ±~300 m)`});
    m.addTo(state.map);
    state.kmMarker.push(m);
  });
}
export function hotPopup(parent,h){
  return `<span class="pop-cat" style="background:${CATS[parent.cat].color}">Hotspot</span>
    <div class="pop-title">${h.name}</div>
    <div class="pop-dist">gehört zu ${parent.name}</div>
    ${h.saison?'<div class="pop-row"><b>Beste Zeit</b>'+h.saison+'</div>':''}
    <div class="pop-note">${h.tipp}</div>`;
}
export function buildMarkers(){
  state.SPOTS.forEach(s=>{
    if(s.marker) return; /* bereits gebaut (Regionswechsel zurück) */
    s.hotMarkers=(s.hotspots||[]).map(h=>{
      /* Saisonale Karte: Hotspots außerhalb ihrer Saison werden gedimmt, nicht versteckt.
         Kanten-Hotspots bekommen im Herbst/Winter einen betonten Ring. */
      const aktiv=hotspotAktiv(h);
      const fk=fokusFor();
      const kante=istKante(h)&&(fk.jahreszeit==='herbst'||fk.jahreszeit==='winter');
      return L.circleMarker([h.lat,h.lng],{
        radius: aktiv?(kante?8:6):5,
        color: kante?'#f0bc5c':'#fff',
        weight: kante?3:2,
        fillColor: CATS[s.cat].color,
        fillOpacity: aktiv?.95:.35,
        opacity: aktiv?1:.45,
      }).bindPopup(hotPopup(s,h),{autoPanPadding:[20,60]})
        .bindTooltip(h.name+(aktiv?'':' · außerhalb der Saison')+(kante?' · Tiefenkante':''));
    });
    if(s.line){
      s.marker=L.polyline(s.line,{
        color:LINECOL[s.farbe]||CATS[s.cat].color,
        weight:5,opacity:.85,
        dashArray:s.farbe==='sperr'?'7 7':null
      }).bindPopup(popupHtml(s),{autoPanPadding:[20,60]});
    }else{
      s.marker=L.marker([s.lat,s.lng],{icon:pinIcon(s.cat,spotImFokus(s)),title:s.name})
        .bindPopup(popupHtml(s),{autoPanPadding:[20,60]});
    }
  });
}

/* Kategorie-Chips (pro Region neu aufgebaut, leere Kategorien ausgeblendet) */
export const chipsEl=byId('chips');
export function buildChips(){
  chipsEl.innerHTML='';
  Object.keys(CATS).forEach(k=>state.active[k]=true);
  Object.entries(CATS).forEach(([k,c])=>{
    const n=state.SPOTS.filter(s=>s.cat===k).length;
    if(!n) return;
    const b=document.createElement('button');
    b.className='chip'; b.setAttribute('aria-pressed','true');
    b.innerHTML=`<span class="dot" style="background:${c.color}"></span>${c.label} · ${n}`;
    b.onclick=()=>{
      state.active[k]=!state.active[k];
      b.classList.toggle('off',!state.active[k]);
      b.setAttribute('aria-pressed',String(state.active[k]));
      applyFilters();
    };
    chipsEl.appendChild(b);
  });
}

/* Zielfisch-Chips (Mehrfachauswahl) */
export const fishEl=byId('fishChips');
export function fishChip(label,id){
  const b=document.createElement('button');
  b.className='chip'; b.dataset.fish=id||''; b.textContent=label;
  b.setAttribute('aria-pressed',String(!!id&&state.fishSel.includes(id)));
  b.onclick=()=>{
    if(!id){ state.fishSel.length=0; } /* „Alle" leert die Auswahl */
    else {
      const i=state.fishSel.indexOf(id);
      if(i>=0) state.fishSel.splice(i,1); /* erneutes Tippen entfernt nur diesen Fisch */
      else state.fishSel.push(id);
    }
    syncFishChips();
    applyFilters();
  };
  return b;
}
export function syncFishChips(){
  fishEl.querySelectorAll('.chip[data-fish]').forEach((x: HTMLElement)=>{
    const id=x.dataset.fish||'';
    const on = id ? state.fishSel.includes(id) : state.fishSel.length===0; /* „Alle" = nichts gewählt */
    x.classList.toggle('on',on); x.setAttribute('aria-pressed',String(on));
  });
}
export const allChip=fishChip('Alle',null); allChip.classList.add('on');
allChip.onclick=()=>{ state.fishSel.length=0; syncFishChips(); applyFilters(); };
fishEl.appendChild(allChip);
FISH.forEach(f=>fishEl.appendChild(fishChip(f.id,f.id)));
export const uferBtn=document.createElement('button');
uferBtn.className='chip'; uferBtn.id='uferBtn'; uferBtn.innerHTML=ICON('pin')+' Nur Ufer';
uferBtn.setAttribute('aria-pressed','false');
uferBtn.onclick=()=>{
  state.uferOnly=!state.uferOnly;
  uferBtn.classList.toggle('on',state.uferOnly);
  uferBtn.setAttribute('aria-pressed',String(state.uferOnly));
  applyFilters();
};
fishEl.appendChild(uferBtn);
export const toolsBtn=buttonById('toolsFab');
if(toolsBtn) toolsBtn.onclick=openTools;

/* Standort */

export const locBtn=buttonById('locbtn');
/* Warnt, wenn der eigene Standort nahe an einer eingetragenen Sperrzone liegt.
   Ehrlich: Sperrzonen sind als Punkte erfasst, nicht als Polygone – deshalb ist das
   ein Hinweis zum Nachschauen, keine exakte Grenze. */
export function sperrWarnung(){
  const box=byId('sperrWarn');
  if(!box) return null;
  if(!state.userPos||!state.SPOTS.length){ box.hidden=true; return null; }
  const RADIUS_KM=1.5;
  const nah=state.SPOTS
    .filter(s=>s.cat==='sperr'&&typeof s.lat==='number')
    .map(s=>({s,d:haversine(state.userPos[0],state.userPos[1],s.lat,s.lng)}))
    .filter(x=>x.d<=RADIUS_KM)
    .sort((a,b)=>a.d-b.d);
  if(!nah.length){ box.hidden=true; return null; }
  box.innerHTML='<b>⛔ Sperrzone in der Nähe</b>'
    + nah.map(x=>'<div style="margin-top:3px">'+esc(x.s.name)+' · ca. '+x.d.toFixed(1)+' km</div>').join('')
    + '<div style="margin-top:5px;font-size:11px;opacity:.85">Punktangabe, keine exakte Grenze – Beschilderung vor Ort prüfen.</div>';
  box.hidden=false;
  return nah[0];
}

export function locApply(p){
  state.userPos=[p.coords.latitude,p.coords.longitude];
  if(state.userMarker) state.userMarker.remove();
  state.userMarker=L.circleMarker(state.userPos,{radius:7,color:'#fff',fillColor:'#6ea8c4',fillOpacity:.95,weight:2})
    .addTo(state.map).bindTooltip('Du');
  state.map.setView(state.userPos,11);
  renderList();
  sperrWarnung();
  if(sheet) sheet.classList.remove('collapsed'); /* Spotliste zeigen, damit nächste Spots sichtbar */
  state.wxKey=''; loadWeather();
  if(typeof sunLine==='function') sunLine();
}
export function locFail(err){
  const code=err&&err.code;
  const msgs={
    1:'Standortfreigabe verweigert.\n\niPhone: Einstellungen → Datenschutz & Sicherheit → Ortungsdienste → Safari-Websites (bzw. die Home-Bildschirm-App) → "Beim Verwenden" + Website-Berechtigung erlauben.\n\nAndroid/Chrome: Schloss-Symbol in der Adressleiste → Berechtigungen → Standort zulassen.',
    2:'Position derzeit nicht ermittelbar (kein GPS-/WLAN-Fix). Kurz unter freien Himmel und nochmal versuchen.',
    3:'Zeitüberschreitung bei der Ortung – bitte erneut versuchen.'
  };
  alert(msgs[code]||('Standortfehler: '+((err&&err.message)||'unbekannt')));
}
locBtn.onclick=()=>{
  if(!navigator.geolocation) return alert('Standort wird von diesem Gerät/Browser nicht unterstützt.');
  if(window.isSecureContext===false) return alert('Standort erfordert HTTPS.');
  locBtn.disabled=true; const txt=locBtn.textContent; locBtn.textContent='⏳ Orte…';
  const finish=fn=>x=>{locBtn.disabled=false;locBtn.textContent=txt;fn(x);};
  navigator.geolocation.getCurrentPosition(
    finish(locApply),
    err=>{
      if(err&&err.code===3){
        /* iOS braucht für den ersten Fix oft länger: zweiter Versuch über watchPosition.
           done-Flag + nachgelagertes clearWatch decken auch synchrone Callbacks ab. */
        let wid=null, settled=false;
        const stop=()=>{ if(wid!=null){navigator.geolocation.clearWatch(wid);wid=null;} };
        wid=navigator.geolocation.watchPosition(
          p=>{settled=true;stop();finish(locApply)(p);},
          e=>{settled=true;stop();finish(locFail)(e);},
          {enableHighAccuracy:true,timeout:20000,maximumAge:0}
        );
        if(settled) stop();
      } else finish(locFail)(err);
    },
    {enableHighAccuracy:true,timeout:12000,maximumAge:60000}
  );
};

/* Spotliste */
export const listEl=byId('spotList'), countEl=byId('spotCount');
export const sortEl=byId('spotSort');
export const searchEl=inputById('spotSearch');
export let spotQuery='';
export const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
export function renderList(){
  listEl.innerHTML='';
  let vis=state.SPOTS.filter(spotVisible);
  if(spotQuery){
    const q=spotQuery.toLowerCase();
    vis=vis.filter(s=>
      (s.name||'').toLowerCase().includes(q) ||
      (s.fisch||'').toLowerCase().includes(q) ||
      (s.arten||[]).some(a=>a.toLowerCase().includes(q)) ||
      (s.nr||'').toLowerCase().includes(q));
  }
  if(state.userPos){
    vis.forEach(s=>s._d=haversine(state.userPos[0],state.userPos[1],s.lat,s.lng));
    vis.sort((a,b)=>a._d-b._d);
  }
  countEl.textContent='('+vis.length+')';
  if(sortEl) sortEl.textContent = state.userPos ? '  · nach Entfernung' : '';
  if(!vis.length){
    listEl.innerHTML=spotQuery
      ? '<div class="fb-empty" style="padding:20px">Kein Treffer für „'+esc(spotQuery)+'". Suchbegriff löschen oder anderen Namen/Fischart probieren.</div>'
      : '<div class="fb-empty" style="padding:20px">Keine Gewässer sichtbar – die Filter oben blenden gerade alles aus. Tippe Kategorie- oder Zielfisch-Chips an, um sie wieder einzublenden.</div>';
    return;
  }
  vis.forEach((s,idx)=>{
    const c=CATS[s.cat], b=document.createElement('button');
    b.className='spot-item'+(state.userPos&&idx===0?' nearest':'');
    const meta=state.userPos?s._d.toFixed(1)+' km'+(idx===0?' ★':''):s.fisch.split(',')[0];
    b.innerHTML=`<span class="dot" style="background:${c.color}"></span>
      <span class="name">${s.name}</span><span class="meta">${meta}</span>`;
    b.onclick=()=>{
      let opened=false;
      const open=()=>{if(!opened){opened=true;s.marker.openPopup(s.line?[s.lat,s.lng]:undefined);}};
      if(s.line){
        state.map.fitBounds(s.marker.getBounds(),{padding:[40,40]});
        state.map.once('moveend',open); setTimeout(open,800);
      }else if(reduceMotion){state.map.setView([s.lat,s.lng],13);open();}
      else{
        state.map.flyTo([s.lat,s.lng],13,{duration:.6});
        state.map.once('moveend',open);
        setTimeout(open,800); /* Fallback: Ziel = aktuelle Ansicht */
      }
      if(window.innerWidth<820) sheet.classList.add('collapsed');
    };
    listEl.appendChild(b);
  });
}
renderList();

export const sheet=byId('sheet'), handle=byId('sheetHandle');
export function toggleSheet(){ sheet.classList.toggle('collapsed'); }
handle.onclick=toggleSheet;
if(searchEl){
  searchEl.oninput=()=>{ spotQuery=searchEl.value.trim(); renderList(); };
  /* Klick ins Suchfeld darf das Sheet nicht zuklappen */
  searchEl.onclick=e=>e.stopPropagation();
}
handle.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();toggleSheet();}};


/* ===== Offline-Kacheln: aktuellen Ausschnitt sichern (OSM-policy-konform, kein Bulk) ===== */
function lon2tile(lon,z){return Math.floor((lon+180)/360*Math.pow(2,z));}
function lat2tile(lat,z){const r=lat*Math.PI/180;return Math.floor((1-Math.log(Math.tan(r)+1/Math.cos(r))/Math.PI)/2*Math.pow(2,z));}
export async function cacheViewport(prog){
  if(!state.map||!('caches' in window)) return {total:0,done:0,noSupport:true};
  const b=state.map.getBounds(), z0=Math.round(state.map.getZoom());
  const zooms=[z0]; if(z0+1<=16) zooms.push(z0+1);
  const urls=[];
  for(const z of zooms){
    const xa=lon2tile(b.getWest(),z), xb=lon2tile(b.getEast(),z);
    const ya=lat2tile(b.getNorth(),z), yb=lat2tile(b.getSouth(),z);
    for(let x=Math.min(xa,xb);x<=Math.max(xa,xb);x++)
      for(let y=Math.min(ya,yb);y<=Math.max(ya,yb);y++)
        urls.push('https://tile.openstreetmap.org/'+z+'/'+x+'/'+y+'.png');
  }
  if(urls.length>400) return {total:urls.length,done:0,tooMany:true};
  const cache=await caches.open('angelkarte-tiles-v1');
  let done=0, ok=0;
  for(const url of urls){
    try{
      const hit=await cache.match(url);
      if(hit){ ok++; }
      else{ const r=await fetch(url,{mode:'no-cors'}); await cache.put(url,r); ok++; }
    }catch(e){}
    done++; if(prog) prog(done,urls.length);
  }
  return {total:urls.length,done,ok};
}
export const offDlg=byId('offDlg');
export async function openOffline(){
  const body=byId('offBody');
  offDlg.hidden=false;
  if(!('caches' in window)){ body.innerHTML='<p>Offline-Speichern wird von diesem Browser nicht unterstützt.</p>'; return; }
  body.innerHTML='<p style="color:var(--muted)">Sichere den aktuellen Kartenausschnitt (aktuelle + eine tiefere Zoomstufe) für die Offline-Nutzung …</p><p id="offProg" style="font-family:\'Space Mono\',monospace;margin-top:8px">0 %</p>';
  const prog=(d,t)=>{const el=byId('offProg'); if(el) el.textContent=Math.round(d/t*100)+' %  ('+d+'/'+t+' Kacheln)';};
  const res=await cacheViewport(prog);
  if(res.noSupport){ body.innerHTML='<p>Offline-Speichern nicht unterstützt.</p>'; return; }
  if(res.tooMany){
    body.innerHTML='<p>⚠ Der Ausschnitt umfasst zu viele Kacheln ('+res.total+'). Bitte näher heranzoomen (auf dein Angelrevier) und erneut sichern – so bleibt es fair gegenüber dem OpenStreetMap-Kachelserver.</p>';
    return;
  }
  body.innerHTML='<p>✓ <b>'+res.ok+' Kacheln</b> für diesen Ausschnitt sind offline verfügbar. Am Wasser ohne Netz bleibt die Karte hier sichtbar.</p>'
    +'<p style="color:var(--muted);margin-top:8px;font-size:11.5px">Hinweis: Nur der aktuell sichtbare Bereich wird gesichert (kein Massen-Download – das verstößt gegen die OSM-Nutzungsregeln). Für weitere Reviere jeweils dorthin zoomen und erneut sichern.</p>';
}
if(offDlg){
  byId('offClose').onclick=()=>{offDlg.hidden=true;};
  offDlg.addEventListener('click',e=>{if(e.target===offDlg)offDlg.hidden=true;});
}
