export interface GpxTrack {
  name: string;
  points: Array<[number, number]>; // [lat, lng]
}

export function parseGpx(content: string): GpxTrack | null {
  try {
    const nameMatch = content.match(/<name>([^<]+)<\/name>/);
    const name = nameMatch ? nameMatch[1].trim() : 'Trace importée';

    const points: Array<[number, number]> = [];
    const trkptRegex = /<trkpt\b([^>]*)>/g;
    let match: RegExpExecArray | null;
    while ((match = trkptRegex.exec(content)) !== null) {
      const attrs = match[1];
      const latMatch = attrs.match(/lat="([^"]+)"/);
      const lonMatch = attrs.match(/lon="([^"]+)"/);
      if (latMatch && lonMatch) {
        const lat = parseFloat(latMatch[1]);
        const lng = parseFloat(lonMatch[1]);
        if (!isNaN(lat) && !isNaN(lng)) {
          points.push([lat, lng]);
        }
      }
    }

    if (points.length === 0) return null;
    return { name, points };
  } catch {
    return null;
  }
}
