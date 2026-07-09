/* Tests der Regionsdaten. Sie prüfen Regeln, keine konkreten Zahlen –
   damit neue Regionen automatisch mitgeprüft werden, statt Tests zu brechen. */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { ROOT } from './setup.mjs';

const { REGIONS_EMBEDDED: regions, CATS } = await import(pathToFileURL(path.join(ROOT, 'js', 'data.js')).href);
const beangelbar = (s) => s.cat !== 'sperr' && s.cat !== 'info';
const alleSpots = regions.flatMap((r) => r.spots);

describe('Regionen – Grundstruktur', () => {
  test('mindestens eine Region', () => assert.ok(regions.length > 0));

  test('jede Region hat id, name, spots, schon', () => {
    regions.forEach((r) => {
      assert.ok(r.id, 'id fehlt');
      assert.ok(r.name, `name fehlt bei ${r.id}`);
      assert.ok(Array.isArray(r.spots) && r.spots.length, `spots fehlen bei ${r.id}`);
      assert.ok(Array.isArray(r.schon) && r.schon.length, `schon fehlt bei ${r.id}`);
    });
  });

  test('Region-IDs sind eindeutig', () => {
    const ids = regions.map((r) => r.id);
    assert.equal(new Set(ids).size, ids.length, 'doppelte Region-ID');
  });

  test('jede Region trägt ein Prüfdatum im Format JJJJ-MM', () => {
    regions.forEach((r) => {
      assert.ok(r.geprueft, `geprueft fehlt bei ${r.id}`);
      assert.match(r.geprueft, /^\d{4}-\d{2}$/, `${r.id}: ${r.geprueft}`);
    });
  });

  test('schonQuelle ist angegeben (Rechtsgrundlage nachvollziehbar)', () => {
    regions.forEach((r) => assert.ok(r.schonQuelle, `schonQuelle fehlt bei ${r.id}`));
  });
});

describe('Spots – Pflichtfelder und Wertebereiche', () => {
  test('jeder Spot hat Name und bekannte Kategorie', () => {
    alleSpots.forEach((s) => {
      assert.ok(s.name, 'Spot ohne Namen');
      assert.ok(CATS[s.cat], `unbekannte Kategorie "${s.cat}" bei ${s.name}`);
    });
  });

  test('Koordinaten liegen in Deutschland (47–55 N, 5–16 O)', () => {
    alleSpots.filter((s) => typeof s.lat === 'number').forEach((s) => {
      assert.ok(s.lat > 47 && s.lat < 55.5, `${s.name}: lat ${s.lat}`);
      assert.ok(s.lng > 5 && s.lng < 16, `${s.name}: lng ${s.lng}`);
    });
  });

  test('Hotspot-Koordinaten liegen nah am Spot (< 25 km)', () => {
    const hav = (a, b, c, d) => {
      const R = 6371, t = (x) => (x * Math.PI) / 180;
      const dLat = t(c - a), dLng = t(d - b);
      const x = Math.sin(dLat / 2) ** 2 + Math.cos(t(a)) * Math.cos(t(c)) * Math.sin(dLng / 2) ** 2;
      return 2 * R * Math.asin(Math.sqrt(x));
    };
    alleSpots.filter((s) => s.hotspots?.length && typeof s.lat === 'number').forEach((s) => {
      s.hotspots.forEach((h) => {
        const d = hav(s.lat, s.lng, h.lat, h.lng);
        assert.ok(d < 25, `${s.name} → Hotspot "${h.name}" ist ${d.toFixed(1)} km entfernt`);
      });
    });
  });

  test('verif ist A, B oder C', () => {
    alleSpots.filter((s) => s.verif).forEach((s) => {
      assert.ok(['A', 'B', 'C'].includes(s.verif), `${s.name}: verif=${s.verif}`);
    });
  });

  test('zugang ist ufer oder boot', () => {
    alleSpots.filter((s) => s.zugang).forEach((s) => {
      assert.ok(['ufer', 'boot'].includes(s.zugang), `${s.name}: zugang=${s.zugang}`);
    });
  });

  test('beangelbare Spots nennen mindestens eine Fischart', () => {
    alleSpots.filter(beangelbar).forEach((s) => {
      assert.ok(Array.isArray(s.arten) && s.arten.length, `${s.name} ohne Arten`);
    });
  });

  test('Sperrzonen haben einen erklärenden Hinweistext', () => {
    alleSpots.filter((s) => s.cat === 'sperr').forEach((s) => {
      assert.ok(s.note && s.note.length > 10, `${s.name}: note fehlt oder zu kurz`);
    });
  });

  test('Sperrzonen sind als Warnung markiert (warn=true)', () => {
    alleSpots.filter((s) => s.cat === 'sperr').forEach((s) => {
      assert.equal(s.warn, true, `${s.name}: warn muss true sein, sonst fehlt die Hervorhebung`);
    });
  });
});

