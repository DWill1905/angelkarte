/* Wetter & Pegel (Open-Meteo + PEGELONLINE, keylos) */
import { byId } from './dom.js';
import { state } from './state.js';
import { haversine } from './astro.js';
import { ICON, esc } from './util.js';
import type { Wasser, Wetter } from './types';

/* ---------- Wassertemperatur-Schätzung aus der Lufttemperatur ----------
   Für Gewässer ohne WT-Station (Talsperren, viele Seen): die Oberflächentemperatur
   folgt dem geglätteten Lufttemperatur-Verlauf mit Trägheit (Standardansatz, vgl.
   air2water-Modelle). Ein reines Luft-EMA unterschätzt im Sommer systematisch um
   1–3 °C (Sonneneinstrahlung heizt übers Luftgleichgewicht hinaus) – deshalb ein
   saisonaler Strahlungsoffset, kalibriert gegen 6 PEGELONLINE-WT-Stationen
   (Main/Lahn/MLK/OHW/Müritz, Juli 2026: Restfehler ≤ ~1 °C). Immer als Schätzung
   gekennzeichnet verwenden, nie als Messwert ausgeben. */

/** Lädt die Tagesmittel-Lufttemperatur der letzten 3 Wochen (eigener, kleiner Abruf). */
async function ladeTagesmittel(ctr: { lat: number; lng: number }): Promise<void> {
  try {
    const u = 'https://api.open-meteo.com/v1/forecast?latitude=' + ctr.lat.toFixed(3) + '&longitude=' + ctr.lng.toFixed(3)
      + '&daily=temperature_2m_mean&past_days=21&forecast_days=1&timezone=auto';
    const d = await (await fetch(u)).json();
    state.WXD = d.daily && d.daily.time ? { time: d.daily.time, mean: d.daily.temperature_2m_mean || [] } : null;
  } catch (e) { /* offline: dann eben keine Schätzung – rating sagt „unbekannt" */ }
}

/** Wassertemperatur-Schätzung für einen Gewässertyp (null = generisch).
    Liefert Wert (°C, ±~2), Trend (°C über ~3 Tage) – oder null ohne Datenbasis. */
export function wtSchaetzung(wasser: Wasser | null): { wert: number; trend: number } | null {
  const d = state.WXD;
  if (!d || !Array.isArray(d.mean)) return null;
  const temps = d.mean.filter((v): v is number => typeof v === 'number');
  if (temps.length < 10) return null;
  /* Trägheit nach Wasserkörper: tiefe Seen reagieren träge, flache schnell. */
  const alpha = wasser === 'see-tief' ? 0.12 : wasser === 'see-flach' ? 0.3 : wasser == null ? 0.2 : 0.25;
  const ema = (arr: number[]) => { let e = arr[0]; for (const t of arr) e = e + alpha * (t - e); return e; };
  /* Strahlungsoffset übers Jahr: ~0 Mitte Januar, Maximum ~+2,2 °C Mitte Juli. */
  const now = new Date();
  const doy = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
  const off = 1.1 * (1 + Math.cos(2 * Math.PI * (doy - 197) / 365.25));
  const clamp = (v: number) => Math.max(1, Math.min(30, v));
  const wert = clamp(ema(temps) + off);
  const vor3 = clamp(ema(temps.slice(0, -3)) + off);
  return { wert: Math.round(wert * 10) / 10, trend: Math.round((wert - vor3) * 10) / 10 };
}


