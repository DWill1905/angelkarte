/* Persönliche Notizen zu bestehenden Spots (kuratiert oder eigen) – lokal, pro Region.

   Ergänzt Fangbuch (Fänge) und Trip-Liste (Merkliste) um freien Text: eigenes Wissen zum
   Spot, das sonst nirgends hinpasst ("Zufahrt bei Nässe gesperrt", "Verein hat die Regeln
   verschärft", "bester Zugang ist der Waldweg, nicht der Parkplatz" …). Bisher ging das nur
   über den Umweg "Eigener Spot" – der aber einen zweiten, unabhängigen Marker anlegt statt
   den bestehenden Spot zu ergänzen. Nie an einen Server, nur auf diesem Gerät. */
import { state, store } from './state.js';

const KEY = (regionId: string) => 'notiz:' + regionId;

async function alleNotizen(): Promise<Record<string, string>> {
  if (!state.REGION) return {};
  try { return JSON.parse((await store.get(KEY(state.REGION.id))).value) || {}; }
  catch (e) { return {}; }
}

export async function ladeNotiz(spotName: string): Promise<string> {
  const alle = await alleNotizen();
  return alle[spotName] || '';
}

export async function speichereNotiz(spotName: string, text: string): Promise<void> {
  if (!state.REGION) return;
  const alle = await alleNotizen();
  const t = text.trim();
  if (t) alle[spotName] = t; else delete alle[spotName];
  try { await store.set(KEY(state.REGION.id), JSON.stringify(alle)); }
  catch (e) { state.persistent = false; /* Speicher voll o.ä. – Notiz gilt nur für diese Sitzung */ }
}
