/* Leaflet wird als globales Script geladen (kein npm-Paket) – daher any.
   Der Rest der App ist typisiert; die Leaflet-Oberfläche bewusst nicht. */
declare const L: any;

interface Window {
  L: any;
  storage?: import('./types').Storage;
  /* Popup-Buttons rufen diese global auf (inline onclick im HTML) */
  prefillFang: (spotName: string) => void;
  delMySpot: (id: number) => Promise<void>;
  editMySpot: (id: number) => Promise<void>;
  toggleTripSpot: (name: string) => Promise<void>;
}
