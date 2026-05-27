export type GpxBadge = 'eau' | 'bivouac' | 'refuge' | 'parking' | 'sommet';

export interface GpxWaypoint {
  name: string;
  lat: number;
  lng: number;
  ele?: number;
  desc?: string;
  distCumKm: number;
  distSegKm: number;
  dpCumM: number;
  dmCumM: number;
  dpSegM: number;
  dmSegM: number;
  segTimeH: number;
  cumTimeH: number;
  badges: GpxBadge[];
}

export interface GpxTrack {
  name: string;
  points: Array<[number, number]>; // [lat, lng]
  waypoints: GpxWaypoint[];
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function naismithH(distKm: number, gainM: number, lossM: number): number {
  return distKm / 4 + gainM / 300 + lossM / 500;
}

function detectBadges(name: string, desc?: string): GpxBadge[] {
  const t = (name + ' ' + (desc ?? '')).toLowerCase();
  const out: GpxBadge[] = [];
  if (/lac|rivière|riviere|source|pont|ruisseau|fontaine/.test(t)) out.push('eau');
  if (/bivouac|camping|camp\b|tente/.test(t)) out.push('bivouac');
  if (/refuge|gîte|gite|cabane/.test(t)) out.push('refuge');
  if (/parking|voiture|trailhead/.test(t)) out.push('parking');
  if (/\bcol\b|sommet|pic\b|crête|crete|pico/.test(t)) out.push('sommet');
  return out;
}

export function parseGpx(content: string): GpxTrack | null {
  try {
    const nameMatch = content.match(/<name>([^<]+)<\/name>/);
    const name = nameMatch ? nameMatch[1].trim() : 'Trace importée';

    // Track points [lat, lng]
    const points: Array<[number, number]> = [];
    const trkptRe = /<trkpt\b([^>]*)>/g;
    let m: RegExpExecArray | null;
    while ((m = trkptRe.exec(content)) !== null) {
      const latM = m[1].match(/lat="([^"]+)"/);
      const lonM = m[1].match(/lon="([^"]+)"/);
      if (latM && lonM) {
        const lat = parseFloat(latM[1]);
        const lng = parseFloat(lonM[1]);
        if (!isNaN(lat) && !isNaN(lng)) points.push([lat, lng]);
      }
    }

    // Named waypoints: <wpt> (global POIs) and <rtept> (route points), in document order
    const raw: Array<{ name: string; lat: number; lng: number; ele?: number; desc?: string }> = [];
    const wptRe = /<(?:wpt|rtept)\b([^>]*)>([\s\S]*?)<\/(?:wpt|rtept)>/g;
    while ((m = wptRe.exec(content)) !== null) {
      const latM = m[1].match(/lat="([^"]+)"/);
      const lonM = m[1].match(/lon="([^"]+)"/);
      if (!latM || !lonM) continue;
      const lat = parseFloat(latM[1]);
      const lng = parseFloat(lonM[1]);
      if (isNaN(lat) || isNaN(lng)) continue;
      const body = m[2];
      const wName = body.match(/<name>([^<]+)<\/name>/);
      const wEle = body.match(/<ele>([^<]+)<\/ele>/);
      const wDesc = body.match(/<desc>([^<]+)<\/desc>/);
      raw.push({
        name: wName ? wName[1].trim() : `Point ${raw.length + 1}`,
        lat,
        lng,
        ele: wEle ? parseFloat(wEle[1]) : undefined,
        desc: wDesc ? wDesc[1].trim() : undefined,
      });
    }

    // Compute cumulative segment data
    const waypoints: GpxWaypoint[] = [];
    for (let i = 0; i < raw.length; i++) {
      const wpt = raw[i];
      if (i === 0) {
        waypoints.push({
          ...wpt,
          distCumKm: 0,
          distSegKm: 0,
          dpCumM: 0,
          dmCumM: 0,
          dpSegM: 0,
          dmSegM: 0,
          segTimeH: 0,
          cumTimeH: 0,
          badges: detectBadges(wpt.name, wpt.desc),
        });
        continue;
      }
      const prev = waypoints[i - 1];
      const distSegKm = haversineKm(prev.lat, prev.lng, wpt.lat, wpt.lng);
      const eleDiff =
        wpt.ele != null && prev.ele != null ? wpt.ele - prev.ele : 0;
      const dpSegM = Math.max(0, eleDiff);
      const dmSegM = Math.max(0, -eleDiff);
      const segTimeH = naismithH(distSegKm, dpSegM, dmSegM);
      waypoints.push({
        ...wpt,
        distCumKm: prev.distCumKm + distSegKm,
        distSegKm,
        dpCumM: prev.dpCumM + dpSegM,
        dmCumM: prev.dmCumM + dmSegM,
        dpSegM,
        dmSegM,
        segTimeH,
        cumTimeH: prev.cumTimeH + segTimeH,
        badges: detectBadges(wpt.name, wpt.desc),
      });
    }

    if (points.length === 0 && waypoints.length === 0) return null;
    return { name, points, waypoints };
  } catch {
    return null;
  }
}
