/* Helfer: HTML-Escape + Icon-Set (Lucide-Stil, inline SVG) */
export function esc(x) { const d = document.createElement('div'); d.textContent = String(x == null ? '' : x); return d.innerHTML; }
/** Eine Nachkommastelle im deutschen Format (Komma statt Punkt) - .toFixed(1) liefert
    immer "20.4", nie "20,4", unabhängig vom Locale. Nur für Anzeigetexte gedacht, NICHT für
    API-Parameter (Koordinaten in URLs müssen den technischen Punkt behalten). */
export function de1(n) { return n.toFixed(1).replace('.', ','); }
/* ===== Icon-Set (Lucide-Stil, inline SVG, currentColor) ===== */
export const ICONS = {
    tools: '<path d="M14.7 6.3a4 4 0 0 1-5.4 5.4L4 17v3h3l5.3-5.3a4 4 0 0 0 5.4-5.4l-2.1 2.1-2.5-.5-.5-2.5z"/>',
    fish: '<path d="M6.5 12c3-4 8-6 14-6-1 2-1 4 0 6-6 0-11-2-14-6z" transform="translate(0 6)"/><path d="M6.5 12c-1.5 1-3 1-4 0 .8-1 .8-2 0-3 1.5-1 3-.5 4 0" transform="translate(0 6)"/><circle cx="16" cy="11" r=".8" fill="currentColor"/>',
    bag: '<path d="M6 8h12l-1 12H7L6 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
    knot: '<path d="M8 8c4 0 4 8 8 8M16 8c-4 0-4 8-8 8"/>',
    weight: '<path d="M7 8h10l2 11H5L7 8z"/><circle cx="12" cy="6" r="2"/>',
    target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r=".8" fill="currentColor"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6L17 7M7 17l-1.4 1.4"/>',
    moon: '<path d="M18 14a7 7 0 0 1-9-9 7 7 0 1 0 9 9z"/>',
    wind: '<path d="M3 9h11a2.5 2.5 0 1 0-2.5-2.5M3 14h15a2.5 2.5 0 1 1-2.5 2.5M3 12h8"/>',
    waves: '<path d="M2 8c2-2 4-2 6 0s4 2 6 0 4-2 6 0M2 13c2-2 4-2 6 0s4 2 6 0 4-2 6 0M2 18c2-2 4-2 6 0s4 2 6 0 4-2 6 0"/>',
    pin: '<path d="M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>',
    locate: '<circle cx="12" cy="12" r="7"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/><circle cx="12" cy="12" r="2.4" fill="currentColor"/>',
    calendar: '<rect x="4" y="5" width="16" height="16" rx="2"/><path d="M4 9h16M8 3v4M16 3v4"/>',
    trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0V4z"/><path d="M8 6H5v1a3 3 0 0 0 3 3M16 6h3v1a3 3 0 0 1-3 3M10 15h4M9 20h6M12 15v5"/>',
    ruler: '<path d="M4 14l10-10 6 6L10 20z"/><path d="M8 8l2 2M11 5l2 2M6 11l2 2"/>',
    bolt: '<path d="M13 2L5 14h6l-1 8 8-12h-6l1-8z"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    edit: '<path d="M14 4l6 6M4 20l1-4L16 5l3 3L8 19l-4 1z"/>',
    share: '<circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="M8.2 10.8l7.6-4.1M8.2 13.2l7.6 4.1"/>'
};
export function ICON(name, cls) {
    return '<svg class="ic' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[name] || '') + '</svg>';
}
/** Fade-Hinweis an den Rändern horizontal scrollbarer Chip-Reihen: reine Opacity-Maske
    (kein Hintergrundfarb-Abgleich nötig), reagiert auf Scrollen, Größenänderung und
    Neuaufbau der Chips (MutationObserver) - einmal pro Element aufrufen, läuft danach
    von selbst mit. */
export function chipsFadeInit(el) {
    const update = () => {
        el.classList.toggle('fade-l', el.scrollLeft > 2);
        el.classList.toggle('fade-r', el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
    };
    el.addEventListener('scroll', update, { passive: true });
    if (typeof ResizeObserver !== 'undefined')
        new ResizeObserver(update).observe(el);
    new MutationObserver(update).observe(el, { childList: true });
    update();
    /* Tab-Navigation scrollte die Reihe nicht automatisch mit - ein fokussierter Chip konnte
       komplett ausserhalb des sichtbaren Bereichs landen, ohne jede visuelle Spur für
       Tastatur-Nutzer. */
    el.addEventListener('focusin', (e) => {
        const t = e.target;
        if (t && t.classList.contains('chip'))
            t.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    });
}
/** Fade-Hinweis am oberen/unteren Rand scrollbarer Dialog-Inhalte (".dlg-scroll"): dieselbe
    Opacity-Masken-Technik wie chipsFadeInit(), nur vertikal. Die Dialoge (Packliste, Knoten,
    Wochen-Vorschau, ...) sind statisches HTML und existieren schon beim Laden - einmalig für
    alle .dlg-scroll-Elemente verdrahtet statt an jeder einzelnen Dialog-Baustelle. */
export function scrollFadeInit(el) {
    const update = () => {
        el.classList.toggle('fade-t', el.scrollTop > 2);
        el.classList.toggle('fade-b', el.scrollTop + el.clientHeight < el.scrollHeight - 2);
    };
    el.addEventListener('scroll', update, { passive: true });
    if (typeof ResizeObserver !== 'undefined')
        new ResizeObserver(update).observe(el);
    new MutationObserver(update).observe(el, { childList: true, subtree: true });
    update();
}
/* util.ts wird auch von reinen Logik-Tests importiert, die ohne DOM laufen (z.B. tackle.ts
   ueber esc/ICON) - ohne diese Absicherung wirft der Modul-Top-Level dort sofort. */
if (typeof document !== 'undefined') {
    document.querySelectorAll('.dlg-scroll').forEach(scrollFadeInit);
}
