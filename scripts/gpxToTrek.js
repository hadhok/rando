#!/usr/bin/env node
/**
 * gpxToTrek.js — génère automatiquement le code d'un trek depuis un fichier GPX
 *
 * Usage:
 *   node scripts/gpxToTrek.js montrек.gpx [--id=mon-trek] [--days=2]
 *
 * Produit:
 *   - L'objet Trek à coller dans src/data/treks.ts
 *   - Le mapping météo pour TerrainScreen.tsx
 *   - Les coordonnées GPS du centre (pour la zone météo)
 */

const fs   = require('fs');
const path = require('path');

// ── CLI args ─────────────────────────────────────────────────────────────────

const args    = process.argv.slice(2);
const gpxFile = args.find(a => !a.startsWith('--'));
const idArg   = (args.find(a => a.startsWith('--id=')) ?? '').replace('--id=', '');
const daysArg = parseInt((args.find(a => a.startsWith('--days=')) ?? '').replace('--days=', '') || '0', 10);

if (!gpxFile) {
  console.error('Usage: node scripts/gpxToTrek.js <fichier.gpx> [--id=slug] [--days=N]');
  process.exit(1);
}

const content = fs.readFileSync(path.resolve(gpxFile), 'utf8');

// ── GPX parsing ───────────────────────────────────────────────────────────────

function haversineKm(lat1, lon1, lat2, lon2) {
  const R    = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a    = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function naismithH(distKm, gainM, lossM) {
  return distKm / 4 + gainM / 300 + lossM / 500;
}

function detectBadges(name, desc = '') {
  const t   = (name + ' ' + desc).toLowerCase();
  const out = [];
  if (/lac|rivière|riviere|source|pont|ruisseau|fontaine/.test(t)) out.push('water');
  if (/bivouac|camping|camp\b|tente/.test(t))                       out.push('biv');
  if (/refuge|gîte|gite|cabane/.test(t))                           out.push('refuge');
  if (/village|bourg|hameau/.test(t))                              out.push('village');
  return out;
}

function detectRowType(name, badges) {
  if (badges.includes('biv'))     return 'biv';
  if (badges.includes('village')) return 'highlight';
  if (badges.includes('refuge'))  return 'highlight';
  return undefined;
}

// Parse track points (for elevation profile + bbox)
const trackPts = [];
const trkptRe  = /<trkpt\b([^>]*)>[\s\S]*?<\/trkpt>/g;
let m;
while ((m = trkptRe.exec(content)) !== null) {
  const latM = m[1].match(/lat="([^"]+)"/);
  const lonM = m[1].match(/lon="([^"]+)"/);
  const eleM = m[0].match(/<ele>([^<]+)<\/ele>/);
  if (latM && lonM) trackPts.push({
    lat: parseFloat(latM[1]),
    lon: parseFloat(lonM[1]),
    ele: eleM ? parseFloat(eleM[1]) : undefined,
  });
}

// Parse waypoints (named POIs → stages)
const rawWpts = [];
const wptRe   = /<(?:wpt|rtept)\b([^>]*)>([\s\S]*?)<\/(?:wpt|rtept)>/g;
while ((m = wptRe.exec(content)) !== null) {
  const latM  = m[1].match(/lat="([^"]+)"/);
  const lonM  = m[1].match(/lon="([^"]+)"/);
  if (!latM || !lonM) continue;
  const body  = m[2];
  const nameM = body.match(/<name>([^<]+)<\/name>/);
  const eleM  = body.match(/<ele>([^<]+)<\/ele>/);
  const descM = body.match(/<desc>([^<]+)<\/desc>/);
  rawWpts.push({
    name: nameM ? nameM[1].trim() : `Point ${rawWpts.length + 1}`,
    lat:  parseFloat(latM[1]),
    lon:  parseFloat(lonM[1]),
    ele:  eleM ? parseFloat(eleM[1]) : undefined,
    desc: descM ? descM[1].trim() : undefined,
  });
}

