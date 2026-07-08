/* Leaflet-Karte, Marker, Filter, Popups, Standort, Liste */
import { state } from './state.js';
import { haversine } from './astro.js';
import { CATS } from './data.js';
import { prefillFang } from './fangbuch.js';
import { openTools } from './tools.js';
import { sunLine } from './ui.js';
import { ICON, esc } from './util.js';
import { loadWeather } from './weather.js';
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
  maxZoom:18, attribution:'&copy; OpenStreetMap'
}).addTo(state.map);
L.control.scale({imperial:false}).addTo(state.map);

export function pinIcon(cat){
  const c=CATS[cat].color;
  return L.divIcon({className:'',iconSize:[28,40],iconAnchor:[14,38],popupAnchor:[0,-34],
    html:`<svg width="28" height="40" viewBox="0 0 28 40" aria-hidden="true">
      <path d="M14 1C7 1 1.5 6.5 1.5 13.5 1.5 23 14 38 14 38s12.5-15 12.5-24.5C26.5 6.5 21 1 14 1z"
        fill="${c}" stroke="rgba(255,255,255,.85)" stroke-width="2"/>
      <circle cx="14" cy="13.5" r="4.5" fill="rgba(255,255,255,.9)"/></svg>`});
}
export function mapsLink(s){return 'https://www.google.com/maps/dir/?api=1&destination='+s.lat+','+s.lng;}
export function popupHtml(s){
  const c=CATS[s.cat];
  return `<span class="pop-cat" style="background:${c.color}">${c.label}</span><span class="pop-nr">${s.nr}</span>
    <div class="pop-title">${s.name}</div>
    <div class="pop-dist" data-dist="${s.lat},${s.lng}"></div>
    ${s.strecke?'<div class="pop-row"><b>Strecke</b>'+s.strecke+'</div>':''}
    <div class="pop-row"><b>Zielfisch</b>${s.fisch}</div>
    <div class="pop-row"><b>Methode &amp; Köder</b>${s.methode}</div>
    ${s.rig?'<div class="pop-row"><b>Gerät &amp; Rig</b>'+s.rig+'</div>':''}
    <div class="pop-row"><b>Erlaubnis</b>${s.karte}</div>
    ${s.kartenLinks&&s.kartenLinks.length?'<div class="pop-links">'+s.kartenLinks.map(l=>'<a class="pop-link" href="'+l.url+'" target="_blank" rel="noopener">'+ICON('pin')+esc(l.label)+'</a>').join('')+'</div>':''}
    ${s.zugang?'<div class="pop-row"><b>Zugang</b>'+(s.zugang==='boot'?'Überwiegend Bootssee – vom Ufer kaum möglich':'Vom Ufer beangelbar')+'</div>':''}
    ${!s.line&&(s.cat==='raub'||s.cat==='fried')?'<div class="pop-row" data-wind="1"></div>':''}
    <div class="pop-note${s.warn?' pop-warn':''}">${s.note}</div>
    ${s.schonzeitInfo?'<div class="pop-row"><b>Schonzeit-Besonderheit</b>'+s.schonzeitInfo+'</div>':''}
    ${s.hotspots&&s.hotspots.length?'<div class="pop-row" style="margin-top:8px"><b>Hotspots (kleine Punkte auf der Karte)</b>'+s.hotspots.map(h=>h.name).join(' · ')+'</div>':''}
    <div class="verif">${s.verif==='C'?'⚠ Beleglage schwach – Bestand dokumentiert, Zugang/Gastkarte ungesichert':s.verif==='B'?'⚠ Datenlage teils unbelegt – vor Ort verifizieren':'✓ Kerndaten belegt (Ortsdaten/Primärquellen)'}</div>
    <div class="pop-actions">
      <a class="pop-btn nav" href="${mapsLink(s)}" target="_blank" rel="noopener">Route</a>
      <button class="pop-btn log" onclick="prefillFang('${s.name.replace(/'/g,"\\'")}')">Fang loggen</button>
      ${s.my?'<button class="pop-btn" style="background:#4a201a;color:#f0b6a8" onclick="delMySpot('+s.myId+')">Löschen</button>':''}
    </div>`;
}

export const FISH=[
  {id:'Hecht',match:['Hecht']},
  {id:'Zander',match:['Zander']},
  {id:'Barsch',match:['Barsch']},
  {id:'Forelle',match:['Bachforelle','Regenbogenforelle']},
  {id:'Äsche',match:['Äsche']},
  {id:'Döbel',match:['Döbel']},
  {id:'Karpfen',match:['Karpfen']},
  {id:'Schleie',match:['Schleie']},
  {id:'Aal',match:['Aal']},
  {id:'Rapfen',match:['Rapfen']},
  {id:'Wels',match:['Wels']},
  {id:'Brachse',match:['Brachse']}
];


Object.assign(state.active, Object.fromEntries(Object.keys(CATS).map(k=>[k,true])));

