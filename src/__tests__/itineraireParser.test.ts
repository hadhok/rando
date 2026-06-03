import { parseItineraire, Itineraire } from '../utils/itineraireParser';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeRow(cells: string[], rowClass?: string, opts: { isJour?: boolean } = {}): string {
  if (opts.isJour) {
    return `<tr><td class="jour">${cells[0]}</td></tr>`;
  }
  const tds = cells.map(c => `<td>${c}</td>`).join('');
  const cls = rowClass ? ` class="${rowClass}"` : '';
  return `<tr${cls}>${tds}</tr>`;
}

function makeDoc(options: {
  title?: string;
  subtitle?: string;
  warn?: string;
  note?: string;
  rows?: string;
}): string {
  const { title = 'Test Trek', subtitle = '', warn = '', note = '', rows = '' } = options;
  return `<html>
    <h1>${title}</h1>
    ${subtitle ? `<p class="subtitle">${subtitle}</p>` : ''}
    ${warn ? `<div class="warn">${warn}</div>` : ''}
    ${note ? `<p class="note">${note}</p>` : ''}
    <table><tbody>
      ${rows}
    </tbody></table>
  </html>`;
}

function minimalDoc(extraRows = ''): string {
  const jourow = makeRow(['Jour 1'], undefined, { isJour: true });
  const dataRow = makeRow(['Départ', '0 km', '100 m', '—', '—', '—', '—', '09h00']);
  return makeDoc({ rows: jourow + dataRow + extraRows });
}

// ─── Basic parsing ─────────────────────────────────────────────────────────────

describe('parseItineraire', () => {
  test('returns null for empty string', () => {
    expect(parseItineraire('')).toBeNull();
  });

  test('returns null for HTML without <tbody>', () => {
    expect(parseItineraire('<html><h1>Test</h1></html>')).toBeNull();
  });

  test('returns a result with empty waypoints when only jour rows (no data rows)', () => {
    // A jour row creates a day entry; the function only returns null when days[] is empty
    const html = makeDoc({ rows: makeRow(['Jour 1'], undefined, { isJour: true }) });
    const result = parseItineraire(html);
    expect(result).not.toBeNull();
    expect(result!.days[0].waypoints).toHaveLength(0);
  });

  test('returns null for tbody with data rows but no jour header', () => {
    const dataRow = makeRow(['Départ', '0 km', '100 m', '—', '—', '—', '—', '09h00']);
    const html = makeDoc({ rows: dataRow });
    // No currentDay → no waypoints → days is empty → null
    expect(parseItineraire(html)).toBeNull();
  });

  test('parses title correctly', () => {
    const result = parseItineraire(minimalDoc())!;
    expect(result.title).toBe('Test Trek');
  });

  test('falls back to "Itinéraire" when no <h1>', () => {
    const html = `<html><table><tbody>
      ${makeRow(['J1'], undefined, { isJour: true })}
      ${makeRow(['X', '0', '0', '—', '—', '—', '—', '09h00'])}
    </tbody></table></html>`;
    expect(parseItineraire(html)!.title).toBe('Itinéraire');
  });

  test('parses subtitle', () => {
    const html = makeDoc({
      subtitle: 'GR10 · 34 km · +2300 m',
      rows: makeRow(['J1'], undefined, { isJour: true }) + makeRow(['A', '0', '100m', '+', '-', '0h', '0h', '09h00']),
    });
    expect(parseItineraire(html)!.subtitle).toBe('GR10 · 34 km · +2300 m');
  });

  test('subtitle is empty string when absent', () => {
    expect(parseItineraire(minimalDoc())!.subtitle).toBe('');
  });

  test('parses warnings (single)', () => {
    const html = makeDoc({
      warn: '⚠️ Danger en cas de pluie',
      rows: makeRow(['J1'], undefined, { isJour: true }) + makeRow(['A', '0', '100m', '+', '-', '0h', '0h', '09h00']),
    });
    expect(parseItineraire(html)!.warnings).toEqual(['⚠️ Danger en cas de pluie']);
  });

  test('parses warnings (multiple via <br>)', () => {
    const html = makeDoc({
      warn: 'Premier avertissement<br>Deuxième avertissement<br/>Troisième',
      rows: makeRow(['J1'], undefined, { isJour: true }) + makeRow(['A', '0', '100m', '+', '-', '0h', '0h', '09h00']),
    });
    const warnings = parseItineraire(html)!.warnings;
    expect(warnings).toHaveLength(3);
    expect(warnings[0]).toBe('Premier avertissement');
    expect(warnings[2]).toBe('Troisième');
  });

  test('warnings is empty array when none', () => {
    expect(parseItineraire(minimalDoc())!.warnings).toEqual([]);
  });

  test('parses notes', () => {
    const html = makeDoc({
      note: 'Réserver le refuge à l\'avance.',
      rows: makeRow(['J1'], undefined, { isJour: true }) + makeRow(['A', '0', '100m', '+', '-', '0h', '0h', '09h00']),
    });
    expect(parseItineraire(html)!.notes).toBe("Réserver le refuge à l'avance.");
  });

  test('notes is empty string when absent', () => {
    expect(parseItineraire(minimalDoc())!.notes).toBe('');
  });
});

