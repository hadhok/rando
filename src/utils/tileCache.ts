export const IGN_TILE_CACHE = 'gr10-ign-tiles-v1';
const MIN_ZOOM = 11;
const MAX_ZOOM = 14;
const BUFFER_DEG = 0.06; // ~6 km buffer around bbox

function latLngToTile(lat: number, lng: number, z: number) {
  const x = Math.floor(((lng + 180) / 360) * Math.pow(2, z));
  const y = Math.floor(
    ((1 - Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) / 2) *
      Math.pow(2, z)
  );
  return { x, y };
}

export function ignTileUrl(z: number, y: number, x: number) {
  return (
    `https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0` +
    `&LAYER=GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2&STYLE=normal&FORMAT=image/png` +
    `&TILEMATRIXSET=PM&TILEMATRIX=${z}&TILEROW=${y}&TILECOL=${x}`
  );
}

interface TileRef { z: number; y: number; x: number; url: string }

export function computeTilesForBbox(
  minLat: number, maxLat: number, minLng: number, maxLng: number
): TileRef[] {
  const tiles: TileRef[] = [];
  const lat1 = minLat - BUFFER_DEG;
  const lat2 = maxLat + BUFFER_DEG;
  const lng1 = minLng - BUFFER_DEG;
  const lng2 = maxLng + BUFFER_DEG;

  for (let z = MIN_ZOOM; z <= MAX_ZOOM; z++) {
    const tl = latLngToTile(lat2, lng1, z);
    const br = latLngToTile(lat1, lng2, z);
    for (let x = tl.x; x <= br.x; x++) {
      for (let y = tl.y; y <= br.y; y++) {
        tiles.push({ z, y, x, url: ignTileUrl(z, y, x) });
      }
    }
  }
  return tiles;
}

export async function downloadTiles(
  tiles: TileRef[],
  onProgress: (done: number, total: number) => void,
  signal?: AbortSignal
): Promise<void> {
  const cache = await caches.open(IGN_TILE_CACHE);
  let done = 0;
  const total = tiles.length;

  // 8 concurrent requests to avoid hammering the server
  const concurrency = 8;
  let idx = 0;

  async function worker() {
    while (idx < tiles.length) {
      if (signal?.aborted) return;
      const tile = tiles[idx++];
      try {
        const existing = await cache.match(tile.url);
        if (!existing) {
          const res = await fetch(tile.url, { signal });
          if (res.ok) await cache.put(tile.url, res);
        }
      } catch {}
      done++;
      onProgress(done, total);
    }
  }

  await Promise.all(Array.from({ length: concurrency }, worker));
}

export async function getTileCacheInfo(): Promise<{ count: number }> {
  try {
    const cache = await caches.open(IGN_TILE_CACHE);
    const keys = await cache.keys();
    return { count: keys.length };
  } catch {
    return { count: 0 };
  }
}

export async function clearTileCache() {
  await caches.delete(IGN_TILE_CACHE);
}
