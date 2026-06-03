/**
 * Tests for the weather zone mappings in TerrainScreen.
 * We extract the constants here to keep tests pure (no React imports).
 */

import { TREKS } from '../data/treks';

// Mirrors the constants from TerrainScreen.tsx
const ZONE_BY_TREK: Record<string, { lat: number; lng: number; label: string; sub: string }> = {
  gr10:            { lat: 43.37, lng: -1.78, label: 'GR10 — Pays Basque',    sub: 'Zone côtière · 0–600m' },
  ayous:           { lat: 42.84, lng: -0.44, label: 'Pyrénées — Ossau',      sub: 'Altitude 2000m+' },
  artouste:        { lat: 42.84, lng: -0.44, label: 'Pyrénées — Ossau',      sub: 'Altitude 2000m+' },
  'bidarray-sare': { lat: 43.29, lng: -1.44, label: 'Bidarray – Sare',       sub: 'Crêtes Iparla · 110–1044m' },
};

const ALL_ZONES = [
  { id: 'gr10',          ...ZONE_BY_TREK.gr10 },
  { id: 'ossau',         ...ZONE_BY_TREK.ayous },
  { id: 'bidarray-sare', ...ZONE_BY_TREK['bidarray-sare'] },
];

const TREK_TO_WEATHER_ZONE: Record<string, string> = {
  gr10:            'gr10',
  ayous:           'ossau',
  artouste:        'ossau',
  'bidarray-sare': 'bidarray-sare',
};

// ─── Zone coverage ────────────────────────────────────────────────────────────

describe('ZONE_BY_TREK', () => {
  test('every trek in TREKS has a mapping', () => {
    for (const trek of TREKS) {
      expect(ZONE_BY_TREK[trek.id]).toBeDefined();
    }
  });

  test('every zone has a valid lat (between -90 and 90)', () => {
    for (const zone of Object.values(ZONE_BY_TREK)) {
      expect(zone.lat).toBeGreaterThan(-90);
      expect(zone.lat).toBeLessThan(90);
    }
  });

  test('every zone has a valid lng (between -180 and 180)', () => {
    for (const zone of Object.values(ZONE_BY_TREK)) {
      expect(zone.lng).toBeGreaterThan(-180);
      expect(zone.lng).toBeLessThan(180);
    }
  });

  test('zone coordinates are in the Pyrenees region', () => {
    // Pyrenees approx: lat 42–44, lng -2 to 3
    for (const zone of Object.values(ZONE_BY_TREK)) {
      expect(zone.lat).toBeGreaterThan(42);
      expect(zone.lat).toBeLessThan(44);
      expect(zone.lng).toBeGreaterThan(-3);
      expect(zone.lng).toBeLessThan(4);
    }
  });

  test('every zone has a non-empty label', () => {
    for (const zone of Object.values(ZONE_BY_TREK)) {
      expect(zone.label.trim().length).toBeGreaterThan(0);
    }
  });

  test('every zone has a non-empty sub', () => {
    for (const zone of Object.values(ZONE_BY_TREK)) {
      expect(zone.sub.trim().length).toBeGreaterThan(0);
    }
  });
});

// ─── TREK_TO_WEATHER_ZONE ─────────────────────────────────────────────────────

describe('TREK_TO_WEATHER_ZONE', () => {
  test('every trek in TREKS has a mapping', () => {
    for (const trek of TREKS) {
      expect(TREK_TO_WEATHER_ZONE[trek.id]).toBeDefined();
    }
  });

  test('every mapped zone ID exists in ALL_ZONES', () => {
    const zoneIds = new Set(ALL_ZONES.map(z => z.id));
    for (const zoneId of Object.values(TREK_TO_WEATHER_ZONE)) {
      expect(zoneIds.has(zoneId)).toBe(true);
    }
  });

  test('gr10 maps to gr10 zone', () => {
    expect(TREK_TO_WEATHER_ZONE['gr10']).toBe('gr10');
  });

  test('ayous and artouste share the ossau zone', () => {
    expect(TREK_TO_WEATHER_ZONE['ayous']).toBe('ossau');
    expect(TREK_TO_WEATHER_ZONE['artouste']).toBe('ossau');
  });

  test('bidarray-sare has its own zone', () => {
    expect(TREK_TO_WEATHER_ZONE['bidarray-sare']).toBe('bidarray-sare');
  });
});