// ─── Days and waypoints ────────────────────────────────────────────────────────

describe('parseItineraire days', () => {
  test('parses single day with label', () => {
    const result = parseItineraire(minimalDoc())!;
    expect(result.days).toHaveLength(1);
    expect(result.days[0].label).toBe('Jour 1');
  });

  test('parses multiple days', () => {
    const rows = [
      makeRow(['Jour 1'], undefined, { isJour: true }),
      makeRow(['A', '0 km', '100 m', '—', '—', '—', '—', '09h00']),
      makeRow(['Jour 2'], undefined, { isJour: true }),
      makeRow(['B', '5 km', '200 m', '+100m', '—', '+1h', '1h', '10h00']),
    ].join('\n');
    const result = parseItineraire(makeDoc({ rows }))!;
    expect(result.days).toHaveLength(2);
    expect(result.days[0].label).toBe('Jour 1');
    expect(result.days[1].label).toBe('Jour 2');
  });

  test('waypoints assigned to correct day', () => {
    const rows = [
      makeRow(['Jour 1'], undefined, { isJour: true }),
      makeRow(['A', '0 km', '100 m', '—', '—', '—', '—', '09h00']),
      makeRow(['B', '5 km', '200 m', '+100m', '—', '+1h', '1h', '10h00']),
      makeRow(['Jour 2'], undefined, { isJour: true }),
      makeRow(['C', '0 km', '200 m', '—', '—', '—', '—', '09h00']),
    ].join('\n');
    const result = parseItineraire(makeDoc({ rows }))!;
    expect(result.days[0].waypoints).toHaveLength(2);
    expect(result.days[1].waypoints).toHaveLength(1);
  });

  test('data row before any jour header is ignored', () => {
    const rows = [
      makeRow(['Orphan', '0', '0', '—', '—', '—', '—', '09h00']),
      makeRow(['Jour 1'], undefined, { isJour: true }),
      makeRow(['A', '0 km', '100 m', '—', '—', '—', '—', '09h00']),
    ].join('\n');
    const result = parseItineraire(makeDoc({ rows }))!;
    expect(result.days).toHaveLength(1);
    expect(result.days[0].waypoints).toHaveLength(1);
  });

  test('row with fewer than 8 cells is skipped', () => {
    const rows = [
      makeRow(['Jour 1'], undefined, { isJour: true }),
      // Only 7 cells
      '<tr><td>A</td><td>0</td><td>100m</td><td>—</td><td>—</td><td>—</td><td>—</td></tr>',
      makeRow(['B', '0 km', '100 m', '—', '—', '—', '—', '09h00']),
    ].join('\n');
    const result = parseItineraire(makeDoc({ rows }))!;
    expect(result.days[0].waypoints).toHaveLength(1);
    expect(result.days[0].waypoints[0].name).toBe('B');
  });
});

// ─── Waypoint field extraction ─────────────────────────────────────────────────

