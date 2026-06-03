import { ignTileUrl, computeTilesForBbox, IGN_TILE_CACHE } from '../utils/tileCache';

// ─── ignTileUrl ────────────────────────────────────────────────────────────────

describe('ignTileUrl', () => {
  test('generates well-formed URL', () => {
    const url = ignTileUrl(12, 1607, 1020);
    expect(url).toContain('https://data.geopf.fr/wmts');
    expect(url).toContain('SERVICE=WMTS');
    expect(url).toContain('REQUEST=GetTile');
    expect(url).toContain('VERSION=1.0.0');
    expect(url).toContain('LAYER=GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2');
    expect(url).toContain('STYLE=normal');
    expect(url).toContain('FORMAT=image/png');
    expect(url).toContain('TILEMATRIXSET=PM');
  });

  test('embeds z, y, x in URL', () => {
    const url = ignTileUrl(12, 1607, 1020);
    expect(url).toContain('TILEMATRIX=12');
    expect(url).toContain('TILEROW=1607');
    expect(url).toContain('TILECOL=1020');
  });

  test('different z/y/x produce different URLs', () => {
    expect(ignTileUrl(11, 100, 200)).not.toBe(ignTileUrl(12, 100, 200));
    expect(ignTileUrl(12, 100, 200)).not.toBe(ignTileUrl(12, 101, 200));
    expect(ignTileUrl(12, 100, 200)).not.toBe(ignTileUrl(12, 100, 201));
  });

  test('tile URL contains no placeholder braces', () => {
    const url = ignTileUrl(13, 500, 300);
    expect(url).not.toContain('{');
    expect(url).not.toContain('}');
  });
});

// ─── IGN_TILE_CACHE ────────────────────────────────────────────────────────────

describe('IGN_TILE_CACHE', () => {
  test('is a non-empty string', () => {
    expect(typeof IGN_TILE_CACHE).toBe('string');
    expect(IGN_TILE_CACHE.length).toBeGreaterThan(0);
  });
});

// ─── computeTilesForBbox ──────────────────────────────────────────────────────

