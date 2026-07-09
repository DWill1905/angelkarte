/* Wetter & Pegel (Open-Meteo + PEGELONLINE, keylos) */
import { byId } from './dom.js';
import { state } from './state.js';
import { haversine } from './astro.js';
import { ICON, esc } from './util.js';


export async function loadWeather(){
  if(!state.SPOTS.length) return;
  const pts=state.SPOTS.filter(sp=>!sp.my);
  const ctr=state.userPos?{lat:state.userPos[0],lng:state.userPos[1]}
    :{lat:pts.reduce((a,sp)=>a+sp.lat,0)/pts.length,lng:pts.reduce((a,sp)=>a+sp.lng,0)/pts.length};
  const key=ctr.lat.toFixed(2)+','+ctr.lng.toFixed(2);
  if(key===state.wxKey) return; state.wxKey=key;
  const el=byId('wxline');
  try{
    const u='https://api.open-meteo.com/v1/forecast?latitude='+ctr.lat.toFixed(3)+'&longitude='+ctr.lng.toFixed(3)
      +'&current=temperature_2m,wind_speed_10m,wind_direction_10m,surface_pressure,weather_code'
      +'&hourly=surface_pressure,weather_code,wind_gusts_10m&past_days=1&forecast_days=1&timezone=auto';
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
    state.WX={temp:c.temperature_2m,wind:c.wind_speed_10m,dirDeg:c.wind_direction_10m||0,dir,press:c.surface_pressure,trendVal};
    /* Gewitter-/Sturmwarnung: WMO-Codes 95/96/99 = Gewitter, Böen > 60 km/h */
    checkStorm(d,c);
    el.innerHTML=ICON('sun')+' '+Math.round(c.temperature_2m)+'°C · '+ICON('wind')+' '+Math.round(c.wind_speed_10m)+' km/h '+esc(dir)
      +' · '+Math.round(c.surface_pressure)+' hPa'+trend;
    loadPegel(ctr,el);
  }catch(e){ el.textContent=''; state.wxKey=''; }
}

export function checkStorm(d,c){
  const warn=byId('stormWarn');
  if(!warn) return;
  const now=new Date(); const nowH=now.toISOString().slice(0,13);
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
export async function loadPegel(ctr,el){
  try{
    const base='https://www.pegelonline.wsv.de/webservices/rest-api/v2/stations';
    const st=await (await fetch(base+'.json?latitude='+ctr.lat.toFixed(3)+'&longitude='+ctr.lng.toFixed(3)+'&radius=30')).json();
    if(!Array.isArray(st)||!st.length) return;
    const s0=st[0];
    const m=await (await fetch(base+'/'+s0.uuid+'/W/currentmeasurement.json')).json();
    if(!m||typeof m.value==='undefined') return;
    const dist=(s0.latitude&&s0.longitude)?haversine(ctr.lat,ctr.lng,s0.latitude,s0.longitude):null;
    state.PEGEL={value:m.value,station:s0.shortname,dist};
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
    /* Wassertemperatur, wenn die Station sie liefert */
    try{
      const wt=await (await fetch(base+'/'+s0.uuid+'/WT/currentmeasurement.json')).json();
      if(wt&&typeof wt.value!=='undefined'){
        state.PEGEL.wt=wt.value;
        if(state.WX) state.WX.wt=wt.value;
        txt+=' · Wasser '+Math.round(wt.value)+'°C'+(wt.value>=25?' ⚠ Hitzestress – C&R vermeiden, Drill kurz halten!':'');
      }
    }catch(e){}
    /* Regionsschwelle (z.B. Rhein: Buhnen ab ~400 cm überspült) */
    if(state.REGION&&state.REGION.pegel&&m.value>=state.REGION.pegel.warnAb) txt+=' · ⚠ '+state.REGION.pegel.text;
    el.innerHTML+=txt;
  }catch(e){}
}

