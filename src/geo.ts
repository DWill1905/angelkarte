/* Geometrie für Wind- und Ufer-Logik.
   Eigenes Modul, damit rating.ts und plan.ts es beide nutzen können, ohne sich
   gegenseitig zu importieren. */
import type { Hotspot, Spot } from './types';

/** Peilung von a nach b in Grad (0 = Nord, 90 = Ost). */
export function peilung(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const r = Math.PI / 180;
  const dLng = (bLng - aLng) * r;
  const y = Math.sin(dLng) * Math.cos(bLat * r);
  const x = Math.cos(aLat * r) * Math.sin(bLat * r) - Math.sin(aLat * r) * Math.cos(bLat * r) * Math.cos(dLng);
  return (Math.atan2(y, x) / r + 360) % 360;
}

const HIMMEL = ['Nord', 'Nordost', 'Ost', 'Südost', 'Süd', 'Südwest', 'West', 'Nordwest'];
export function himmelsrichtung(grad: number): string {
  return HIMMEL[Math.round(((grad % 360) / 45)) % 8];
}

/** Kleinste Winkeldifferenz zwischen zwei Peilungen (0–180). */
export function winkelDiff(a: number, b: number): number {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

/**
 * Liegt der Punkt am auflandigen Ufer?
 * Wind "aus 225° (SW)" bewegt sich nach 45° (NO) – Plankton und Weißfisch treiben dorthin,
 * Räuber folgen. Ein Hotspot, der vom Gewässerzentrum aus in Windrichtung liegt, ist auflandig.
 */
export function istAuflandig(spot: Spot, h: Hotspot, windAusGrad: number): boolean | null {
  if (typeof spot.lat !== 'number' || typeof h.lat !== 'number') return null;
  /* Identischer Punkt: keine Peilung möglich. */
  if (spot.lat === h.lat && spot.lng === h.lng) return null;
  const windZiel = (windAusGrad + 180) % 360;
  const b = peilung(spot.lat, spot.lng!, h.lat, h.lng);
  return winkelDiff(b, windZiel) <= 60;
}
