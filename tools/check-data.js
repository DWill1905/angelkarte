#!/usr/bin/env node
/* Prüft, ob data/*.json bit-genau zu den in index.html eingebetteten
   REGIONS_EMBEDDED passen. Exit 1 bei Drift. Aufruf: node tools/check-data.js */
const fs=require('fs'),path=require('path');
const root=path.join(__dirname,'..');
const s=fs.readFileSync(path.join(root,'index.html'),'utf8');
const js=[...s.matchAll(/<script(?:[^>]*)>([\s\S]*?)<\/script>/g)].map(x=>x[1]).filter(x=>x.trim()).join('\n');
const cut=js.indexOf('/* ============ Regions-Verwaltung');
const ctx={};
new Function('window','document',js.slice(0,cut).replace(/const CATS[\s\S]*?};/,'')+';window.R=REGIONS_EMBEDDED;')(ctx,{});
let drift=0;
ctx.R.forEach(r=>{
  const f=path.join(root,'data',r.id+'.json');
  const disk=fs.existsSync(f)?fs.readFileSync(f,'utf8'):'';
  const want=JSON.stringify(JSON.parse(JSON.stringify(r)),null,1);
  if(disk!==want){ drift++; console.error('DRIFT:',r.id); }
});
if(drift){ console.error(drift+' Region(en) driften – tools/gen-data.js ausführen!'); process.exit(1); }
console.log('Datenbank konsistent ('+ctx.R.length+' Regionen).');
