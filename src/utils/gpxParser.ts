export interface GpxPoint {
  latitude: number;
  longitude: number;
}

export function parseGpx(content: string): GpxPoint[] {
  const points: GpxPoint[] = [];
  // Matches trkpt, rtept, wpt — the three possible point types in GPX
  const regex = /<(?:trkpt|rtept|wpt)\b([^>]*)>/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const attrs = match[1];
    const latMatch = /lat="([^"]+)"/.exec(attrs);
    const lonMatch = /lon="([^"]+)"/.exec(attrs);
    if (latMatch && lonMatch) {
      const latitude = parseFloat(latMatch[1]);
      const longitude = parseFloat(lonMatch[1]);
      if (!isNaN(latitude) && !isNaN(longitude)) {
        points.push({ latitude, longitude });
      }
    }
  }
  return points;
}