describe('Kartenlinks', () => {
  test('alle URLs sind https', () => {
    alleSpots.filter((s) => s.kartenLinks?.length).forEach((s) => {
      s.kartenLinks.forEach((l) => {
        assert.match(l.url, /^https:\/\//, `${s.name}: ${l.url}`);
        assert.ok(l.label, `${s.name}: Link ohne Label`);
      });
    });
  });

  test('keine erfundenen Platzhalter-URLs', () => {
    const verboten = /example\.com|localhost|TODO|xxx/i;
    alleSpots.filter((s) => s.kartenLinks?.length).forEach((s) => {
      s.kartenLinks.forEach((l) => assert.ok(!verboten.test(l.url), `${s.name}: ${l.url}`));
    });
  });
});

describe('Schonzeiten – Konsistenz', () => {
  test('von und bis sind entweder beide gesetzt oder beide null', () => {
    regions.forEach((r) => r.schon.forEach((s) => {
      const hatVon = Array.isArray(s.von), hatBis = Array.isArray(s.bis);
      assert.equal(hatVon, hatBis, `${r.id}/${s.fisch}: von/bis inkonsistent`);
    }));
  });

  test('Monate 1–12, Tage 1–31', () => {
    regions.forEach((r) => r.schon.filter((s) => s.von).forEach((s) => {
      [s.von, s.bis].forEach(([m, d]) => {
        assert.ok(m >= 1 && m <= 12, `${r.id}/${s.fisch}: Monat ${m}`);
        assert.ok(d >= 1 && d <= 31, `${r.id}/${s.fisch}: Tag ${d}`);
      });
    }));
  });

  test('jede Art hat eine Maßangabe', () => {
    regions.forEach((r) => r.schon.forEach((s) => {
      assert.ok(typeof s.mm === 'string' && s.mm.length, `${r.id}/${s.fisch}: mm fehlt`);
    }));
  });

  test('Entnahmefenster: Höchstmaß größer als Mindestmaß', () => {
    regions.forEach((r) => r.schon.forEach((s) => {
      const m = /(\d+)\s*[–-]\s*(\d+)\s*cm/.exec(s.mm);
      if (m) assert.ok(+m[2] > +m[1], `${r.id}/${s.fisch}: Fenster ${m[1]}–${m[2]}`);
    }));
  });

  test('Fischarten pro Region sind eindeutig', () => {
    regions.forEach((r) => {
      const namen = r.schon.map((s) => s.fisch);
      assert.equal(new Set(namen).size, namen.length, `${r.id}: doppelte Art in schon`);
    });
  });
});

describe('Manifest & JSON-Dateien', () => {
  const dataDir = path.join(ROOT, 'data');

  test('jede Region hat eine JSON-Datei', () => {
    regions.forEach((r) => {
      assert.ok(fs.existsSync(path.join(dataDir, r.id + '.json')), `data/${r.id}.json fehlt`);
    });
  });

  test('das Manifest listet exakt die vorhandenen Regionen', () => {
    const manifest = JSON.parse(fs.readFileSync(path.join(dataDir, 'regionen.json'), 'utf8'));
    const soll = regions.map((r) => r.id + '.json').sort();
    assert.deepEqual([...manifest].sort(), soll,
      'Manifest weicht ab – genau dieser Fehler machte die Gießen-Region live unsichtbar');
  });

  test('JSON-Dateien sind identisch zu den eingebetteten Daten', () => {
    regions.forEach((r) => {
      const disk = fs.readFileSync(path.join(dataDir, r.id + '.json'), 'utf8');
      const soll = JSON.stringify(JSON.parse(JSON.stringify(r)), null, 1);
      assert.equal(disk, soll, `data/${r.id}.json driftet – gen-data.mjs ausführen`);
    });
  });
});