// ─── ALL_ZONES ────────────────────────────────────────────────────────────────

describe('ALL_ZONES', () => {
  test('has at least 3 zones', () => {
    expect(ALL_ZONES.length).toBeGreaterThanOrEqual(3);
  });

  test('all zone IDs are unique', () => {
    const ids = ALL_ZONES.map(z => z.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('every zone has id, lat, lng, label, sub', () => {
    for (const zone of ALL_ZONES) {
      expect(typeof zone.id).toBe('string');
      expect(typeof zone.lat).toBe('number');
      expect(typeof zone.lng).toBe('number');
      expect(typeof zone.label).toBe('string');
      expect(typeof zone.sub).toBe('string');
    }
  });

  test('contains gr10, ossau, bidarray-sare', () => {
    const ids = ALL_ZONES.map(z => z.id);
    expect(ids).toContain('gr10');
    expect(ids).toContain('ossau');
    expect(ids).toContain('bidarray-sare');
  });

  test('ossau zone is at high altitude (Pyrenees mountains)', () => {
    const ossau = ALL_ZONES.find(z => z.id === 'ossau')!;
    expect(ossau.lat).toBeCloseTo(42.84, 1);
    expect(ossau.sub).toMatch(/2000/);
  });

  test('bidarray-sare zone is in Pays Basque low-to-mid altitude', () => {
    const zone = ALL_ZONES.find(z => z.id === 'bidarray-sare')!;
    expect(zone.lat).toBeCloseTo(43.29, 1);
    expect(zone.sub).toMatch(/1044/);
  });
});

// ─── Filter logic (mirrors TerrainScreen active trek filtering) ───────────────

describe('Weather zone filtering logic', () => {
  function getVisibleZones(activeTrekId: string | null): typeof ALL_ZONES {
    const weatherZoneId = activeTrekId
      ? (TREK_TO_WEATHER_ZONE[activeTrekId] ?? activeTrekId)
      : null;
    return weatherZoneId
      ? ALL_ZONES.filter(z => z.id === weatherZoneId)
      : ALL_ZONES;
  }

  test('no active trek → all zones visible', () => {
    expect(getVisibleZones(null)).toHaveLength(ALL_ZONES.length);
  });

  test('gr10 active → only gr10 zone', () => {
    const zones = getVisibleZones('gr10');
    expect(zones).toHaveLength(1);
    expect(zones[0].id).toBe('gr10');
  });

  test('ayous active → only ossau zone', () => {
    const zones = getVisibleZones('ayous');
    expect(zones).toHaveLength(1);
    expect(zones[0].id).toBe('ossau');
  });

  test('artouste active → only ossau zone', () => {
    const zones = getVisibleZones('artouste');
    expect(zones).toHaveLength(1);
    expect(zones[0].id).toBe('ossau');
  });

  test('bidarray-sare active → only bidarray-sare zone', () => {
    const zones = getVisibleZones('bidarray-sare');
    expect(zones).toHaveLength(1);
    expect(zones[0].id).toBe('bidarray-sare');
  });

  test('unknown trek ID falls back to using trek id as zone id', () => {
    // TREK_TO_WEATHER_ZONE[unknown] is undefined → falls back to activeTrekId itself
    const zones = getVisibleZones('unknown-trek');
    // 'unknown-trek' zone doesn't exist → filter returns empty
    expect(zones).toHaveLength(0);
  });
});
