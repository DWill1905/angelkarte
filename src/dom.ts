/* Typsichere DOM-Helfer.
   `byId` wirft nicht, sondern liefert null – die App prüft an vielen Stellen selbst.
   Für Elemente, die garantiert existieren, gibt es `byIdOrThrow`. */

/** Holt ein Element und typisiert es. Liefert null, wenn nicht vorhanden. */
export function byId<T extends HTMLElement = HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

/** Wie byId, aber wirft, wenn das Element fehlt (für Kern-Elemente der Shell). */
export function byIdOrThrow<T extends HTMLElement = HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error('Pflicht-Element fehlt im DOM: #' + id);
  return el as T;
}

/** Kurzformen für die häufigsten Elementtypen. */
export const inputById = (id: string) => byId<HTMLInputElement>(id);
export const selectById = (id: string) => byId<HTMLSelectElement>(id);
export const buttonById = (id: string) => byId<HTMLButtonElement>(id);

/** querySelector mit Typ. */
export function qs<T extends Element = HTMLElement>(sel: string, root: ParentNode = document): T | null {
  return root.querySelector(sel) as T | null;
}
/** querySelectorAll als typisiertes Array. */
export function qsa<T extends Element = HTMLElement>(sel: string, root: ParentNode = document): T[] {
  return Array.from(root.querySelectorAll(sel)) as T[];
}