export async function loadWeather(){
  if(!state.SPOTS.length) return;
  const pts=state.SPOTS.filter(sp=>!sp.my);
  const ctr=state.userPos?{lat:state.userPos[0],lng:state.userPos[1]}
    :{lat:pts.reduce((a,sp)=>a+sp.lat,0)/pts.length,lng:pts.reduce((a,sp)=>a+sp.lng,0)/pts.length};
  const key=ctr.lat.toFixed(2)+','+ctr.lng.toFixed(2);
  if(key===state.wxKey) return; state.wxKey=key;
  const el=byId('wxline');
  try{
    const tm=ladeTagesmittel(ctr); /* parallel: Tagesmittel für die WT-Schätzung */
    const u='https://api.open-meteo.com/v1/forecast?latitude='+ctr.lat.toFixed(3)+'&longitude='+ctr.lng.toFixed(3)
      +'&current=temperature_2m,wind_speed_10m,wind_direction_10m,surface_pressure,weather_code'
      +'&hourly=temperature_2m,wind_speed_10m,wind_direction_10m,surface_pressure,weather_code,wind_gusts_10m'
      +'&past_days=1&forecast_days=7&timezone=auto';
    const d=await (await fetch(u)).json();
    const c=d.current;
    let trend='', trendVal=0;
    const idx=d.hourly&&d.hourly.time?d.hourly.time.indexOf(c.time.slice(0,13)+':00'):-1;
    if(idx>2){
      trendVal=d.hourly.surface_pressure[idx]-d.hourly.surface_pressure[idx-3];
      trend=trendVal<=-1.5?' ⇘ fällt – Beißtrigger!':trendVal>=1.5?' ⇗ steigt':' → stabil';
    }
    const dirs=['N','NO','O','SO','S','SW','W','NW'];
    const dir=dirs[Math.round((c.wind_direction_10m||0)/45)%8];
    state.WX={temp:c.temperature_2m,wind:c.wind_speed_10m,dirDeg:c.wind_direction_10m||0,dir,press:c.surface_pressure,trendVal,code:c.weather_code};
    /* Stundenreihe merken – damit der Planer auch andere Tage mit ECHTER Vorhersage rechnen kann
       statt das heutige Wetter auf morgen zu übertragen. Zeitstempel sind lokal (timezone=auto). */
    state.WXH=d.hourly&&d.hourly.time?d.hourly:null;
    wxChipSetzen();
    /* Gewitter-/Sturmwarnung: WMO-Codes 95/96/99 = Gewitter, Böen > 60 km/h */
    checkStorm(d,c);
    el.innerHTML=ICON('sun')+' '+Math.round(c.temperature_2m)+'°C · '+ICON('wind')+' '+Math.round(c.wind_speed_10m)+' km/h '+esc(dir)
      +' · '+Math.round(c.surface_pressure)+' hPa'+trend;
    /* Pegel einer anderen Gegend verwerfen – sonst rechnen Bewertung und Planer nach
       einem Regionswechsel mit dem Wasserstand/der Wassertemperatur der alten Region. */
    if(state.PEGEL&&state.PEGEL.key!==key) state.PEGEL=null;
    await loadPegel(ctr,el,key);
    /* Keine gemessene Wassertemperatur in Reichweite: geschätzt aus der Lufttemperatur,
       klar als Schätzung gekennzeichnet (fließt nur reduziert gewichtet in die Bewertung). */
    if(!(state.PEGEL&&state.PEGEL.wt!=null)){
      await tm;
      const est=wtSchaetzung(null);
      if(est) el.innerHTML+=' · Wasser ≈'+Math.round(est.wert)+'°C (geschätzt aus Lufttemperatur)';
    }
  }catch(e){ el.textContent=''; state.wxKey=''; }
}

/** Wetter für einen Zeitpunkt.
    - innerhalb der laufenden Stunde: die gemessenen Aktuellwerte (genauer als jede Vorhersage)
    - sonst: die Stundenvorhersage von Open-Meteo (timezone=auto -> LOKALE Zeitstempel)
    - keine Stundenreihe geladen (offline/Tests): Aktuellwerte, wie bisher
    - Stundenreihe da, aber der Zeitpunkt liegt außerhalb: null – dann sagt die App ehrlich
      „keine Daten" statt heutiges Wetter auf einen anderen Tag zu übertragen. */
export function wxAt(d: Date): Wetter | null {
  const now=new Date();
  if(Math.abs(d.getTime()-now.getTime())<45*60e3) return state.WX;
  const h=state.WXH;
  if(!h||!h.time) return state.WX;
  const pad=(n)=>String(n).padStart(2,'0');
  const key=d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())+'T'+pad(d.getHours())+':00';
  const i=h.time.indexOf(key);
  if(i<0) return null;
  const press=h.surface_pressure?h.surface_pressure[i]:null;
  const temp=h.temperature_2m?h.temperature_2m[i]:null;
  const wind=h.wind_speed_10m?h.wind_speed_10m[i]:null;
  if(temp==null||wind==null||press==null) return null;
  const dirs=['N','NO','O','SO','S','SW','W','NW'];
  const dirDeg=(h.wind_direction_10m&&h.wind_direction_10m[i])||0;
  const trendVal=(i>=3&&h.surface_pressure&&h.surface_pressure[i-3]!=null)?press-h.surface_pressure[i-3]:0;
  return {temp,wind,dirDeg,dir:dirs[Math.round(dirDeg/45)%8],press,trendVal,
    code:h.weather_code?h.weather_code[i]:null};
}

