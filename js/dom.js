/* Typsichere DOM-Helfer.
   `byId` wirft nicht, sondern liefert null – die App prüft an vielen Stellen selbst.
   Für Elemente, die garantiert existieren, gibt es `byIdOrThrow`. */
/** Holt ein Element und typisiert es. Liefert null, wenn nicht vorhanden. */
export function byId(id) {
    return document.getElementById(id);
}
/** Wie byId, aber wirft, wenn das Element fehlt (für Kern-Elemente der Shell). */
export function byIdOrThrow(id) {
    const el = document.getElementById(id);
    if (!el)
        throw new Error('Pflicht-Element fehlt im DOM: #' + id);
    return el;
}
/** Kurzformen für die häufigsten Elementtypen. */
export const inputById = (id) => byId(id);
export const selectById = (id) => byId(id);
export const buttonById = (id) => byId(id);
/** querySelector mit Typ. */
export function qs(sel, root = document) {
    return root.querySelector(sel);
}
/** querySelectorAll als typisiertes Array. */
export function qsa(sel, root = document) {
    return Array.from(root.querySelectorAll(sel));
}
