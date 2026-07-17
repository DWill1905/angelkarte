export const state = {
    REGIONS: [], REGION: null, SPOTS: [], SCHON: [],
    loadToken: 0,
    fishSel: [], uferOnly: false,
    active: {},
    userPos: null, userMarker: null,
    uidLast: 0,
    WX: null, WXH: null, WXD: null, PEGEL: null, wxKey: '', satAn: false,
    fbMem: [], persistent: true, fbSaving: false,
    trip: [], /* Merkliste: [{region,name}] */
    map: null,
};
/* Storage-Shim: Artifact-window.storage oder localStorage (Prefix ak_), async wie im Original */
export const store = (typeof window.storage !== 'undefined' && window.storage) ? window.storage : {
    async get(k) { const v = localStorage.getItem('ak_' + k); if (v === null)
        throw new Error('nicht gefunden'); return { key: k, value: v }; },
    async set(k, v) { localStorage.setItem('ak_' + k, String(v)); return { key: k, value: v }; }
};
