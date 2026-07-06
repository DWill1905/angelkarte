#!/usr/bin/env node
/* Regeneriert data/*.json + regionen.json aus REGIONS_EMBEDDED in index.html. */
const fs=require('fs'),path=require('path');
const root=path.join(__dirname,'..');
const s=fs.readFileSync(path.join(root,'index.html'),'utf8');
const js=[...s.matchAll(/<script(?:[^>]*)>([\s\S]*?)<\/script>/g)].map(x=>x[1]).filter(x=>x.trim()).join('\n');
const cut=js.indexOf('/* ============ Regions-Verwaltung');
const ctx={};
new Function('window','document',js.slice(0,cut).replace(/const CATS[\s\S]*?};/,'')+';window.R=REGIONS_EMBEDDED;')(ctx,{});
ctx.R.forEach(r=>fs.writeFileSync(path.join(root,'data',r.id+'.json'),JSON.stringify(JSON.parse(JSON.stringify(r)),null,1)));
fs.writeFileSync(path.join(root,'data','regionen.json'),JSON.stringify(ctx.R.map(r=>r.id+'.json'),null,1));
console.log('JSON-DB regeneriert:',ctx.R.map(r=>r.id).join(', '));
