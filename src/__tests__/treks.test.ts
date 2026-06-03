import { TREKS, Trek, TrekDay, StageRow } from '../data/treks';

// ─── Data integrity: top-level fields ────────────────────────────────────────

describe('TREKS array', () => {
  test('has at least 4 treks', () => {
    expect(TREKS.length).toBeGreaterThanOrEqual(4);
  });

  test('contains all expected trek IDs', () => {
    const ids = TREKS.map(t => t.id);
    expect(ids).toContain('gr10');
    expect(ids).toContain('ayous');
    expect(ids).toContain('artouste');
    expect(ids).toContain('bidarray-sare');
  });

  test('all trek IDs are unique', () => {
    const ids = TREKS.map(t => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('Each trek has required fields', () => {
  test.each(TREKS)('$id — id is non-empty string', ({ id }) => {
    expect(typeof id).toBe('string');
    expect(id.trim().length).toBeGreaterThan(0);
  });

  test.each(TREKS)('$id — name is non-empty string', ({ name }) => {
    expect(typeof name).toBe('string');
    expect(name.trim().length).toBeGreaterThan(0);
  });

  test.each(TREKS)('$id — days is a positive integer', ({ days }) => {
    expect(Number.isInteger(days)).toBe(true);
    expect(days).toBeGreaterThanOrEqual(1);
  });

  test.each(TREKS)('$id — distance is non-empty string', ({ distance }) => {
    expect(typeof distance).toBe('string');
    expect(distance.trim().length).toBeGreaterThan(0);
  });

  test.each(TREKS)('$id — dp (dénivelé) is non-empty string', ({ dp }) => {
    expect(typeof dp).toBe('string');
    expect(dp.trim().length).toBeGreaterThan(0);
  });

  test.each(TREKS)('$id — region is non-empty string', ({ region }) => {
    expect(typeof region).toBe('string');
    expect(region.trim().length).toBeGreaterThan(0);
  });

  test.each(TREKS)('$id — maxAlt is non-empty string', ({ maxAlt }) => {
    expect(typeof maxAlt).toBe('string');
    expect(maxAlt.trim().length).toBeGreaterThan(0);
  });

  test.each(TREKS)('$id — difficulty is 1, 2 or 3', ({ difficulty }) => {
    expect([1, 2, 3]).toContain(difficulty);
  });

  test.each(TREKS)('$id — color is a valid hex color', ({ color }) => {
    expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
  });

  test.each(TREKS)('$id — cardElevPath is a non-empty SVG path', ({ cardElevPath }) => {
    expect(typeof cardElevPath).toBe('string');
    expect(cardElevPath.trim().length).toBeGreaterThan(0);
    expect(cardElevPath).toMatch(/^M/);
  });

  test.each(TREKS)('$id — detailElevPath is a non-empty SVG path', ({ detailElevPath }) => {
    expect(typeof detailElevPath).toBe('string');
    expect(detailElevPath.trim().length).toBeGreaterThan(0);
    expect(detailElevPath).toMatch(/^M/);
  });

  test.each(TREKS)('$id — SVG paths end with closing Z', ({ cardElevPath, detailElevPath }) => {
    expect(cardElevPath.trimEnd()).toMatch(/Z$/);
    expect(detailElevPath.trimEnd()).toMatch(/Z$/);
  });
});

// ─── trekDays ─────────────────────────────────────────────────────────────────

describe('trekDays integrity', () => {
  test.each(TREKS)('$id — trekDays count matches days field', ({ id, days, trekDays }) => {
    expect(trekDays).toHaveLength(days);
  });

  test.each(TREKS)('$id — every day has a title', ({ trekDays }) => {
    for (const day of trekDays) {
      expect(typeof day.title).toBe('string');
      expect(day.title.trim().length).toBeGreaterThan(0);
    }
  });

  test.each(TREKS)('$id — every day has at least one stage', ({ trekDays }) => {
    for (const day of trekDays) {
      expect(day.stages.length).toBeGreaterThanOrEqual(1);
    }
  });

  test.each(TREKS)('$id — every stage has required string fields', ({ trekDays }) => {
    for (const day of trekDays) {
      for (const stage of day.stages) {
        expect(typeof stage.name).toBe('string');
        expect(stage.name.trim().length).toBeGreaterThan(0);
        expect(typeof stage.dist).toBe('string');
        expect(typeof stage.alt).toBe('string');
        expect(typeof stage.dp).toBe('string');
        expect(typeof stage.time).toBe('string');
      }
    }
  });

  test.each(TREKS)('$id — stage badges are valid types', ({ trekDays }) => {
    const valid = new Set(['water', 'biv', 'village', 'refuge']);
    for (const day of trekDays) {
      for (const stage of day.stages) {
        for (const badge of (stage.badges ?? [])) {
          expect(valid.has(badge)).toBe(true);
        }
      }
    }
  });

  test.each(TREKS)('$id — stage rowType is valid when present', ({ trekDays }) => {
    const valid = new Set(['normal', 'biv', 'highlight']);
    for (const day of trekDays) {
      for (const stage of day.stages) {
        if (stage.rowType !== undefined) {
          expect(valid.has(stage.rowType)).toBe(true);
        }
      }
    }
  });
});

// ─── notes ────────────────────────────────────────────────────────────────────

describe('trek notes integrity', () => {
  test.each(TREKS)('$id — notes is an array', ({ notes }) => {
    expect(Array.isArray(notes)).toBe(true);
  });

  test.each(TREKS)('$id — every note has icon, label, sub', ({ notes }) => {
    for (const note of notes) {
      expect(typeof note.icon).toBe('string');
      expect(note.icon.trim().length).toBeGreaterThan(0);
      expect(typeof note.label).toBe('string');
      expect(note.label.trim().length).toBeGreaterThan(0);
      expect(typeof note.sub).toBe('string');
      expect(note.sub.trim().length).toBeGreaterThan(0);
    }
  });
});

// ─── Individual trek spot-checks ───────────────────────────────────────────────

describe('GR10 trek specifics', () => {
  const gr10 = TREKS.find(t => t.id === 'gr10')!;

  test('has correct distance', () => {
    expect(gr10.distance).toBe('34km');
  });

  test('has correct region', () => {
    expect(gr10.region).toBe('Pays B.');
  });

  test('has correct number of days', () => {
    expect(gr10.days).toBe(3);
  });

  test('first stage of day 1 is Biriatou at 0km', () => {
    const first = gr10.trekDays[0].stages[0];
    expect(first.name).toBe('Biriatou');
    expect(first.dist).toBe('0km');
  });

  test('last stage of last day has a name', () => {
    const lastDay = gr10.trekDays[gr10.trekDays.length - 1];
    const lastStage = lastDay.stages[lastDay.stages.length - 1];
    expect(typeof lastStage.name).toBe('string');
  });

  test('has parking note', () => {
    const parkingNote = gr10.notes.find(n => n.label.toLowerCase().includes('parking'));
    expect(parkingNote).toBeDefined();
  });
});

describe('Ayous trek specifics', () => {
  const ayous = TREKS.find(t => t.id === 'ayous')!;

  test('maxAlt contains 2083', () => {
    expect(ayous.maxAlt).toContain('2083');
  });

  test('has a biv or refuge stage', () => {
    const allStages = ayous.trekDays.flatMap(d => d.stages);
    const hasBiv = allStages.some(s => s.badges?.includes('biv') || s.badges?.includes('refuge'));
    expect(hasBiv).toBe(true);
  });

  test('is a 2-day trek', () => {
    expect(ayous.days).toBe(2);
    expect(ayous.trekDays).toHaveLength(2);
  });
});

describe('Bidarray-Sare trek specifics', () => {
  const trek = TREKS.find(t => t.id === 'bidarray-sare')!;

  test('trek exists', () => {
    expect(trek).toBeDefined();
  });

  test('is a 2-day trek', () => {
    expect(trek.days).toBe(2);
    expect(trek.trekDays).toHaveLength(2);
  });

  test('starts at Bidarray', () => {
    const firstStage = trek.trekDays[0].stages[0];
    expect(firstStage.name.toLowerCase()).toContain('bidarray');
  });

  test('ends at Sare', () => {
    const lastDay = trek.trekDays[trek.trekDays.length - 1];
    const lastStages = lastDay.stages;
    const endsAtSare = lastStages.some(s => s.name.toLowerCase().includes('sare'));
    expect(endsAtSare).toBe(true);
  });

  test('maxAlt is 1044m (Iparla ridge)', () => {
    expect(trek.maxAlt).toBe('1044m');
  });

  test('has at least one warning note', () => {
    const hasWarning = trek.notes.some(n => n.icon === '⚠️');
    expect(hasWarning).toBe(true);
  });

  test('has village badge somewhere (Ainhoa or Sare)', () => {
    const allStages = trek.trekDays.flatMap(d => d.stages);
    expect(allStages.some(s => s.badges?.includes('village'))).toBe(true);
  });
});

describe('Artouste trek specifics', () => {
  const artouste = TREKS.find(t => t.id === 'artouste')!;

  test('has a refuge stage', () => {
    const allStages = artouste.trekDays.flatMap(d => d.stages);
    expect(allStages.some(s => s.badges?.includes('refuge'))).toBe(true);
  });

  test('day 2 title mentions train', () => {
    expect(artouste.trekDays[1].title.toLowerCase()).toContain('train');
  });
});