describe('computeTilesForBbox', () => {
  // Tiny bbox in the Pyrenees around Lacs d'Ayous
  const minLat = 42.83;
  const maxLat = 42.85;
  const minLng = -0.45;
  const maxLng = -0.43;

  test('returns an array', () => {
    const tiles = computeTilesForBbox(minLat, maxLat, minLng, maxLng);
    expect(Array.isArray(tiles)).toBe(true);
  });

  test('returns tiles for each zoom level 11-14 (4 levels)', () => {
    const tiles = computeTilesForBbox(minLat, maxLat, minLng, maxLng);
    const zooms = new Set(tiles.map(t => t.z));
    expect(zooms.has(11)).toBe(true);
    expect(zooms.has(12)).toBe(true);
    expect(zooms.has(13)).toBe(true);
    expect(zooms.has(14)).toBe(true);
    // No zoom outside range
    expect(zooms.has(10)).toBe(false);
    expect(zooms.has(15)).toBe(false);
  });

  test('each tile has z, y, x, url properties', () => {
    const tiles = computeTilesForBbox(minLat, maxLat, minLng, maxLng);
    for (const tile of tiles) {
      expect(typeof tile.z).toBe('number');
      expect(typeof tile.y).toBe('number');
      expect(typeof tile.x).toBe('number');
      expect(typeof tile.url).toBe('string');
    }
  });

  test('tile url matches ignTileUrl(z, y, x)', () => {
    const tiles = computeTilesForBbox(minLat, maxLat, minLng, maxLng);
    for (const tile of tiles) {
      expect(tile.url).toBe(ignTileUrl(tile.z, tile.y, tile.x));
    }
  });

  test('larger bbox → more tiles', () => {
    const small = computeTilesForBbox(42.84, 42.85, -0.45, -0.44);
    const large = computeTilesForBbox(42.0, 43.5, -1.5, 0.5);
    expect(large.length).toBeGreaterThan(small.length);
  });

  test('no duplicate tiles (unique z/y/x combinations)', () => {
    const tiles = computeTilesForBbox(minLat, maxLat, minLng, maxLng);
    const keys = tiles.map(t => `${t.z}/${t.y}/${t.x}`);
    const unique = new Set(keys);
    expect(unique.size).toBe(tiles.length);
  });

  test('z=14 (highest detail) has more tiles than z=11', () => {
    const tiles = computeTilesForBbox(minLat, maxLat, minLng, maxLng);
    const z11 = tiles.filter(t => t.z === 11);
    const z14 = tiles.filter(t => t.z === 14);
    expect(z14.length).toBeGreaterThanOrEqual(z11.length);
  });

  test('all tile x/y/z are non-negative integers', () => {
    const tiles = computeTilesForBbox(minLat, maxLat, minLng, maxLng);
    for (const tile of tiles) {
      expect(tile.z).toBeGreaterThanOrEqual(0);
      expect(tile.x).toBeGreaterThanOrEqual(0);
      expect(tile.y).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(tile.z)).toBe(true);
      expect(Number.isInteger(tile.x)).toBe(true);
      expect(Number.isInteger(tile.y)).toBe(true);
    }
  });

  test('buffer extends coverage: point-bbox returns tiles', () => {
    // A single-point bbox (min==max) should still return tiles because of the 0.06° buffer
    const tiles = computeTilesForBbox(43.0, 43.0, -1.0, -1.0);
    expect(tiles.length).toBeGreaterThan(0);
  });

  test('total tile count is reasonable for a small area', () => {
    const tiles = computeTilesForBbox(minLat, maxLat, minLng, maxLng);
    // Should be in hundreds, not millions
    expect(tiles.length).toBeGreaterThan(4); // at least 1 per zoom level
    expect(tiles.length).toBeLessThan(10_000);
  });

  test('GR10 Pays Basque area produces non-empty tile list', () => {
    // Biriatou → Ainhoa region
    const tiles = computeTilesForBbox(43.25, 43.40, -1.80, -1.50);
    expect(tiles.length).toBeGreaterThan(0);
  });

  test('Pyrenees Ossau area produces non-empty tile list', () => {
    const tiles = computeTilesForBbox(42.80, 42.90, -0.50, -0.35);
    expect(tiles.length).toBeGreaterThan(0);
  });
});

// ─── latLngToTile (indirectly via computeTilesForBbox) ────────────────────────

describe('tile coordinate correctness', () => {
  test('known tile: Paris z=12 → x=2074, y=1409', () => {
    // Paris ~48.85°N, 2.35°E → x=2074, y=1409 at z=12 (Web Mercator)
    // With 0.06° buffer the bbox is slightly enlarged, but must still contain the Paris tile.
    const tiles = computeTilesForBbox(48.84, 48.86, 2.34, 2.36);
    const z12 = tiles.filter(t => t.z === 12);
    const xs = z12.map(t => t.x);
    const ys = z12.map(t => t.y);
    expect(Math.min(...xs)).toBeLessThanOrEqual(2074);
    expect(Math.max(...xs)).toBeGreaterThanOrEqual(2074);
    expect(Math.min(...ys)).toBeLessThanOrEqual(1409);
    expect(Math.max(...ys)).toBeGreaterThanOrEqual(1409);
  });

  test('higher zoom → tile numbers are ~double lower zoom (approx)', () => {
    const tiles11 = computeTilesForBbox(43.0, 43.0, -1.0, -1.0).filter(t => t.z === 11);
    const tiles12 = computeTilesForBbox(43.0, 43.0, -1.0, -1.0).filter(t => t.z === 12);
    // At z+1, tile indices roughly double
    if (tiles11.length > 0 && tiles12.length > 0) {
      const xRatio = tiles12[0].x / tiles11[0].x;
      expect(xRatio).toBeGreaterThan(1.5);
      expect(xRatio).toBeLessThan(2.5);
    }
  });
});