export function checkStorm(d,c){
  const warn=byId('stormWarn');
  if(!warn) return;
  const now=new Date();
  /* Open-Meteo liefert wegen timezone=auto LOKALE Zeitstempel ("2026-07-09T14:00").
     toISOString() gibt UTC – im Sommer zwei Stunden Versatz. Die Gewitterwarnung prüfte
     dadurch 12:00–15:00 statt 14:00–17:00, schaute also kaum in die Zukunft. */
  const pad=(n)=>String(n).padStart(2,'0');
  const nowH=now.getFullYear()+'-'+pad(now.getMonth()+1)+'-'+pad(now.getDate())+'T'+pad(now.getHours());
  let msg='';
  const codeNow=c.weather_code;
  if([95,96,99].includes(codeNow)){ msg='⛈ GEWITTER JETZT – sofort raus aus dem Wasser, Rute ablegen, Schutz suchen!'; }
  else if(d.hourly&&d.hourly.weather_code&&d.hourly.time){
    const i=d.hourly.time.findIndex(t=>t.slice(0,13)>=nowH);
    if(i>=0){
      for(let k=i;k<Math.min(i+4,d.hourly.weather_code.length);k++){
        if([95,96,99].includes(d.hourly.weather_code[k])){
          const wann=d.hourly.time[k].slice(11,16);
          msg='⛈ Gewitter ab ca. '+wann+' erwartet – Angeltrip entsprechend planen, Kohlefaserrute ist ein Blitzableiter!';
          break;
        }
      }
      /* Sturmböen */
      if(!msg&&d.hourly.wind_gusts_10m){
        for(let k=i;k<Math.min(i+4,d.hourly.wind_gusts_10m.length);k++){
          if(d.hourly.wind_gusts_10m[k]>=60){
            msg='💨 Sturmböen bis '+Math.round(d.hourly.wind_gusts_10m[k])+' km/h ab '+d.hourly.time[k].slice(11,16)+' – besonders auf dem Boot Vorsicht!';
            break;
          }
        }
      }
    }
  }
  if(msg){ warn.textContent=msg; warn.classList.add('show'); }
  else { warn.classList.remove('show'); warn.textContent=''; }
}
export async function loadPegel(ctr,el,key=''){
  try{
    const base='https://www.pegelonline.wsv.de/webservices/rest-api/v2/stations';
    /* includeTimeseries: die Liste kommt distanzsortiert, aber der NÄCHSTE Pegel führt oft
       nur W (z. B. Mainz, Gießen, Elbe, Seenplatte: WT erst 13–30 km weiter). Deshalb für
       WT und Q jeweils die nächste Station wählen, die die Größe wirklich misst. */
    const st=await (await fetch(base+'.json?latitude='+ctr.lat.toFixed(3)+'&longitude='+ctr.lng.toFixed(3)+'&radius=30&includeTimeseries=true')).json();
    if(!Array.isArray(st)||!st.length) return;
    const hat=(s,k)=>Array.isArray(s.timeseries)&&s.timeseries.some(t=>t&&t.shortname===k);
    const s0=st[0];
    const wtSt=st.find(s=>hat(s,'WT'))||null;
    const qSt=st.find(s=>hat(s,'Q'))||s0;
    const distZu=(s)=>(s&&s.latitude&&s.longitude)?haversine(ctr.lat,ctr.lng,s.latitude,s.longitude):null;
    const m=await (await fetch(base+'/'+s0.uuid+'/W/currentmeasurement.json')).json();
    if(!m||typeof m.value==='undefined') return;
    const dist=distZu(s0);
    state.PEGEL={value:m.value,station:s0.shortname,dist,key};
    const stName=s0.shortname.charAt(0)+s0.shortname.slice(1).toLowerCase();
    let txt=' · '+ICON('waves')+' '+esc(stName)+(dist!=null?' ('+dist.toFixed(0)+' km)':'')+': '+m.value+' cm';
    if(dist!=null&&dist>20) txt+=' – Station weit entfernt, nur grober Anhalt';
    /* Trend über 24 h */
    try{
      const hist=await (await fetch(base+'/'+s0.uuid+'/W/measurements.json?start=P1D')).json();
      if(Array.isArray(hist)&&hist.length>1){
        const d=Math.round(m.value-hist[0].value);
        state.PEGEL.trend=d;
        if(Math.abs(d)>=5) txt+=' ('+(d>0?'+':'')+d+' cm/24h)';
        if(d>=25) txt+=' – steigt &amp; trübt: Räuber ans Ufer gedrückt!';
      }
    }catch(e){}
    /* Wassertemperatur + Trend von der nächsten Station, die WT wirklich misst */
    if(wtSt) try{
      const wt=await (await fetch(base+'/'+wtSt.uuid+'/WT/currentmeasurement.json')).json();
      if(wt&&typeof wt.value!=='undefined'){
        state.PEGEL.wt=wt.value;
        state.PEGEL.wtStation=wtSt.shortname;
        const wtDist=distZu(wtSt);
        if(wtDist!=null) state.PEGEL.wtDist=wtDist;
        if(state.WX) state.WX.wt=wt.value;
        const andere=wtSt.uuid!==s0.uuid&&wtDist!=null;
        const wtName=wtSt.shortname.charAt(0)+wtSt.shortname.slice(1).toLowerCase();
        txt+=' · Wasser '+Math.round(wt.value)+'°C'+(andere?' ('+esc(wtName)+', '+wtDist.toFixed(0)+' km)':'')
          +(wt.value>=25?' ⚠ Hitzestress – C&R vermeiden, Drill kurz halten!':'');
        /* Trend über ~3 Tage: Mittel des jüngsten Tages minus Mittel des ältesten Tages
           glättet die Tag-/Nacht-Schwankung heraus, die einen Punkt-zu-Punkt-Vergleich verfälschen würde. */
        try{
          const wtHist=await (await fetch(base+'/'+wtSt.uuid+'/WT/measurements.json?start=P3D')).json();
          const vals=Array.isArray(wtHist)?wtHist.map((x)=>x.value).filter((v)=>typeof v==='number'):[];
          if(vals.length>=12){
            const n=vals.length, drittel=Math.max(1,Math.floor(n/3));
            const avg=(arr)=>arr.reduce((a,b)=>a+b,0)/arr.length;
            const dTrend=Math.round((avg(vals.slice(n-drittel))-avg(vals.slice(0,drittel)))*10)/10;
            state.PEGEL.wtTrend=dTrend;
            if(Math.abs(dTrend)>=1) txt+=' ('+(dTrend>0?'+':'')+dTrend+'°C/3T'+(dTrend<=-1.5?' – Kälteeinbruch':dTrend>=1.5?' – Erwärmung':'')+')';
          }
        }catch(e){}
      }
    }catch(e){}
    /* Abfluss (Q) = echte Strömungsgröße, wenn die Station ihn führt */
    try{
      const q=await (await fetch(base+'/'+qSt.uuid+'/Q/currentmeasurement.json')).json();
      if(q&&typeof q.value!=='undefined'){
        state.PEGEL.abfluss=q.value;
        let qtxt=' · '+Math.round(q.value)+' m³/s';
        /* Amtliche Pegelkennwerte (MQ/MNQ/MHQ) der WSV – die belastbare Referenz.
           Ein 30-Tage-Median wäre in einem trockenen Sommer selbst niedrig und würde
           Niedrigwasser als „normal" ausweisen. Nur wenn die Station keine Kennwerte
           führt, fällt die App auf den Median zurück – und sagt das dann auch. */
        let mq=null;
        try{
          const cv=await (await fetch(base+'/'+qSt.uuid+'/Q.json?includeCharacteristicValues=true')).json();
          const kw=(cv&&cv.characteristicValues)||[];
          const hol=(n)=>{ const x=kw.find(v=>v&&v.shortname===n); return x&&typeof x.value==='number'?x.value:null; };
          mq=hol('MQ');
          if(mq!=null){
            state.PEGEL.abflussMittel=Math.round(mq);
            state.PEGEL.mqQuelle='amtlich';
            state.PEGEL.mnq=hol('MNQ'); state.PEGEL.mhq=hol('MHQ');
          }
        }catch(e){}
        /* 24-h-Trend aus der Q-Reihe */
        try{
          const qh=await (await fetch(base+'/'+qSt.uuid+'/Q/measurements.json?start=P1D')).json();
          if(Array.isArray(qh)&&qh.length>1&&typeof qh[0].value==='number'){
            state.PEGEL.abflussTrend=Math.round(q.value-qh[0].value);
          }
        }catch(e){}
        /* Fallback: nur wenn kein amtliches MQ vorliegt */
        if(mq==null){
          try{
            const qh=await (await fetch(base+'/'+qSt.uuid+'/Q/measurements.json?start=P30D')).json();
            const vals=Array.isArray(qh)?qh.map((x)=>x.value).filter((v)=>typeof v==='number'):[];
            if(vals.length>=20){
              const sorted=[...vals].sort((a,b)=>a-b);
              state.PEGEL.abflussMittel=Math.round(sorted[Math.floor(sorted.length/2)]);
              state.PEGEL.mqQuelle='median30';
            }
          }catch(e){}
        }
        const mittel=state.PEGEL.abflussMittel;
        if(mittel&&mittel>0){
          const ratio=q.value/mittel;
          const amtlich=state.PEGEL.mqQuelle==='amtlich';
          qtxt+=' ('+Math.round(ratio*100)+'\u202F% von '+(amtlich?'MQ':'~Mittel (30\u202Fd)');
          qtxt+=')';
          const mnq=state.PEGEL.mnq, mhq=state.PEGEL.mhq;
          if(amtlich&&mnq!=null&&q.value<=mnq) qtxt+=' – Niedrigwasser (unter MNQ)';
          else if(amtlich&&mhq!=null&&q.value>=mhq) qtxt+=' – Hochwasser (über MHQ)';
          else if(ratio>=1.5) qtxt+=' – kräftig';
          else if(ratio<=0.7) qtxt+=' – wenig';
        }
        txt+=qtxt;
      }
    }catch(e){}
    /* Regionsschwelle (z.B. Rhein: Buhnen ab ~400 cm überspült) */
    if(state.REGION&&state.REGION.pegel&&m.value>=state.REGION.pegel.warnAb) txt+=' · ⚠ '+state.REGION.pegel.text;
    el.innerHTML+=txt;
  }catch(e){}
}

