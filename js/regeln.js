/* Regeln-Tab & Schonzeit-Kalender */
import { byId } from './dom.js';
import { state } from './state.js';
import { fmtMD, inSchonzeit, daysUntilMD } from './astro.js';
import { esc } from './util.js';
export const schonEl = byId('schonzeiten');
export function buildSchonUI() {
    byId('regionName').textContent = state.REGION.name;
    schonEl.innerHTML = '';
    state.SCHON.forEach(s => {
        const zu = inSchonzeit(s);
        const dTo = s.von ? (zu ? daysUntilMD(s.bis) : daysUntilMD(s.von)) : null;
        const badge = s.von
            ? (zu ? `<span class="badge closed">gesperrt · noch ${dTo} Tag${dTo === 1 ? '' : 'e'} (bis ${fmtMD(s.bis)})</span>`
                : `<span class="badge open">offen${dTo != null && dTo <= 60 ? ` · Sperre in ${dTo} Tag${dTo === 1 ? '' : 'en'}` : ''} · Sperrzeit ${fmtMD(s.von)}–${fmtMD(s.bis)}</span>`)
            : `<span class="badge info">keine Schonzeit</span>`;
        schonEl.insertAdjacentHTML('beforeend', `<div class="rule-row"><div><div class="rule-fish">${s.fisch}</div>
       <div class="rule-mm">Maß: ${s.mm}</div></div>${badge}</div>`);
    });
    if (state.REGION.schonQuelle)
        schonEl.insertAdjacentHTML('beforeend', '<p class="fineprint" style="margin-top:10px">' + state.REGION.schonQuelle + '</p>');
    buildKalender();
}
export function buildKalender() {
    const el = byId('schonKalender');
    if (!el)
        return;
    const nowM = new Date().getMonth() + 1;
    const mLabels = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
    let h = '<div class="calrow"><span class="cfish"></span><div style="flex:1;display:flex;font-size:9px;color:var(--muted)">'
        + mLabels.map(m => '<span style="flex:1;text-align:center">' + m + '</span>').join('') + '</div></div>';
    state.SCHON.forEach(sc => {
        let cells = '';
        for (let m = 1; m <= 12; m++) {
            let zu = false;
            if (sc.von) {
                const md1 = m * 100 + 1, md28 = m * 100 + 28;
                const v = sc.von[0] * 100 + sc.von[1], b = sc.bis[0] * 100 + sc.bis[1];
                /* Monat gilt als geschont, wenn Monatsmitte im Fenster liegt */
                const mid = m * 100 + 15;
                zu = (v <= b) ? (mid >= v && mid <= b) : (mid >= v || mid <= b);
            }
            cells += '<div class="m ' + (zu ? 'zu' : 'auf') + (m === nowM ? ' now' : '') + '"></div>';
        }
        h += '<div class="calrow"><span class="cfish">' + esc(sc.fisch) + '</span><div class="calbar">' + cells + '</div></div>';
    });
    el.innerHTML = h;
}
export function buildRegeln() {
    const el = byId('regionRegeln');
    el.innerHTML = '';
    (state.REGION.regeln || []).forEach(card => {
        el.insertAdjacentHTML('beforeend', `<div class="card"><h3>${card.titel}</h3><ul>${card.punkte.map(x => '<li>' + x + '</li>').join('')}</ul></div>`);
    });
    if (state.REGION.koederfisch && state.REGION.koederfisch.length) {
        el.insertAdjacentHTML('beforeend', `<div class="card"><h3>🐟 Köderfisch &amp; Naturköder</h3><ul>${state.REGION.koederfisch.map(x => '<li>' + x + '</li>').join('')}</ul></div>`);
    }
    byId('regionHinweis').innerHTML = state.REGION.hinweis || '';
}
