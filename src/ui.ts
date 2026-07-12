/* Header (Sonne/Banner) & Tabs */
import { byId, qsa } from './dom.js';
import { state } from './state.js';
import { fokusFor, hotspotAktiv, spotImFokus } from './saison.js';
import { hhmm, inWindow, mondPhase, sunTimes } from './astro.js';
import { ICON, esc } from './util.js';
export function regionCenter(){
  const pts=(state.SPOTS||[]).filter(sp=>!sp.my);
  if(state.userPos) return {lat:state.userPos[0],lng:state.userPos[1]};
  if(pts.length) return {lat:pts.reduce((a,s)=>a+s.lat,0)/pts.length,lng:pts.reduce((a,s)=>a+s.lng,0)/pts.length};
  return {lat:50.80,lng:13.33};
}
export function sunLine(){
  const c=regionCenter();
  const st=sunTimes(c.lat,c.lng,new Date());
  if(!st){ byId('sunline').innerHTML=ICON('moon')+' '+esc(mondPhase(new Date())); return; }
  let txt=ICON('sun')+' '+hhmm(st.rise)+' – '+hhmm(st.set)+' Uhr · '+esc(mondPhase(new Date()));
  if(st.dawn&&st.dusk) txt+=' · '+ICON('waves')+' blaue Stunde '+hhmm(st.dusk)+'–'+hhmm(new Date(st.dusk.getTime()+40*60e3));
  /* Nachtangel-Fenster nur wo Regel dokumentiert ist */
  if(state.REGION&&state.REGION.nachtangeln==='lvsa'){
    const a=new Date(st.set.getTime()+3600e3), b=new Date(st.rise.getTime()-3600e3);
    txt+=' · '+ICON('moon')+' Nachtangeln erlaubt '+hhmm(a)+'–'+hhmm(b);
  } else if(state.REGION&&state.REGION.nachtangeln==='frei'){
    txt+=' · '+ICON('moon')+' Nachtangeln erlaubt';
  } else if(state.REGION&&state.REGION.nachtangeln==='verboten'){
    txt+=' · '+ICON('x')+' kein Nachtangeln (TWT/Salmo)';
  }
  byId('sunline').innerHTML=txt;
}

export const banner=byId('banner');
export function buildBanner(){
  banner.classList.remove('show'); banner.innerHTML='';
  const hit=(state.REGION.banner||[]).find(x=>inWindow(x.von,x.bis));
  if(hit){banner.innerHTML=hit.text;banner.classList.add('show');}
}

/* ============ Tabs ============ */
qsa<HTMLElement>('.tab').forEach(t=>{
  t.onclick=()=>{
    qsa<HTMLElement>('.tab').forEach(x=>x.setAttribute('aria-selected','false'));
    qsa<HTMLElement>('.view').forEach(x=>x.classList.remove('active'));
    t.setAttribute('aria-selected','true');
    document.getElementById('view-'+t.dataset.view).classList.add('active');
    if(t.dataset.view==='karte') setTimeout(()=>state.map.invalidateSize(),50);
  };
});

/* ===== Saisonale Karte: Leiste + Erklärung =====
   Hebt hervor, was in dieser Jahreszeit zählt – auf Basis der echten Saison-Angaben
   der Hotspots und des Gewässercharakters. Es werden KEINE Krautfelder oder
   Tiefenkanten als Flächen gezeichnet; dafür gibt es keine belastbaren Daten. */
export function buildSaisonBar(): void {
  const tip = byId('saisonTip');
  const info = byId('saisonInfo');
  if (!tip || !info) return;
  const f = fokusFor();
  const ICONS: Record<string, string> = { fruehjahr: 'waves', sommer: 'sun', herbst: 'wind', winter: 'moon' };

  const aktive = state.SPOTS.reduce((n, s) => n + (s.hotspots || []).filter((h) => hotspotAktiv(h)).length, 0);
  const gesamt = state.SPOTS.reduce((n, s) => n + (s.hotspots || []).length, 0);
  const fokusSpots = state.SPOTS.filter((s) => spotImFokus(s, f)).length;

  /* Header-Icon spiegelt die Jahreszeit und öffnet den Tipp als Overlay. */
  tip.innerHTML = ICON(ICONS[f.jahreszeit] || 'sun');
  tip.title = 'Gewässer-Tipp: ' + f.titel;

  const body = byId('saisonBody') || info;
  body.innerHTML = '<div style="display:flex;align-items:center;gap:7px;margin-bottom:7px">'
    + '<span class="jz">' + esc(f.titel) + '</span>'
    + '<span style="color:var(--muted);flex:1">' + esc(f.betont) + '</span>'
    + '<button type="button" id="saisonClose" aria-label="Schließen" style="background:none;border:0;color:var(--muted);font-size:17px;line-height:1;cursor:pointer;padding:0 2px">×</button>'
    + '</div>'
    + '<div>' + esc(f.hinweis) + '</div>'
    + '<div style="margin-top:6px"><b>Auf der Karte:</b> '
    + (gesamt ? aktive + ' von ' + gesamt + ' Hotspots sind jetzt in Saison (die übrigen sind gedimmt). ' : '')
    + (fokusSpots ? fokusSpots + ' Gewässer passen zum Jahreszeit-Fokus und sind hervorgehoben.' : 'Kein Gewässer dieser Region passt zum aktuellen Fokus.')
    + '</div>'
    + '<div class="quelle">Grundlage: die Saison-Angaben der Hotspots und der Gewässertyp. '
    + 'Krautfelder und Tiefenkanten werden <b>nicht</b> eingezeichnet – dafür gibt es keine verlässlichen Daten. '
    + 'Die genaue Kante findest du mit Echolot, das Kraut mit der Polbrille.</div>';

  const setzen = (offen: boolean) => { info.hidden = !offen; tip.setAttribute('aria-expanded', String(offen)); };
  tip.onclick = () => setzen(info.hidden);
  const close = byId('saisonClose');
  if (close) (close as HTMLElement).onclick = () => setzen(false);
}
