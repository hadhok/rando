import { parseGpx, GpxWaypoint } from '../utils/gpxParser';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeGpx(options: {
  name?: string;
  trkpts?: Array<{ lat: number; lon: number }>;
  wpts?: Array<{ lat: number; lon: number; name?: string; ele?: number; desc?: string }>;
}): string {
  const trkptXml = (options.trkpts ?? [])
    .map(p => `<trkpt lat="${p.lat}" lon="${p.lon}"></trkpt>`)
    .join('\n');

  const wptXml = (options.wpts ?? [])
    .map(w => {
      const parts = [
        w.name ? `<name>${w.name}</name>` : '',
        w.ele != null ? `<ele>${w.ele}</ele>` : '',
        w.desc ? `<desc>${w.desc}</desc>` : '',
      ].join('');
      return `<wpt lat="${w.lat}" lon="${w.lon}">${parts}</wpt>`;
    })
    .join('\n');

  return `<?xml version="1.0"?>
<gpx>
  ${options.name ? `<name>${options.name}</name>` : ''}
  <trk><trkseg>
    ${trkptXml}
  </trkseg></trk>
  ${wptXml}
</gpx>`;
}

// ─── parseGpx: basic cases ────────────────────────────────────────────────────

describe('parseGpx', () => {
  test('returns null for empty string', () => {
    expect(parseGpx('')).toBeNull();
  });

  test('returns null for XML without points or waypoints', () => {
    expect(parseGpx('<gpx><name>Test</name></gpx>')).toBeNull();
  });

  test('returns null for completely invalid content', () => {
    expect(parseGpx('not xml at all')).toBeNull();
  });

  test('parses track name correctly', () => {
    const gpx = makeGpx({ name: 'GR10 Étape 1', trkpts: [{ lat: 43.37, lon: -1.78 }] });
    const result = parseGpx(gpx);
    expect(result?.name).toBe('GR10 Étape 1');
  });

  test('uses fallback name when <name> absent', () => {
    const gpx = makeGpx({ trkpts: [{ lat: 43.37, lon: -1.78 }] });
    const result = parseGpx(gpx);
    expect(result?.name).toBe('Trace importée');
  });

  test('parses track points correctly', () => {
    const trkpts = [
      { lat: 43.37, lon: -1.78 },
      { lat: 43.38, lon: -1.77 },
      { lat: 43.39, lon: -1.76 },
    ];
    const result = parseGpx(makeGpx({ trkpts }));
    expect(result?.points).toHaveLength(3);
    expect(result?.points[0]).toEqual([43.37, -1.78]);
    expect(result?.points[2]).toEqual([43.39, -1.76]);
  });

  test('skips trkpt with invalid lat/lon', () => {
    const gpx = `<gpx>
      <trk><trkseg>
        <trkpt lat="NaN" lon="-1.78"></trkpt>
        <trkpt lat="43.37" lon="-1.78"></trkpt>
      </trkseg></trk>
    </gpx>`;
    const result = parseGpx(gpx);
    expect(result?.points).toHaveLength(1);
  });

  test('works with only waypoints (no track points)', () => {
    const gpx = makeGpx({
      wpts: [
        { lat: 43.37, lon: -1.78, name: 'Départ' },
        { lat: 43.40, lon: -1.75, name: 'Arrivée' },
      ],
    });
    const result = parseGpx(gpx);
    expect(result).not.toBeNull();
    expect(result?.points).toHaveLength(0);
    expect(result?.waypoints).toHaveLength(2);
  });

  // ── Waypoint cumulative computations ───────────────────────────────────────

  test('first waypoint has all cumulative fields at zero', () => {
    const gpx = makeGpx({
      wpts: [
        { lat: 43.37, lon: -1.78, name: 'Start', ele: 100 },
        { lat: 43.40, lon: -1.75, name: 'End', ele: 200 },
      ],
    });
    const result = parseGpx(gpx);
    const first = result!.waypoints[0];
    expect(first.distCumKm).toBe(0);
    expect(first.distSegKm).toBe(0);
    expect(first.dpCumM).toBe(0);
    expect(first.dmCumM).toBe(0);
    expect(first.segTimeH).toBe(0);
    expect(first.cumTimeH).toBe(0);
  });

  test('cumulative distance increases monotonically', () => {
    const gpx = makeGpx({
      wpts: [
        { lat: 43.0, lon: -1.0, name: 'A', ele: 100 },
        { lat: 43.1, lon: -1.0, name: 'B', ele: 200 },
        { lat: 43.2, lon: -1.0, name: 'C', ele: 300 },
      ],
    });
    const wpts = parseGpx(gpx)!.waypoints;
    expect(wpts[1].distCumKm).toBeGreaterThan(0);
    expect(wpts[2].distCumKm).toBeGreaterThan(wpts[1].distCumKm);
  });

  test('dp accumulates uphill, dm stays 0 on flat uphill route', () => {
    const gpx = makeGpx({
      wpts: [
        { lat: 43.0, lon: -1.0, name: 'A', ele: 0 },
        { lat: 43.1, lon: -1.0, name: 'B', ele: 300 },
        { lat: 43.2, lon: -1.0, name: 'C', ele: 600 },
      ],
    });
    const wpts = parseGpx(gpx)!.waypoints;
    expect(wpts[2].dpCumM).toBeCloseTo(600, 0);
    expect(wpts[2].dmCumM).toBe(0);
  });

  test('dm accumulates downhill, dp stays 0 on descent', () => {
    const gpx = makeGpx({
      wpts: [
        { lat: 43.0, lon: -1.0, name: 'A', ele: 600 },
        { lat: 43.1, lon: -1.0, name: 'B', ele: 300 },
        { lat: 43.2, lon: -1.0, name: 'C', ele: 0 },
      ],
    });
    const wpts = parseGpx(gpx)!.waypoints;
    expect(wpts[2].dmCumM).toBeCloseTo(600, 0);
    expect(wpts[2].dpCumM).toBe(0);
  });

  test('mixed up/down: dp and dm both accumulate correctly', () => {
    const gpx = makeGpx({
      wpts: [
        { lat: 43.0, lon: -1.0, name: 'A', ele: 0 },
        { lat: 43.1, lon: -1.0, name: 'B', ele: 400 },
        { lat: 43.2, lon: -1.0, name: 'C', ele: 100 },
      ],
    });
    const wpts = parseGpx(gpx)!.waypoints;
    const last = wpts[2];
    expect(last.dpCumM).toBeCloseTo(400, 0);
    expect(last.dmCumM).toBeCloseTo(300, 0);
  });

  test('missing elevation defaults to zero eleDiff (no dp/dm)', () => {
    const gpx = makeGpx({
      wpts: [
        { lat: 43.0, lon: -1.0, name: 'A' },
        { lat: 43.1, lon: -1.0, name: 'B' },
      ],
    });
    const wpts = parseGpx(gpx)!.waypoints;
    expect(wpts[1].dpSegM).toBe(0);
    expect(wpts[1].dmSegM).toBe(0);
  });

  test('waypoint fallback name when <name> absent', () => {
    const gpx = `<gpx>
      <wpt lat="43.0" lon="-1.0"></wpt>
      <wpt lat="43.1" lon="-1.0"></wpt>
    </gpx>`;
    const wpts = parseGpx(gpx)!.waypoints;
    expect(wpts[0].name).toBe('Point 1');
    expect(wpts[1].name).toBe('Point 2');
  });

  test('cumTimeH equals sum of all segTimeH', () => {
    const gpx = makeGpx({
      wpts: [
        { lat: 43.0, lon: -1.0, name: 'A', ele: 100 },
        { lat: 43.1, lon: -1.0, name: 'B', ele: 500 },
        { lat: 43.2, lon: -1.0, name: 'C', ele: 200 },
      ],
    });
    const wpts = parseGpx(gpx)!.waypoints;
    const expectedCum = wpts[1].segTimeH + wpts[2].segTimeH;
    expect(wpts[2].cumTimeH).toBeCloseTo(expectedCum, 10);
  });

  test('distCumKm equals sum of segDistKm', () => {
    const gpx = makeGpx({
      wpts: [
        { lat: 43.0, lon: -1.0, name: 'A' },
        { lat: 43.05, lon: -1.0, name: 'B' },
        { lat: 43.1, lon: -1.0, name: 'C' },
      ],
    });
    const wpts = parseGpx(gpx)!.waypoints;
    expect(wpts[2].distCumKm).toBeCloseTo(wpts[1].distSegKm + wpts[2].distSegKm, 10);
  });
});