// Compute cumulative stats on waypoints (iterative to avoid self-reference)
const waypoints = [];
for (let i = 0; i < rawWpts.length; i++) {
  const wpt = rawWpts[i];
  if (i === 0) {
    waypoints.push({ ...wpt, distCumKm: 0, dpCumM: 0, dmCumM: 0, cumTimeH: 0 });
    continue;
  }
  const prev     = rawWpts[i - 1];
  const prevCalc = waypoints[i - 1];
  const distSeg  = haversineKm(prev.lat, prev.lon, wpt.lat, wpt.lon);
  const eleDiff  = (wpt.ele != null && prev.ele != null) ? wpt.ele - prev.ele : 0;
  const dpSeg    = Math.max(0, eleDiff);
  const dmSeg    = Math.max(0, -eleDiff);
  const segTime  = naismithH(distSeg, dpSeg, dmSeg);
  waypoints.push({
    ...wpt,
    distCumKm: prevCalc.distCumKm + distSeg,
    dpCumM:    prevCalc.dpCumM + dpSeg,
    dmCumM:    prevCalc.dmCumM + dmSeg,
    cumTimeH:  prevCalc.cumTimeH + segTime,
  });
}

// GPX name
const nameMatch = content.match(/<name>([^<]+)<\/name>/);
const gpxName   = nameMatch ? nameMatch[1].trim() : path.basename(gpxFile, '.gpx');

// ── Stats ────────────────────────────────────────────────────────────────────

const totalDist = waypoints.length > 0
  ? waypoints[waypoints.length - 1].distCumKm
  : trackPts.reduce((acc, pt, i) => {
      if (i === 0) return 0;
      return acc + haversineKm(trackPts[i-1].lat, trackPts[i-1].lon, pt.lat, pt.lon);
    }, 0);

const totalDp = waypoints.length > 0
  ? waypoints[waypoints.length - 1].dpCumM
  : trackPts.reduce((acc, pt, i) => {
      if (i === 0 || pt.ele == null || trackPts[i-1].ele == null) return acc;
      return acc + Math.max(0, pt.ele - trackPts[i-1].ele);
    }, 0);

const maxAlt = Math.max(
  ...trackPts.filter(p => p.ele != null).map(p => p.ele),
  ...waypoints.filter(w => w.ele != null).map(w => w.ele),
);

// Center GPS (for weather zone)
const allLats = [...trackPts.map(p => p.lat), ...waypoints.map(w => w.lat)];
const allLons = [...trackPts.map(p => p.lon), ...waypoints.map(w => w.lon)];
const centerLat = ((Math.min(...allLats) + Math.max(...allLats)) / 2).toFixed(4);
const centerLon = ((Math.min(...allLons) + Math.max(...allLons)) / 2).toFixed(4);

// ── Split waypoints into days ─────────────────────────────────────────────────

function splitIntoDays(wpts, numDays) {
  if (numDays <= 1 || wpts.length === 0) return [wpts];

  // Try to detect "Jour N" or "J N" markers in waypoint names
  const dayMarkers = wpts
    .map((w, i) => ({ i, name: w.name }))
    .filter(({ name }) => /^(jour|j\.?\s*)\d+/i.test(name.trim()));

  if (dayMarkers.length >= numDays - 1) {
    // Split at detected markers
    const splits = [0, ...dayMarkers.map(m => m.i), wpts.length];
    const days   = [];
    for (let d = 0; d < splits.length - 1; d++) {
      const slice = wpts.slice(splits[d], splits[d + 1]);
      if (slice.length > 0) days.push(slice);
    }
    return days;
  }

  // Fallback: split evenly by distance
  const totalD  = wpts[wpts.length - 1].distCumKm;
  const stepD   = totalD / numDays;
  const days    = [];
  let   dayWpts = [];

  for (const wpt of wpts) {
    dayWpts.push(wpt);
    const expectedDayEnd = (days.length + 1) * stepD;
    if (wpt.distCumKm >= expectedDayEnd - stepD * 0.1 && days.length < numDays - 1 && dayWpts.length > 1) {
      days.push(dayWpts);
      dayWpts = [];
    }
  }
  if (dayWpts.length > 0) days.push(dayWpts);
  return days;
}

const numDays   = daysArg > 0 ? daysArg : Math.max(1, Math.round(totalDist / 15));
const dayGroups = waypoints.length > 0
  ? splitIntoDays(waypoints, numDays)
  : [[]];

// ── Format helpers ────────────────────────────────────────────────────────────

function fmtDist(km) {
  return km < 0.5 ? '0km' : `${Math.round(km)}km`;
}
function fmtAlt(m) {
  return m != null && !isNaN(m) ? `${Math.round(m)}m` : '—';
}
function fmtDp(m) {
  if (!m || m < 1) return '—';
  return `+${Math.round(m)}m`;
}
function fmtTime(h, startH = 9) {
  const total   = startH + h;
  const hours   = Math.floor(total);
  const minutes = Math.round((total - hours) * 60);
  return `${String(hours).padStart(2, '0')}h${String(minutes).padStart(2, '0')}`;
}