describe('parseItineraire waypoint fields', () => {
  function parseFirstWaypoint(cells: string[], rowClass?: string) {
    const rows = [
      makeRow(['Jour 1'], undefined, { isJour: true }),
      makeRow(cells, rowClass),
    ].join('\n');
    return parseItineraire(makeDoc({ rows }))!.days[0].waypoints[0];
  }

  test('extracts all 8 fields correctly', () => {
    const w = parseFirstWaypoint(['Lac Bersau', '9.5 km', '2083 m', '+850m', '-10m', '+1h', '5h23', '14h23'], 'biv');
    expect(w.name).toBe('Lac Bersau');
    expect(w.distCum).toBe('9.5 km');
    expect(w.alt).toBe('2083 m');
    expect(w.dp).toBe('+850m');
    expect(w.dm).toBe('-10m');
    expect(w.segTime).toBe('+1h');
    expect(w.cumTime).toBe('5h23');
    expect(w.heure).toBe('14h23');
    expect(w.rowClass).toBe('biv');
  });

  test('rowClass is empty string when no class attribute', () => {
    const w = parseFirstWaypoint(['A', '0', '100m', '—', '—', '—', '—', '09h00']);
    expect(w.rowClass).toBe('');
  });

  test('strips HTML tags from cell content', () => {
    const rows = [
      makeRow(['Jour 1'], undefined, { isJour: true }),
      `<tr><td><strong>Lac Roumassot</strong></td><td>6.5 km</td><td>1845 m</td><td>+580m</td><td>—</td><td>+2h</td><td>3h38</td><td>12h38</td></tr>`,
    ].join('\n');
    const w = parseItineraire(makeDoc({ rows }))!.days[0].waypoints[0];
    expect(w.name).toBe('Lac Roumassot');
  });

  test('decodes HTML entities in content', () => {
    const rows = [
      makeRow(['Jour 1'], undefined, { isJour: true }),
      `<tr><td>Col d&amp;apos;Ibardin</td><td>7.5 km</td><td>318 m</td><td>—</td><td>—</td><td>—</td><td>—</td><td>13h47</td></tr>`,
    ].join('\n');
    // &amp; → & (not &apos; since only specific entities are decoded)
    const w = parseItineraire(makeDoc({ rows }))!.days[0].waypoints[0];
    expect(w.name).toContain('&');
  });
});

// ─── Badge extraction ──────────────────────────────────────────────────────────

describe('parseItineraire badge extraction', () => {
  function badgesFor(tdContent: string): string[] {
    const rows = [
      makeRow(['Jour 1'], undefined, { isJour: true }),
      `<tr><td>${tdContent}</td><td>0</td><td>100m</td><td>—</td><td>—</td><td>—</td><td>—</td><td>09h00</td></tr>`,
    ].join('\n');
    return parseItineraire(makeDoc({ rows }))!.days[0].waypoints[0].badges;
  }

  test('extracts single badge', () => {
    const b = badgesFor('<span class="badge b-eau">💧</span>Lac');
    expect(b).toContain('eau');
  });

  test('extracts multiple badges', () => {
    const b = badgesFor('<span class="badge b-biv">⛺</span><span class="badge b-eau">💧</span>Lac Bersau');
    expect(b).toContain('biv');
    expect(b).toContain('eau');
  });

  test('no badges → empty array', () => {
    expect(badgesFor('Col du Lurien')).toEqual([]);
  });

  test('badge name is stripped from display name', () => {
    const rows = [
      makeRow(['Jour 1'], undefined, { isJour: true }),
      `<tr><td><span class="badge b-ref">🏠</span>Refuge Arrémoulit</td><td>3.4 km</td><td>2260 m</td><td>+400m</td><td>—</td><td>+2h</td><td>2h20</td><td>12h20</td></tr>`,
    ].join('\n');
    const w = parseItineraire(makeDoc({ rows }))!.days[0].waypoints[0];
    expect(w.name).toBe('Refuge Arrémoulit');
    expect(w.badges).toContain('ref');
  });

  test('all valid badge types are parsed', () => {
    const types = ['dep', 'fin', 'eau', 'biv', 'ref', 'parc', 'star', 'stop'];
    for (const type of types) {
      const b = badgesFor(`<span class="badge b-${type}">x</span>Point`);
      expect(b).toContain(type);
    }
  });
});

// ─── stripHtml edge cases (tested via title parsing) ──────────────────────────

describe('stripHtml (via title parsing)', () => {
  function parseTitle(h1Inner: string): string {
    const html = `<html>
      <h1>${h1Inner}</h1>
      <table><tbody>
        ${makeRow(['J1'], undefined, { isJour: true })}
        ${makeRow(['A', '0', '100m', '—', '—', '—', '—', '09h00'])}
      </tbody></table>
    </html>`;
    return parseItineraire(html)!.title;
  }

  test('strips nested tags', () => {
    expect(parseTitle('<strong>GR10</strong> — <em>Pyrénées</em>')).toBe('GR10 — Pyrénées');
  });

  test('decodes &amp;', () => {
    expect(parseTitle('Lacs &amp; Montagnes')).toBe('Lacs & Montagnes');
  });

  test('decodes &lt; and &gt;', () => {
    expect(parseTitle('A &lt; B &gt; C')).toBe('A < B > C');
  });

  test('decodes &nbsp;', () => {
    expect(parseTitle('A&nbsp;B')).toBe('A B');
  });

  test('collapses multiple spaces', () => {
    expect(parseTitle('Col   du   Lurien')).toBe('Col du Lurien');
  });

  test('trims leading and trailing whitespace', () => {
    expect(parseTitle('  GR10  ')).toBe('GR10');
  });
});