// ─── detectBadges ─────────────────────────────────────────────────────────────

describe('detectBadges (via parseGpx waypoint names)', () => {
  function badges(name: string, desc?: string): string[] {
    const gpx = `<gpx>
      <wpt lat="43.0" lon="-1.0">
        <name>${name}</name>
        ${desc ? `<desc>${desc}</desc>` : ''}
      </wpt>
    </gpx>`;
    return parseGpx(gpx)!.waypoints[0].badges;
  }

  test('lac → eau', () => expect(badges('Lac de montagne')).toContain('eau'));
  test('rivière → eau', () => expect(badges('Rivière du gave')).toContain('eau'));
  test('fontaine → eau', () => expect(badges('Fontaine du village')).toContain('eau'));
  test('source → eau', () => expect(badges('Source naturelle')).toContain('eau'));
  test('pont → eau', () => expect(badges('Pont de Bious')).toContain('eau'));
  test('ruisseau → eau', () => expect(badges('Ruisseau des Bergers')).toContain('eau'));
  test('bivouac → bivouac', () => expect(badges('Bivouac Bersau')).toContain('bivouac'));
  test('camping → bivouac', () => expect(badges('Camping municipal')).toContain('bivouac'));
  test('camp (word boundary) → bivouac', () => expect(badges('Camp de base')).toContain('bivouac'));
  test('tente → bivouac', () => expect(badges('Zone de tente')).toContain('bivouac'));
  test('refuge → refuge', () => expect(badges("Refuge d'Arrémoulit")).toContain('refuge'));
  test('gite → refuge', () => expect(badges('Gite du randonneur')).toContain('refuge'));
  test('cabane → refuge', () => expect(badges('Cabane pastorale')).toContain('refuge'));
  test('parking → parking', () => expect(badges('Parking Bious-Oumettes')).toContain('parking'));
  test('trailhead → parking', () => expect(badges('Trailhead principal')).toContain('parking'));
  test('col (word boundary) → sommet', () => expect(badges('Col du Lurien')).toContain('sommet'));
  test('sommet → sommet', () => expect(badges('Sommet Iparla')).toContain('sommet'));
  test('pic (word boundary) → sommet', () => expect(badges('Pic du Midi')).toContain('sommet'));
  test('crête → sommet', () => expect(badges("Crête d'Iparla")).toContain('sommet'));
  test('pico → sommet', () => expect(badges('Pico de aneto')).toContain('sommet'));
  test('no match → empty array', () => expect(badges('Village de montagne')).toEqual([]));
  test('multiple badges in one name', () => {
    const b = badges('Col lac source');
    expect(b).toContain('sommet');
    expect(b).toContain('eau');
  });
  test('badge detected in desc when name is neutral', () => {
    const b = badges('Étape 2', 'Bivouac autorisé');
    expect(b).toContain('bivouac');
  });
  test('case-insensitive matching', () => {
    expect(badges('LAC')).toContain('eau');
    expect(badges('BIVOUAC')).toContain('bivouac');
    expect(badges('REFUGE')).toContain('refuge');
  });
  test('"camping" within longer word does not false-positive on camp boundary', () => {
    // "camping" should match because /camping/ is in the regex
    expect(badges('Camping des Lacs')).toContain('bivouac');
  });
  test('"accompagnateur" should NOT match camp\\b', () => {
    // "accompagnateur" contains "camp" but not as a word boundary
    expect(badges('Accompagnateur de montagne')).not.toContain('bivouac');
  });
});