// ── Build trek days ───────────────────────────────────────────────────────────

function buildTrekDay(wpts, dayIdx, prevDayEndDist = 0, prevDayEndDp = 0, prevDayEndTime = 0) {
  const START_H = 9;
  const stages  = wpts.map(wpt => {
    const relDist = Math.max(0, wpt.distCumKm - prevDayEndDist);
    const relDp   = Math.max(0, wpt.dpCumM - prevDayEndDp);
    const badges  = detectBadges(wpt.name, wpt.desc);
    const rowType = detectRowType(wpt.name, badges);
    const stage   = {
      name: wpt.name,
      dist: `${relDist.toFixed(1)}km`,
      alt:  fmtAlt(wpt.ele),
      dp:   fmtDp(relDp),
      time: fmtTime(Math.max(0, wpt.cumTimeH - prevDayEndTime), START_H),
    };
    if (badges.length > 0) stage.badges = badges;
    if (rowType)            stage.rowType = rowType;
    return stage;
  });

  const lastName  = wpts.length > 0 ? wpts[wpts.length - 1].name : '?';
  const firstName = wpts.length > 0 ? wpts[0].name : '?';
  return {
    title: `Jour ${dayIdx + 1} · ${firstName} → ${lastName} · Départ 09h00`,
    stages,
  };
}

const trekDays = dayGroups.map((wpts, i) => {
  const prevEnd     = i > 0 ? dayGroups[i - 1][dayGroups[i - 1].length - 1] : null;
  const prevDist    = prevEnd ? prevEnd.distCumKm    : 0;
  const prevDp      = prevEnd ? prevEnd.dpCumM       : 0;
  const prevTime    = prevEnd ? prevEnd.cumTimeH     : 0;
  return buildTrekDay(wpts, i, prevDist, prevDp, prevTime);
});

// ── SVG elevation path ────────────────────────────────────────────────────────

function buildElevPath(points, numPts = 18, svgW = 400, svgH = 60, baseline = 60) {
  if (points.length === 0) {
    return `M0,${baseline - 5} L${svgW},${baseline - 5} L${svgW},${baseline} L0,${baseline} Z`;
  }

  // Sample N points evenly
  const step    = Math.max(1, Math.floor(points.length / numPts));
  const sampled = [];
  for (let i = 0; i < points.length; i += step) sampled.push(points[i]);
  if (sampled[sampled.length - 1] !== points[points.length - 1])
    sampled.push(points[points.length - 1]);

  const eles  = sampled.map(p => p.ele).filter(e => e != null);
  const elMin = Math.min(...eles);
  const elMax = Math.max(...eles);
  const range = elMax - elMin || 1;

  // Map elevation → SVG y (inverted: higher ele = lower y number)
  const topMargin = 6;
  const mapY = (ele) => {
    if (ele == null) return baseline - 10;
    const norm = (ele - elMin) / range;          // 0..1
    return Math.round(baseline - topMargin - norm * (baseline - topMargin - 2));
  };

  const pts = sampled.map((p, i) => {
    const x = Math.round((i / (sampled.length - 1)) * svgW);
    const y = mapY(p.ele);
    return `${x},${y}`;
  });

  return `M${pts.join(' L')} L${svgW},${baseline} L0,${baseline} Z`;
}

// Use track points for smooth elevation profile, waypoints as fallback
const elevSource     = trackPts.filter(p => p.ele != null).length > 10 ? trackPts : waypoints;
const cardElevPath   = buildElevPath(elevSource, 16);
const detailElevPath = buildElevPath(elevSource, 22);

// ── Generate ID and metadata ──────────────────────────────────────────────────