/* ---------- Kompakter Wetter-Chip im Header ----------
   Der Header trug bisher zwei volle Textzeilen (Sonne/Mond und Wetter/Pegel) und fraß
   damit Kartenfläche. Beide Zeilen leben jetzt im Dialog „Wetter & Bedingungen"; im Header
   bleibt nur das Nötigste: Temperatur, Drucktrend und – falls kritisch – eine Warnfarbe. */
export function wxChipSetzen(): void {
  const chip = byId('wxChip');
  if (!chip) return;
  const wx = state.WX;
  if (!wx) { chip.textContent = '–'; chip.classList.remove('warn'); return; }

  const pfeil = wx.trendVal <= -1.5 ? '⇘' : wx.trendVal >= 1.5 ? '⇗' : '→';
  const sturm = wx.wind >= 35;
  chip.textContent = Math.round(wx.temp) + '° ' + pfeil + (sturm ? ' ⚠' : '');
  chip.classList.toggle('warn', sturm);
  chip.title = sturm
    ? 'Sturm – Wetter und Bedingungen ansehen'
    : Math.round(wx.temp) + ' °C, Luftdruck ' + (wx.trendVal <= -1.5 ? 'fällt' : wx.trendVal >= 1.5 ? 'steigt' : 'stabil');
}

export const wxDlg = byId('wxDlg');
export function openWetter(): void {
  if (wxDlg) wxDlg.hidden = false;
}
if (wxDlg) {
  byId('wxClose')?.addEventListener('click', () => { wxDlg.hidden = true; });
  wxDlg.addEventListener('click', (e) => { if (e.target === wxDlg) wxDlg.hidden = true; });
}
byId('wxChip')?.addEventListener('click', openWetter);
wxChipSetzen();