// ─── Haversine distance (tested indirectly via segment distances) ──────────────

describe('haversine distance sanity checks (via parseGpx segment)', () => {
  function segDist(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const gpx = makeGpx({
      wpts: [
        { lat: lat1, lon: lon1, name: 'A' },
        { lat: lat2, lon: lon2, name: 'B' },
      ],
    });
    return parseGpx(gpx)!.waypoints[1].distSegKm;
  }

  test('same point → 0 km', () => {
    expect(segDist(43.37, -1.78, 43.37, -1.78)).toBeCloseTo(0, 5);
  });

  test('1° latitude ≈ 111 km', () => {
    const d = segDist(43.0, 0.0, 44.0, 0.0);
    expect(d).toBeGreaterThan(110);
    expect(d).toBeLessThan(112);
  });

  test('Biriatou → Col des Poiriers ~4 km', () => {
    // Biriatou 43.37°N -1.78°E → Col des Poiriers approx 43.38°N -1.73°E
    const d = segDist(43.37, -1.78, 43.38, -1.73);
    expect(d).toBeGreaterThan(3);
    expect(d).toBeLessThan(6);
  });

  test('distance is symmetric', () => {
    const d1 = segDist(43.0, -1.5, 43.1, -1.4);
    const d2 = segDist(43.1, -1.4, 43.0, -1.5);
    expect(d1).toBeCloseTo(d2, 5);
  });

  test('Paris → Bordeaux ≈ 500 km', () => {
    const d = segDist(48.85, 2.35, 44.84, -0.58);
    expect(d).toBeGreaterThan(490);
    expect(d).toBeLessThan(510);
  });
});