export function spotVisible(s){
  if(!state.active[s.cat]) return false;
  /* Ufer-Filter: reine Bootsseen ausblenden (Sperr-/Info-Spots & eigene Spots bleiben sichtbar) */
  if(state.uferOnly && s.zugang==='boot') return false;
  if(!state.fishSel) return true;
  const f=FISH.find(x=>x.id===state.fishSel);
  return s.arten.some(a=>f.match.includes(a));
}
export function applyFilters(){
  state.SPOTS.forEach(s=>{
    const v=spotVisible(s);
    if(v&&!state.map.hasLayer(s.marker)) s.marker.addTo(state.map);
    else if(!v&&state.map.hasLayer(s.marker)) s.marker.remove();
    (s.hotMarkers||[]).forEach(m=>{
      if(v&&!state.map.hasLayer(m)) m.addTo(state.map);
      else if(!v&&state.map.hasLayer(m)) m.remove();
    });
  });
  renderList();
}

export const LINECOL={gelb:'#e8b93c',gruen:'#6fae6f',allg:'#7d9bc9',sperr:'#c94f3d'};
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
    s.hotMarkers=(s.hotspots||[]).map(h=>
      L.circleMarker([h.lat,h.lng],{radius:6,color:'#fff',weight:2,fillColor:CATS[s.cat].color,fillOpacity:.95})
        .bindPopup(hotPopup(s,h),{autoPanPadding:[20,60]}).bindTooltip(h.name)
    );
    if(s.line){
      s.marker=L.polyline(s.line,{
        color:LINECOL[s.farbe]||CATS[s.cat].color,
        weight:5,opacity:.85,
        dashArray:s.farbe==='sperr'?'7 7':null
      }).bindPopup(popupHtml(s),{autoPanPadding:[20,60]});
    }else{
      s.marker=L.marker([s.lat,s.lng],{icon:pinIcon(s.cat),title:s.name})
        .bindPopup(popupHtml(s),{autoPanPadding:[20,60]});
    }
  });
}

/* Kategorie-Chips (pro Region neu aufgebaut, leere Kategorien ausgeblendet) */
export const chipsEl=document.getElementById('chips');
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

/* Zielfisch-Chips (Einfachauswahl) */
export const fishEl=document.getElementById('fishChips');
export function fishChip(label,id){
  const b=document.createElement('button');
  b.className='chip'; b.dataset.fish=id||''; b.textContent=label;
  b.setAttribute('aria-pressed',String(id===state.fishSel));
  b.onclick=()=>{
    state.fishSel=(id===state.fishSel)?null:id; /* erneutes Tippen hebt Filter auf */
    syncFishChips();
    applyFilters();
  };
  return b;
}
export function syncFishChips(){
  fishEl.querySelectorAll('.chip[data-fish]').forEach(x=>{
    const on=(x.dataset.fish||null)===state.fishSel||(!state.fishSel&&x.dataset.fish==='');
    x.classList.toggle('on',on); x.setAttribute('aria-pressed',String(on));
  });
}
export const allChip=fishChip('Alle',null); allChip.classList.add('on');
allChip.onclick=()=>{ state.fishSel=null; syncFishChips(); applyFilters(); };
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
export const toolsBtn=document.createElement('button');
toolsBtn.className='chip'; toolsBtn.id='toolsBtn'; toolsBtn.innerHTML=ICON('tools')+' Werkzeuge';
toolsBtn.onclick=openTools;
fishEl.appendChild(toolsBtn);

/* Standort */

export const locBtn=document.getElementById('locbtn');
export function locApply(p){
  state.userPos=[p.coords.latitude,p.coords.longitude];
  if(state.userMarker) state.userMarker.remove();
  state.userMarker=L.circleMarker(state.userPos,{radius:7,color:'#fff',fillColor:'#6ea8c4',fillOpacity:.95,weight:2})
    .addTo(state.map).bindTooltip('Du');
  state.map.setView(state.userPos,11);
  renderList();
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
export const listEl=document.getElementById('spotList'), countEl=document.getElementById('spotCount');
export const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
export function renderList(){
  listEl.innerHTML='';
  let vis=state.SPOTS.filter(spotVisible);
  if(state.userPos){
    vis.forEach(s=>s._d=haversine(state.userPos[0],state.userPos[1],s.lat,s.lng));
    vis.sort((a,b)=>a._d-b._d);
  }
  countEl.textContent='('+vis.length+')';
  if(!vis.length){
    listEl.innerHTML='<div class="fb-empty" style="padding:20px">Keine Gewässer sichtbar – die Filter oben blenden gerade alles aus. Tippe Kategorie- oder Zielfisch-Chips an, um sie wieder einzublenden.</div>';
    return;
  }
  vis.forEach(s=>{
    const c=CATS[s.cat], b=document.createElement('button');
    b.className='spot-item';
    const meta=state.userPos?s._d.toFixed(1)+' km':s.fisch.split(',')[0];
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

export const sheet=document.getElementById('sheet'), handle=document.getElementById('sheetHandle');
export function toggleSheet(){ if(window.innerWidth<820) sheet.classList.toggle('collapsed'); }
handle.onclick=toggleSheet;
handle.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();toggleSheet();}};