function slugify(str) {
  return str
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // remove accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

const trekId     = idArg || slugify(gpxName).slice(0, 30);
const distStr    = totalDist >= 10 ? `${Math.round(totalDist)}km` : `${totalDist.toFixed(1)}km`;
const dpStr      = totalDp >= 1000 ? `+${(totalDp / 1000).toFixed(1)}k` : `+${Math.round(totalDp)}m`;
const maxAltStr  = maxAlt > 0 && isFinite(maxAlt) ? `${Math.round(maxAlt)}m` : '?m';

// Detect region from coordinates
function guessRegion(lat, lon) {
  if (lon < -1.0 && lat > 43.0) return 'Pays B.';
  if (lon < 0.0)                 return 'Ossau';
  if (lon < 1.5)                 return 'Luchon';
  if (lon < 2.5)                 return 'Ariège';
  return 'Pyrénées';
}
const region = guessRegion(parseFloat(centerLat), parseFloat(centerLon));

// Random-ish but deterministic color based on trek name
const COLORS = ['#2d6a3a', '#2a5a8a', '#c8502a', '#7c3aed', '#b45309', '#0f766e', '#be123c'];
const color  = COLORS[trekId.length % COLORS.length];

// ── Notes placeholder ────────────────────────────────────────────────────────

const notes = [
  `{ icon: '🅿️', label: 'Parking départ', sub: 'TODO: préciser le parking' }`,
];
if (totalDist > 10) {
  notes.push(`{ icon: '🚌', label: 'Retour au départ', sub: 'TODO: préciser le retour' }`);
}

// ── Output ────────────────────────────────────────────────────────────────────

function indent(str, n = 2) {
  return str.split('\n').map(l => ' '.repeat(n) + l).join('\n');
}

function stageToCode(stage) {
  const fields = [
    `name: '${stage.name.replace(/'/g, "\\'")}' `,
    `dist: '${stage.dist}'`,
    `alt: '${stage.alt}'`,
    `dp: '${stage.dp}'`,
    `time: '${stage.time}'`,
  ];
  if (stage.badges?.length)  fields.push(`badges: [${stage.badges.map(b => `'${b}'`).join(', ')}]`);
  if (stage.rowType)         fields.push(`rowType: '${stage.rowType}'`);
  return `{ ${fields.join(', ')} }`;
}

function dayToCode(day) {
  const stagesCode = day.stages.map(stageToCode).join(',\n          ');
  return `{
        title: '${day.title}',
        stages: [
          ${stagesCode},
        ],
      }`;
}

const trekCode = `  {
    id: '${trekId}',
    name: '${gpxName.replace(/'/g, "\\'")}',
    days: ${dayGroups.length},
    distance: '${distStr}',
    dp: '${dpStr}',
    region: '${region}',
    maxAlt: '${maxAltStr}',
    difficulty: 2, // TODO: ajuster (1=facile, 2=moyen, 3=difficile)
    color: '${color}',
    cardElevPath:
      '${cardElevPath}',
    detailElevPath:
      '${detailElevPath}',
    trekDays: [
      ${dayGroups.map((_, i) => dayToCode(trekDays[i])).join(',\n      ')},
    ],
    notes: [
      ${notes.join(',\n      ')},
    ],
  },`;

// ── Print results ─────────────────────────────────────────────────────────────

console.log('\n' + '═'.repeat(70));
console.log('  GPX → Trek — résultats');
console.log('═'.repeat(70));
console.log(`\n  Trek ID   : ${trekId}`);
console.log(`  Distance  : ${distStr}`);
console.log(`  D+        : ${dpStr}`);
console.log(`  Alt max   : ${maxAltStr}`);
console.log(`  Jours     : ${dayGroups.length} (${waypoints.length} waypoints au total)`);
console.log(`  Centre    : ${centerLat}°N, ${centerLon}°E`);
console.log(`  Région    : ${region}`);

if (waypoints.length === 0) {
  console.log('\n  ⚠️  Aucun waypoint (<wpt> ou <rtept>) trouvé dans le GPX.');
  console.log('     Les stages seront vides — ajoutez des waypoints nommés dans votre GPX.');
}

console.log('\n' + '─'.repeat(70));
console.log('  1. Ajouter dans src/data/treks.ts (avant la fermeture du tableau]\n');
console.log(trekCode);

console.log('\n' + '─'.repeat(70));
console.log('  2. Ajouter dans TerrainScreen.tsx — ZONE_BY_TREK\n');
console.log(`  '${trekId}': { lat: ${centerLat}, lng: ${centerLon}, label: '${gpxName.replace(/'/g, "\\'")}', sub: '${region} · TODO: préciser l\\'altitude' },`);

console.log('\n' + '─'.repeat(70));
console.log('  3. Ajouter dans TerrainScreen.tsx — TREK_TO_WEATHER_ZONE\n');
console.log(`  '${trekId}': '${trekId}',`);

console.log('\n' + '─'.repeat(70));
console.log('  4. Ajouter dans TerrainScreen.tsx — ALL_ZONES\n');
console.log(`  { id: '${trekId}', ...ZONE_BY_TREK['${trekId}'] },`);

console.log('\n' + '─'.repeat(70));
console.log('  5. Retour (RetourScreen.tsx) — ajouter une carte si besoin\n');
console.log(`  '${trekId}': 'TODO: id-de-la-carte-retour',  // dans TREK_TO_CARD`);
console.log('\n' + '═'.repeat(70) + '\n');