// ─── Naismith timing (tested indirectly via segTimeH) ─────────────────────────

describe('Naismith timing (via parseGpx segTimeH)', () => {
  function segTime(lat1: number, lon1: number, lat2: number, lon2: number, ele1?: number, ele2?: number): number {
    const gpx = makeGpx({
      wpts: [
        { lat: lat1, lon: lon1, name: 'A', ele: ele1 },
        { lat: lat2, lon: lon2, name: 'B', ele: ele2 },
      ],
    });
    return parseGpx(gpx)!.waypoints[1].segTimeH;
  }

  test('flat 4 km → 1 hour', () => {
    // 4 km / 4 = 1h, no elevation
    // approximate a 4km flat segment (~0.036° lat diff)
    const t = segTime(43.0, 0.0, 43.036, 0.0, 100, 100);
    expect(t).toBeCloseTo(1, 1);
  });

  test('gaining 300m on 0km → 1 hour', () => {
    // naismith: 0/4 + 300/300 + 0/500 = 1
    const t = segTime(43.0, 0.0, 43.0, 0.0, 0, 300);
    expect(t).toBeCloseTo(1, 5);
  });

  test('losing 500m on 0km → 1 hour', () => {
    // 0/4 + 0/300 + 500/500 = 1
    const t = segTime(43.0, 0.0, 43.0, 0.0, 500, 0);
    expect(t).toBeCloseTo(1, 5);
  });

  test('time is always positive', () => {
    const t = segTime(43.0, -1.0, 43.1, -1.1, 200, 100);
    expect(t).toBeGreaterThan(0);
  });

  test('more distance → more time (same elevation)', () => {
    const t1 = segTime(43.0, 0, 43.05, 0, 100, 100);
    const t2 = segTime(43.0, 0, 43.1, 0, 100, 100);
    expect(t2).toBeGreaterThan(t1);
  });

  test('more gain → more time (same distance)', () => {
    const t1 = segTime(43.0, 0, 43.0, 0, 0, 100);
    const t2 = segTime(43.0, 0, 43.0, 0, 0, 300);
    expect(t2).toBeGreaterThan(t1);
  });
});

// ─── rtept (route points) are parsed like wpt ─────────────────────────────────

describe('parseGpx rtept support', () => {
  test('parses <rtept> elements same as <wpt>', () => {
    const gpx = `<gpx>
      <rte>
        <rtept lat="43.0" lon="-1.0"><name>Départ</name><ele>100</ele></rtept>
        <rtept lat="43.1" lon="-1.1"><name>Arrivée</name><ele>200</ele></rtept>
      </rte>
    </gpx>`;
    const result = parseGpx(gpx);
    expect(result).not.toBeNull();
    expect(result!.waypoints).toHaveLength(2);
    expect(result!.waypoints[0].name).toBe('Départ');
    expect(result!.waypoints[1].dpCumM).toBe(100);
  });
});
