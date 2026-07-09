/* Zentraler, modulübergreifender State.
   Properties werden mutiert (nie neu zugewiesen), damit alle Importe live dieselben Werte teilen. */
import type { AppState, Storage } from './types';

export const state: AppState = {
  REGIONS: [], REGION: null, SPOTS: [], SCHON: [],
  loadToken: 0,
  fishSel: null, uferOnly: false,
  active: {},
  userPos: null, userMarker: null,
  uidLast: 0,
  WX: null, PEGEL: null, wxKey: '',
  fbMem: [], persistent: true, fbSaving: false,
  trip: [], /* Merkliste: [{region,name}] */
  map: null,
};

/* Storage-Shim: Artifact-window.storage oder localStorage (Prefix ak_), async wie im Original */
export const store: Storage = (typeof window.storage !== 'undefined' && window.storage) ? window.storage : {
  async get(k: string) { const v = localStorage.getItem('ak_' + k); if (v === null) throw new Error('nicht gefunden'); return { key: k, value: v }; },
  async set(k: string, v: string) { localStorage.setItem('ak_' + k, String(v)); return { key: k, value: v }; }
};
