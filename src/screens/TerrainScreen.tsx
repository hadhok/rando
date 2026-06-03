import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, RefreshControl, Platform, Linking,
} from 'react-native';
import { C, FF, notebookBg } from '../theme';
import { useGpx } from '../context/GpxContext';
import { TREKS } from '../data/treks';

// ─── Weather ──────────────────────────────────────────────────────────────────

const WMO_LABEL: Record<number, string> = {
  0: 'Ciel dégagé', 1: 'Peu nuageux', 2: 'Partiellement nuageux', 3: 'Couvert',
  45: 'Brouillard', 51: 'Bruine légère', 53: 'Bruine', 55: 'Bruine forte',
  61: 'Pluie légère', 63: 'Pluie', 65: 'Pluie forte',
  71: 'Neige légère', 73: 'Neige', 75: 'Neige forte',
  80: 'Averses', 81: 'Averses', 82: 'Averses fortes',
  95: 'Orage', 96: 'Orage + grêle', 99: 'Orage violent',
};
const WMO_EMOJI: Record<number, string> = {
  0: '☀️', 1: '🌤', 2: '⛅', 3: '☁️',
  45: '🌫', 51: '🌦', 53: '🌦', 55: '🌧',
  61: '🌧', 63: '🌧', 65: '🌧',
  71: '🌨', 73: '❄️', 75: '❄️',
  80: '🌦', 81: '🌧', 82: '⛈',
  95: '⛈', 96: '⛈', 99: '⛈',
};
const DAY_LABELS = ['Auj.', 'Dem.', 'J+2'];
const HOURLY_SLOTS = [6, 9, 12, 15, 18];

const ZONE_BY_TREK: Record<string, { lat: number; lng: number; label: string; sub: string }> = {
  gr10:          { lat: 43.37, lng: -1.78, label: 'GR10 — Pays Basque',    sub: 'Zone côtière · 0–600m' },
  ayous:         { lat: 42.84, lng: -0.44, label: 'Pyrénées — Ossau',      sub: 'Altitude 2000m+' },
  artouste:      { lat: 42.84, lng: -0.44, label: 'Pyrénées — Ossau',      sub: 'Altitude 2000m+' },
  'bidarray-sare': { lat: 43.29, lng: -1.44, label: 'Bidarray – Sare',     sub: 'Crêtes Iparla · 110–1044m' },
};
const ALL_ZONES = [
  { id: 'gr10',          ...ZONE_BY_TREK.gr10 },
  { id: 'ossau',         ...ZONE_BY_TREK.ayous },
  { id: 'bidarray-sare', ...ZONE_BY_TREK['bidarray-sare'] },
];

// Maps trek IDs to weather zone IDs (ayous + artouste share the 'ossau' zone)
const TREK_TO_WEATHER_ZONE: Record<string, string> = {
  gr10: 'gr10', ayous: 'ossau', artouste: 'ossau', 'bidarray-sare': 'bidarray-sare',
};

const CACHE_TTL       = 3 * 60 * 60 * 1000;
const CACHE_TTL_H     = 60 * 60 * 1000;

interface DayForecast  { date: string; tMax: number; tMin: number; code: number; precip: number; }
interface HourSlot     { hour: string; code: number; temp: number; wind: number; }
interface ZoneResult   { days: DayForecast[]; ts: number; fromCache: boolean; }
interface ZoneHourly   { today: HourSlot[]; tomorrow: HourSlot[]; ts: number; }

function cacheKey(id: string)  { return `meteo_${id}_v4`; }

function fmtShortDate(iso: string): string {
  return new Date(iso + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
}
function cacheKeyH(id: string) { return `meteo_h_${id}_v2`; }
function ageLabel(ts: number): string {
  const min = Math.round((Date.now() - ts) / 60000);
  if (min < 2) return 'À l\'instant';
  if (min < 60) return `Il y a ${min} min`;
  return `Il y a ${Math.round(min / 60)}h`;
}

function fetchWithTimeout(url: string, ms = 10000): Promise<Response> {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  return fetch(url, { signal: ctrl.signal }).finally(() => clearTimeout(id));
}

async function fetchZone(id: string, lat: number, lng: number): Promise<ZoneResult | null> {
  const key = cacheKey(id);
  const now = Date.now();
  if (Platform.OS === 'web') {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const { ts, data } = JSON.parse(raw);
        if (now - ts < CACHE_TTL) return { days: data, ts, fromCache: true };
      }
    } catch {}
  }
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&forecast_days=7`;
    const res  = await fetchWithTimeout(url);
    if (!res.ok) return null;
    const json = await res.json();
    const d = json.daily;
    if (!d?.time) return null;
    const days: DayForecast[] = d.time.map((date: string, i: number) => ({
      date,
      tMax: Math.round(d.temperature_2m_max?.[i] ?? 0),
      tMin: Math.round(d.temperature_2m_min?.[i] ?? 0),
      code: d.weather_code?.[i] ?? 0,
      precip: d.precipitation_probability_max?.[i] ?? 0,
    }));
    if (Platform.OS === 'web') {
      try { localStorage.setItem(key, JSON.stringify({ ts: now, data: days })); } catch {}
    }
    return { days, ts: now, fromCache: false };
  } catch {
    return null;
  }
}

async function fetchHourly(id: string, lat: number, lng: number): Promise<ZoneHourly | null> {
  const key = cacheKeyH(id);
  const now = Date.now();
  if (Platform.OS === 'web') {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (now - parsed.ts < CACHE_TTL_H) return parsed;
      }
    } catch {}
  }
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&hourly=temperature_2m,weather_code,wind_speed_10m&timezone=auto&forecast_days=2`;
    const res  = await fetchWithTimeout(url);
    if (!res.ok) return null;
    const json = await res.json();
    const h = json.hourly;
    if (!h?.time) return null;
    const todayStr = new Date().toISOString().slice(0, 10);
    const tomStr   = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    const toSlots = (prefix: string): HourSlot[] =>
      HOURLY_SLOTS.map(hr => {
        const idx = h.time.findIndex((t: string) => t === `${prefix}T${String(hr).padStart(2, '0')}:00`);
        if (idx < 0) return { hour: `${hr}h`, code: 0, temp: 0, wind: 0 };
        return {
          hour: `${hr}h`,
          code:  h.weather_code?.[idx] ?? 0,
          temp:  Math.round(h.temperature_2m?.[idx] ?? 0),
          wind:  Math.round(h.wind_speed_10m?.[idx] ?? 0),
        };
      });
    const result: ZoneHourly = { today: toSlots(todayStr), tomorrow: toSlots(tomStr), ts: now };
    if (Platform.OS === 'web') {
      try { localStorage.setItem(key, JSON.stringify(result)); } catch {}
    }
    return result;
  } catch {
    return null;
  }
}

// ─── Terrain data ──────────────────────────────────────────────────────────────

interface TerrainCard {
  id: string; icon: string; title: string; meta?: string; defaultOpen?: boolean;
  rows: { icon: string; label: string; sub?: string; alt?: string; warning?: boolean }[];
}

const CARDS_SOS: TerrainCard = {
  id: 'sos', icon: '🆘', title: 'Urgences', defaultOpen: true,
  rows: [
    { icon: '📞', label: '112', sub: 'Urgences Europe — fonctionne hors réseau' },
    { icon: '⛑', label: 'PGHM Pyrénées Atlantiques', sub: '05 59 37 09 59 · Secours montagne 64' },
    { icon: '📡', label: 'Signal variable en crête', sub: 'Se déplacer vers une crête dégagée pour avoir le réseau' },
  ],
};

const TERRAIN_BY_TREK: Record<string, TerrainCard[]> = {
  gr10: [
    {
      id: 'water', icon: '💧', title: "Points d'eau", meta: 'Biriatou → Ainhoa', defaultOpen: true,
      rows: [
        { icon: '●', label: 'Fontaine de Biriatou', sub: 'Village · Eau potable garantie · km 0', alt: '56m' },
        { icon: '●', label: "Col d'Ibardin", sub: 'Source + ventas · km 7,5', alt: '318m' },
        { icon: '●', label: "Entrée d'Olheta", sub: 'Ruisseau · Filtrer obligatoire · km 13,6', alt: '96m' },
        { icon: '●', label: 'Sare', sub: 'Fontaine village · km 22,7 · Dernier point avant frontière', alt: '80m' },
        { icon: '●', label: 'Pont du Diable', sub: 'Rivière Nive · km 28,3 · Eau abondante', alt: '58m' },
        { icon: '⚠️', label: 'Zone Sare → Pont du Diable', sub: "Aucun point d'eau — faire le plein à Sare", warning: true },
      ],
    },
    {
      id: 'bivouac', icon: '⛺', title: 'Spots bivouac', meta: 'Validés randonneurs',
      rows: [
        { icon: 'J1', label: 'Crête Mandalé', sub: 'Zone ouverte · Vue océan · Terrain herbeux', alt: '380m' },
        { icon: 'J1', label: "Entrée d'Olheta — ruisseau", sub: 'Eau sur place · Terrain plat · Discret', alt: '96m' },
        { icon: 'J2', label: 'Col des Trois-Fontaines', sub: 'Cabane 4 pers · Source faible · Vue mer', alt: '563m' },
        { icon: 'J2', label: 'Frontière Sare / Espagne', sub: 'Zone ouverte · Pottoks · Côté espagnol plus libre', alt: '110m' },
      ],
    },
    {
      id: 'fauna', icon: '🐴', title: 'Faune & flore',
      rows: [
        { icon: '🐴', label: 'Pottoks', sub: 'Chevaux basques sauvages · Ne pas nourrir · Inoffensifs' },
        { icon: '🦔', label: 'Tiques', sub: 'Risque élevé prairies basses · Vérifier le soir · Pince obligatoire' },
        { icon: '🐍', label: 'Vipère aspic', sub: 'Prairies et lisières · Peu agressive · Reculer si rencontrée' },
        { icon: '🦎', label: 'Lézard vert', sub: 'Très présent sur le tracé · Totalement inoffensif' },
      ],
    },
    {
      id: 'regs', icon: '⚖️', title: 'Réglementation',
      rows: [
        { icon: '✓', label: 'Hors Parc National', sub: 'Biriatou → Ainhoa hors zones PNP — réglementation communale' },
        { icon: '✓', label: 'Bivouac', sub: 'Toléré en zone pastorale · Respecter les troupeaux · Partir avant 9h' },
        { icon: '✗', label: 'Feux interdits', sub: 'Arrêté préfectoral permanent Pyrénées-Atlantiques' },
        { icon: '✗', label: 'Déchets', sub: 'Zéro trace obligatoire · Même matière organique' },
        { icon: '⚠️', label: 'Zones frontalières', sub: 'Sentier longe la frontière espagnole — rester sur balisage GR', warning: true },
      ],
    },
    {
      id: 'maps', icon: '🗺', title: 'Cartes & navigation',
      rows: [
        { icon: '📱', label: 'OsmAnd / Komoot', sub: 'GPX GR10_Hendaye_Iraty_v2.gpx · Fonds OSM hors ligne' },
        { icon: '📄', label: '1346OT — Hendaye / La Rhune', sub: 'Carte IGN indispensable · 1:25 000' },
        { icon: '🌐', label: 'Impression cartes', sub: 'geoportail.gouv.fr → Imprimer → A4 · 1:25 000' },
      ],
    },
    CARDS_SOS,
  ],
  ayous: [
    {
      id: 'water', icon: '💧', title: "Points d'eau", meta: "Lacs d'Ayous — Ossau", defaultOpen: true,
      rows: [
        { icon: '●', label: "Gave de Bious-Artigues", sub: "Départ Bious-Oumettes · Abondant · Filtrer conseillé", alt: '1422m' },
        { icon: '●', label: "Lac Roumassot", sub: "Eau de lac · Filtrer obligatoire", alt: '1837m' },
        { icon: '●', label: "Lac d'Ayous (Gentau)", sub: "Source aménagée côté refuge · Qualité variable", alt: '2063m' },
        { icon: '●', label: "Lac Bersau", sub: "Eau de lac froide · Filtrer · Alternative lac Gentau interdit", alt: '2083m' },
        { icon: '⚠️', label: 'Au-dessus de 2400m', sub: "Sources très rares — faire le plein avant de monter", warning: true },
      ],
    },
    {
      id: 'bivouac', icon: '⛺', title: 'Spots bivouac', meta: 'Zone Parc National',
      rows: [
        { icon: 'J1', label: "Plateau d'Arrioutort", sub: 'Terrain ouvert · Attention vents forts en crête', alt: '1950m' },
        { icon: 'J1', label: "Lac Bersau", sub: 'Alternative si lac Gentau interdit · Belle vue Pic du Midi', alt: '2083m' },
        { icon: 'J2', label: "Cabane pastorale de Cézy", sub: '4 personnes · Source à proximité · Non gardée', alt: '1680m' },
        { icon: '⚠️', label: 'Lacs Roumassot & Miey', sub: 'Bivouac interdit — zone pastorale protégée', warning: true },
        { icon: '⚠️', label: 'Lac Gentau (juil–sept)', sub: 'Survisité · Bivouac interdit · Aller au lac Bersau (+30 min)', warning: true },
      ],
    },
    {
      id: 'fauna', icon: '🦫', title: 'Faune & flore',
      rows: [
        { icon: '🦫', label: 'Marmottes', sub: "Très nombreuses autour des lacs d'Ayous · Peu farouches" },
        { icon: '🦌', label: 'Isards', sub: 'Pyrénéens · Visibles sur névés et crêtes · Discrets' },
        { icon: '🦅', label: 'Vautours fauves', sub: 'Groupes >30 individus fréquents · Envergure 2,5m' },
        { icon: '🦅', label: 'Gypaète barbu', sub: 'Rare · Reconnaissable au vol plané · Ne pas déranger' },
        { icon: '🐻', label: 'Ours brun', sub: 'Présence confirmée Béarn · Très rare · Faire du bruit en forêt' },
      ],
    },
    {
      id: 'regs', icon: '⚖️', title: 'Réglementation PNP',
      rows: [
        { icon: '✓', label: 'Parc National des Pyrénées', sub: 'Zone cœur · Bivouac autorisé 19h–9h uniquement' },
        { icon: '✓', label: 'Tarp / tente basse', sub: 'Hauteur max pratique ~1m · Pas de feu ni de chiens' },
        { icon: '✗', label: 'Lacs Roumassot & Miey', sub: "Zone pastorale — bivouac interdit toute l'année" },
        { icon: '✗', label: 'Lac Gentau (juil–sept)', sub: 'Bivouac interdit · Zone survisitée · Aller au lac Bersau' },
        { icon: '✗', label: 'Chiens interdits', sub: 'En zone cœur PNP · Même tenu en laisse' },
      ],
    },
    {
      id: 'maps', icon: '🗺', title: 'Cartes & navigation',
      rows: [
        { icon: '📱', label: 'OsmAnd / Komoot', sub: 'GPX Ayous_Boucle.gpx · Fonds IGN / OSM hors ligne' },
        { icon: '📄', label: '1547OT — Ossau', sub: "Haute-Vallée d'Ossau · Carte IGN 1:25 000 · Indispensable" },
        { icon: '📄', label: 'Editions Rando', sub: 'Carte Pyrénées n°3 — Béarn · Réf. 03' },
      ],
    },
    CARDS_SOS,
  ],
};
TERRAIN_BY_TREK.artouste = TERRAIN_BY_TREK.ayous;

const ALL_TERRAIN_CARDS: TerrainCard[] = [
  ...TERRAIN_BY_TREK.gr10.filter(c => c.id !== 'sos'),
  ...TERRAIN_BY_TREK.ayous.filter(c => c.id !== 'sos'),
  CARDS_SOS,
];

// ─── Premiers secours ─────────────────────────────────────────────────────────

interface PsStep { icon: string; text: string; danger?: boolean; }
interface PsCard  { id: string; icon: string; title: string; urgent?: boolean; steps: PsStep[]; }

const PREMIERS_SECOURS: PsCard[] = [
  {
    id: 'tique', icon: '🦔', title: 'Tique',
    steps: [
      { icon: '1', text: 'Saisir au tire-tique en tournant (sens anti-horaire) — jamais avec les doigts' },
      { icon: '2', text: 'Ne pas écraser, brûler ou mettre de substance sur la tique' },
      { icon: '3', text: 'Désinfecter la zone avec antiseptique' },
      { icon: '⚠️', text: 'Surveiller 3 semaines : rougeur en anneau = consulter médecin' },
    ],
  },
  {
    id: 'vipere', icon: '🐍', title: 'Morsure de vipère', urgent: true,
    steps: [
      { icon: '1', text: 'Rester calme — immobiliser le membre mordu · NE PAS marcher' },
      { icon: '2', text: 'Enlever montres, bracelets, bagues (gonflement prévisible)' },
      { icon: '3', text: 'Appeler le 15 (SAMU) ou le 112' },
      { icon: '✗', text: 'NE PAS inciser, sucer, garrotter ni mettre de glace', danger: true },
    ],
  },
  {
    id: 'ampoule', icon: '🩹', title: 'Ampoule',
    steps: [
      { icon: '1', text: '< 2 cm : ne pas percer — couvrir Compeed ou bande Mölnlycke' },
      { icon: '2', text: '> 2 cm : désinfecter, percer à la base avec aiguille stérile, vider' },
      { icon: '3', text: 'Conserver la peau (protection naturelle) — appliquer Compeed' },
    ],
  },
  {
    id: 'hypothermie', icon: '🥶', title: 'Hypothermie', urgent: true,
    steps: [
      { icon: '⚠️', text: 'Signes : frissons intenses, confusion, maladresse, somnolence' },
      { icon: '1', text: "Abri immédiat hors vent et pluie" },
      { icon: '2', text: "Enlever vêtements mouillés — ajouter couches sèches + sursac" },
      { icon: '3', text: "Boisson chaude sucrée si personne consciente et peut avaler" },
      { icon: '4', text: "Confusion ou inconscience → appeler le 112 immédiatement", danger: true },
    ],
  },
  {
    id: 'entorse', icon: '🦵', title: 'Entorse cheville',
    steps: [
      { icon: 'R', text: 'Repos : arrêt immédiat de la marche' },
      { icon: 'I', text: 'Ice : froid 15 min (chiffon humide froid, jamais directement)' },
      { icon: 'C', text: 'Compression : strapping ou bandage élastique' },
      { icon: 'E', text: 'Élévation : surélevier le pied au repos' },
      { icon: '⚠️', text: 'Douleur intense ou déformation → 112 · Ne pas forcer' },
    ],
  },
  {
    id: 'deshydratation', icon: '💧', title: 'Déshydratation',
    steps: [
      { icon: '⚠️', text: 'Signes : urine foncée, maux de tête, vertiges, fatigue soudaine' },
      { icon: '1', text: "Mettre à l'ombre immédiatement — stopper l'effort" },
      { icon: '2', text: "Boire 500 ml eau + pincée de sel + sucre (électrolytes)" },
      { icon: '3', text: "Attendre 30 min minimum avant de reprendre la marche" },
      { icon: '💡', text: "Prévention : boire 500 ml/h · plus par forte chaleur ou altitude" },
    ],
  },
];

// ─── Numéros utiles ───────────────────────────────────────────────────────────

interface NumItem { icon: string; label: string; sub: string; tel: string; }

const NUMEROS_BY_TREK: Record<string, NumItem[]> = {
  gr10: [
    { icon: '🚌', label: 'TAD Txik-Txak', sub: 'Réservation transport · Lun–Sam 7h–20h', tel: '0547757664' },
    { icon: '📍', label: 'Office Tourisme Sare', sub: 'Infos locales · Lun–Sam 9h–12h / 14h–18h', tel: '0559542014' },
    { icon: '🚕', label: 'Taxi Hendaye', sub: 'Hendaye – Biriatou · Sur réservation', tel: '0559200817' },
    { icon: '🚓', label: 'Gendarmerie Hendaye', sub: 'Non-urgence', tel: '0559200817' },
  ],
  ayous: [
    { icon: '🚡', label: 'Artouste / Télécabine', sub: 'Horaires, billets et infos', tel: '0559053699' },
    { icon: '🏠', label: 'Maison du PNP Laruns', sub: 'Parc National Pyrénées · Info terrain', tel: '0559054159' },
    { icon: '🚓', label: 'Gendarmerie Laruns', sub: 'Non-urgence', tel: '0559053117' },
    { icon: '🚕', label: 'Taxi Ossau', sub: 'Laruns et alentours · Sur réservation', tel: '0559053117' },
  ],
};
NUMEROS_BY_TREK.artouste = NUMEROS_BY_TREK.ayous;

// ─── Component ────────────────────────────────────────────────────────────────

export default function TerrainScreen() {
  const { activeTrekId, trekDates, isInitializing } = useGpx();
  const activeTrek = activeTrekId ? TREKS.find(t => t.id === activeTrekId) : null;

  const terrainCards = activeTrekId
    ? (TERRAIN_BY_TREK[activeTrekId] ?? ALL_TERRAIN_CARDS)
    : ALL_TERRAIN_CARDS;

  const [expanded, setExpanded] = useState<Record<string, boolean>>(
    Object.fromEntries(terrainCards.filter(c => c.defaultOpen).map(c => [c.id, true]))
  );
  const [psExpanded, setPsExpanded] = useState<Record<string, boolean>>({});
  const [weather, setWeather]       = useState<Record<string, ZoneResult | null>>({});
  const [hourly, setHourly]         = useState<Record<string, ZoneHourly | null>>({});
  const [showHourly, setShowHourly] = useState<Record<string, boolean>>({});
  const [refreshing, setRefreshing] = useState(false);

  const loadWeather = useCallback(async (force = false) => {
    if (force && Platform.OS === 'web') {
      ALL_ZONES.forEach(z => {
        try { localStorage.removeItem(cacheKey(z.id)); } catch {}
        try { localStorage.removeItem(cacheKeyH(z.id)); } catch {}
      });
    }
    const results = await Promise.all(
      ALL_ZONES.map(z => fetchZone(z.id, z.lat, z.lng))
    );
    const map: Record<string, ZoneResult | null> = {};
    ALL_ZONES.forEach((z, i) => { map[z.id] = results[i]; });
    setWeather(map);
  }, []);

  useEffect(() => { loadWeather(); }, [loadWeather]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadWeather(true).finally(() => setRefreshing(false));
  }, [loadWeather]);

  const toggleHourly = useCallback(async (zoneId: string, lat: number, lng: number) => {
    const next = !showHourly[zoneId];
    setShowHourly(prev => ({ ...prev, [zoneId]: next }));
    if (next && !hourly[zoneId]) {
      const h = await fetchHourly(zoneId, lat, lng);
      setHourly(prev => ({ ...prev, [zoneId]: h }));
    }
  }, [showHourly, hourly]);

  const toggle = (id: string) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  const departureDate = activeTrekId ? (trekDates[activeTrekId] ?? null) : null;
  const weatherZoneId = activeTrekId ? (TREK_TO_WEATHER_ZONE[activeTrekId] ?? activeTrekId) : null;
  const zonesToShow = weatherZoneId
    ? ALL_ZONES.filter(z => z.id === weatherZoneId)
    : ALL_ZONES;

  // Trek day-by-day forecast — shown when trek active + departure date within 7-day window
  const trekForecast = useMemo(() => {
    if (!activeTrek || !departureDate || !weatherZoneId) return null;
    const zoneResult = weather[weatherZoneId];
    if (!zoneResult) return null;
    const rows = activeTrek.trekDays.map((day, i) => {
      const d = new Date(departureDate + 'T12:00:00');
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().slice(0, 10);
      return { day, dateStr, forecast: zoneResult.days.find(fd => fd.date === dateStr) };
    }).filter((r): r is { day: typeof r.day; dateStr: string; forecast: DayForecast } => !!r.forecast);
    return rows.length > 0 ? rows : null;
  }, [activeTrek, departureDate, weatherZoneId, weather]);

  const firstResult = weather[ALL_ZONES[0].id];
  const cacheAge = firstResult ? ageLabel(firstResult.ts) : null;

  const numéros = activeTrekId ? (NUMEROS_BY_TREK[activeTrekId] ?? []) : [];

  return (
    <ScrollView
      style={[s.root, notebookBg as any]}
      contentContainerStyle={s.scroll}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.accent} />
      }
    >
      {/* Trek banner */}
      {activeTrek ? (
        <View style={[s.trekBanner, { borderLeftColor: activeTrek.color }]}>
          <View style={[s.trekDot, { backgroundColor: activeTrek.color }]} />
          <View style={{ flex: 1 }}>
            <Text style={s.trekBannerLabel}>Trek actif</Text>
            <Text style={s.trekBannerName}>{activeTrek.name}</Text>
          </View>
        </View>
      ) : !isInitializing ? (
        <View style={s.noTrekBanner}>
          <Text style={s.noTrekText}>Sélectionnez un trek dans Treks pour afficher les infos spécifiques.</Text>
        </View>
      ) : null}

      {/* ── Météo section ── */}
      <View style={s.meteoSection}>
        <View style={s.meteoHeader}>
          <Text style={s.sectionTitle}>☁ Météo</Text>
          {cacheAge && (
            <Text style={s.cacheAge}>
              {firstResult?.fromCache ? '◎ cache' : '● live'} · {cacheAge}
            </Text>
          )}
        </View>

        {zonesToShow.map(zone => {
          const result = weather[zone.id];       // undefined = loading, null = error, ZoneResult = ok
          const hData  = hourly[zone.id];
          const hOpen  = !!showHourly[zone.id];
          const zLat   = zone.lat;
          const zLng   = zone.lng;
          const isLoading = result === undefined;
          const isError   = result === null;
          return (
            <View key={zone.id} style={s.card}>
              <View style={s.cardHeader}>
                <Text style={s.cardIcon}>{weatherZoneId === zone.id ? '▶' : '📍'}</Text>
                <Text style={s.cardTitle}>{zone.label}</Text>
                <Text style={s.cardMeta}>{zone.sub}</Text>
              </View>
              <View style={s.cardBody}>
                {isLoading ? (
                  <Text style={s.loadingText}>Chargement…</Text>
                ) : isError ? (
                  <TouchableOpacity style={s.errorRow} onPress={onRefresh}>
                    <Text style={s.errorText}>⚠ Erreur réseau · Tirer pour rafraîchir</Text>
                  </TouchableOpacity>
                ) : (
                  <>
                    <View style={s.weatherGrid}>
                      {result.days.slice(0, 3).map((day, di) => {
                        const good = day.code <= 2;
                        const bad  = day.code >= 51;
                        return (
                          <View key={di} style={[s.weatherDay, good && s.weatherGood, bad && s.weatherBad]}>
                            <Text style={s.weatherEmoji}>{WMO_EMOJI[day.code] ?? '🌡'}</Text>
                            <Text style={s.weatherLabel}>{DAY_LABELS[di]}</Text>
                            <Text style={s.weatherTemp}>{day.tMin}°/{day.tMax}°</Text>
                            <Text style={s.weatherDesc} numberOfLines={1}>{WMO_LABEL[day.code] ?? '—'}</Text>
                          </View>
                        );
                      })}
                    </View>

                    {/* Hourly toggle */}
                    <TouchableOpacity
                      style={s.hourlyToggle}
                      onPress={() => toggleHourly(zone.id, zLat, zLng)}
                    >
                      <Text style={s.hourlyToggleText}>
                        {hOpen ? '▾ Masquer' : '▸ Prévisions horaires'}
                      </Text>
                    </TouchableOpacity>

                    {hOpen && (
                      <View style={s.hourlySection}>
                        {(['today', 'tomorrow'] as const).map((day, di) => {
                          const slots = hData ? hData[day] : null;
                          return (
                            <View key={day} style={di === 0 ? { marginBottom: 8 } : {}}>
                              <Text style={s.hourlyDayLabel}>{di === 0 ? "Aujourd'hui" : 'Demain'}</Text>
                              {!slots ? (
                                <Text style={s.loadingText}>Chargement…</Text>
                              ) : (
                                <View style={s.hourlyGrid}>
                                  {slots.map((slot, si) => {
                                    const bad = slot.code >= 51;
                                    return (
                                      <View key={si} style={[s.hourlySlot, bad && s.hourlySlotBad]}>
                                        <Text style={s.hourlyHour}>{slot.hour}</Text>
                                        <Text style={s.hourlyEmoji}>{WMO_EMOJI[slot.code] ?? '🌡'}</Text>
                                        <Text style={s.hourlyTemp}>{slot.temp}°</Text>
                                        <Text style={s.hourlyWind}>💨{slot.wind}</Text>
                                      </View>
                                    );
                                  })}
                                </View>
                              )}
                            </View>
                          );
                        })}
                      </View>
                    )}
                  </>
                )}
              </View>
            </View>
          );
        })}

        {/* Trek forecast — day by day */}
        {trekForecast && (
          <View style={s.card}>
            <View style={s.cardHeader}>
              <Text style={s.cardIcon}>📅</Text>
              <Text style={s.cardTitle}>Prévisions trek</Text>
              <Text style={s.cardMeta}>{activeTrek!.name.split(/[—–-]/)[0].trim()}</Text>
            </View>
            <View style={s.cardBody}>
              {trekForecast.map(({ day, dateStr, forecast }, i) => {
                const pColor = forecast.precip > 60 ? C.accent : forecast.precip > 30 ? C.accent2 : C.green;
                const bad = forecast.code >= 51;
                return (
                  <View key={i} style={[s.trekForecastRow, bad && { backgroundColor: 'rgba(200,80,42,0.04)' }, i === trekForecast.length - 1 && { borderBottomWidth: 0 }]}>
                    <View style={s.trekForecastLeft}>
                      <Text style={s.trekForecastJ}>J{i + 1}</Text>
                      <Text style={s.trekForecastDate}>{fmtShortDate(dateStr)}</Text>
                    </View>
                    <Text style={s.trekForecastEmoji}>{WMO_EMOJI[forecast.code] ?? '—'}</Text>
                    <Text style={s.trekForecastTemp}>{forecast.tMin}°/{forecast.tMax}°</Text>
                    <View style={[s.precipPill, { backgroundColor: `${pColor}18`, borderColor: pColor }]}>
                      <Text style={[s.precipText, { color: pColor }]}>💧{forecast.precip}%</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        <View style={s.sourcesRow}>
          {[
            { label: 'meteofrance.com', url: 'https://meteofrance.com' },
            { label: 'meteoblue.com',   url: 'https://meteoblue.com' },
            { label: 'meteociel.fr',    url: 'https://meteociel.fr' },
          ].map((src, i) => (
            <TouchableOpacity key={i} style={s.sourceChip} onPress={() => Linking.openURL(src.url)} activeOpacity={0.7}>
              <Text style={s.sourceText}>🔗 {src.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── Terrain info section ── */}
      <Text style={s.sectionTitle}>Info terrain</Text>

      {terrainCards.map(card => {
        const isOpen = !!expanded[card.id];
        return (
          <View key={`${activeTrekId ?? 'all'}-${card.id}`} style={s.card}>
            <TouchableOpacity style={s.cardHeader} onPress={() => toggle(card.id)} activeOpacity={0.75}>
              <Text style={s.cardIcon}>{card.icon}</Text>
              <Text style={s.cardTitle}>{card.title}</Text>
              {card.meta && <Text style={s.cardMeta}>{card.meta}</Text>}
              <Text style={s.chevron}>{isOpen ? '▾' : '▸'}</Text>
            </TouchableOpacity>
            {isOpen && (
              <View style={s.cardBody}>
                {card.rows.map((row, ri) => {
                  if (row.warning) {
                    return (
                      <View key={ri} style={s.warningRow}>
                        <Text style={s.infoIcon}>{row.icon}</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={s.infoLabel}>{row.label}</Text>
                          {row.sub && <Text style={s.infoSub}>{row.sub}</Text>}
                        </View>
                      </View>
                    );
                  }
                  return (
                    <View key={ri} style={[s.infoRow, ri === card.rows.length - 1 && { borderBottomWidth: 0 }]}>
                      <Text style={s.infoIcon}>{row.icon}</Text>
                      <View style={{ flex: 1 }}>
                        {card.id === 'sos' && ri === 0
                          ? <Text style={s.sosNumber}>{row.label}</Text>
                          : <Text style={s.infoLabel}>{row.label}</Text>
                        }
                        {row.sub && <Text style={s.infoSub}>{row.sub}</Text>}
                      </View>
                      {row.alt && (
                        <View style={s.altBadge}><Text style={s.altText}>{row.alt}</Text></View>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        );
      })}

      {/* ── Premiers secours ── */}
      <Text style={[s.sectionTitle, { marginTop: 8 }]}>🩺 Premiers secours</Text>

      {PREMIERS_SECOURS.map(card => {
        const isOpen = !!psExpanded[card.id];
        return (
          <View key={card.id} style={[s.card, card.urgent && s.cardUrgent]}>
            <TouchableOpacity
              style={s.cardHeader}
              onPress={() => setPsExpanded(prev => ({ ...prev, [card.id]: !prev[card.id] }))}
              activeOpacity={0.75}
            >
              <Text style={s.cardIcon}>{card.icon}</Text>
              <Text style={s.cardTitle}>{card.title}</Text>
              {card.urgent && (
                <View style={s.urgentBadge}><Text style={s.urgentText}>URGENT</Text></View>
              )}
              <Text style={s.chevron}>{isOpen ? '▾' : '▸'}</Text>
            </TouchableOpacity>
            {isOpen && (
              <View style={s.cardBody}>
                {card.steps.map((step, si) => (
                  <View key={si} style={[s.psStep, step.danger && s.psStepDanger, si === card.steps.length - 1 && { borderBottomWidth: 0 }]}>
                    <View style={[s.psStepBadge, step.danger && s.psStepBadgeDanger]}>
                      <Text style={[s.psStepBadgeText, step.danger && { color: C.accent }]}>{step.icon}</Text>
                    </View>
                    <Text style={[s.psStepText, step.danger && { color: C.accent }]}>{step.text}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        );
      })}

      {/* ── Numéros utiles ── */}
      {numéros.length > 0 && (
        <>
          <Text style={[s.sectionTitle, { marginTop: 8 }]}>📞 Numéros utiles</Text>
          <View style={s.card}>
            <View style={s.cardBody}>
              {numéros.map((item, ii) => (
                <TouchableOpacity
                  key={ii}
                  style={[s.numRow, ii === numéros.length - 1 && { borderBottomWidth: 0 }]}
                  onPress={() => Linking.openURL(`tel:${item.tel}`)}
                  activeOpacity={0.7}
                >
                  <Text style={s.numIcon}>{item.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={s.numLabel}>{item.label}</Text>
                    <Text style={s.numSub}>{item.sub}</Text>
                  </View>
                  <View style={s.numTelBadge}>
                    <Text style={s.numTel}>{item.tel.replace(/(\d{2})(?=\d)/g, '$1 ').trim()}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.paper },
  scroll: { padding: 16, paddingBottom: 40 },

  trekBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: C.paper2, borderRadius: 8, borderWidth: 1, borderColor: C.line,
    borderLeftWidth: 4, padding: 10, marginBottom: 12,
  },
  trekDot: { width: 8, height: 8, borderRadius: 4 },
  trekBannerLabel: { fontFamily: FF.mono, fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase', color: C.inkMuted },
  trekBannerName: { fontFamily: FF.display, fontSize: 13, fontWeight: '600', color: C.ink, letterSpacing: -0.3 },
  noTrekBanner: { backgroundColor: C.paper3, borderRadius: 8, borderWidth: 1, borderColor: C.line, padding: 10, marginBottom: 12 },
  noTrekText: { fontFamily: FF.mono, fontSize: 10, color: C.inkMuted, lineHeight: 15 },

  meteoSection: { marginBottom: 16 },
  meteoHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  cacheAge: { fontFamily: FF.mono, fontSize: 9, color: C.inkMuted, letterSpacing: 0.3 },
  sectionTitle: { fontFamily: FF.display, fontSize: 18, fontWeight: '600', color: C.ink, letterSpacing: -0.5, marginBottom: 10 },

  card: { backgroundColor: C.paper2, borderWidth: 1, borderColor: C.line, borderRadius: 10, marginBottom: 10, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 6, elevation: 2 },
  cardUrgent: { borderColor: 'rgba(200,80,42,0.35)' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 },
  cardIcon: { fontSize: 16 },
  cardTitle: { fontFamily: FF.display, fontSize: 14, fontWeight: '600', color: C.ink, flex: 1, letterSpacing: -0.3 },
  cardMeta: { fontFamily: FF.mono, fontSize: 9, color: C.accent, letterSpacing: 0.5 },
  chevron: { fontFamily: FF.mono, fontSize: 12, color: C.inkMuted },
  cardBody: { borderTopWidth: 1, borderTopColor: C.line, padding: 12 },

  loadingText: { fontFamily: FF.mono, fontSize: 11, color: C.inkMuted, textAlign: 'center', paddingVertical: 12 },
  errorRow: { paddingVertical: 12, alignItems: 'center' },
  errorText: { fontFamily: FF.mono, fontSize: 10, color: C.accent },

  weatherGrid: { flexDirection: 'row', gap: 8 },
  weatherDay: { flex: 1, backgroundColor: C.paper3, borderRadius: 8, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: C.line },
  weatherGood: { borderColor: '#86efac' },
  weatherBad: { borderColor: '#fca5a5' },
  weatherEmoji: { fontSize: 22, marginBottom: 3 },
  weatherLabel: { fontFamily: FF.mono, fontSize: 9, letterSpacing: 0.5, textTransform: 'uppercase', color: C.inkMuted, marginBottom: 3 },
  weatherTemp: { fontFamily: FF.mono, fontSize: 12, fontWeight: '500', color: C.ink },
  weatherDesc: { fontFamily: FF.mono, fontSize: 10, color: C.inkMuted, marginTop: 2, textAlign: 'center' },

  hourlyToggle: { marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: C.line2, alignItems: 'center' },
  hourlyToggleText: { fontFamily: FF.mono, fontSize: 9, color: C.blue, letterSpacing: 0.3 },
  hourlySection: { marginTop: 8 },
  hourlyDayLabel: { fontFamily: FF.mono, fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase', color: C.inkMuted, marginBottom: 6 },
  hourlyGrid: { flexDirection: 'row', gap: 4 },
  hourlySlot: { flex: 1, backgroundColor: C.paper3, borderRadius: 6, padding: 6, alignItems: 'center', borderWidth: 1, borderColor: C.line },
  hourlySlotBad: { borderColor: '#fca5a5' },
  hourlyHour: { fontFamily: FF.mono, fontSize: 10, color: C.inkMuted, marginBottom: 2 },
  hourlyEmoji: { fontSize: 14, marginBottom: 2 },
  hourlyTemp: { fontFamily: FF.mono, fontSize: 10, fontWeight: '500', color: C.ink },
  hourlyWind: { fontFamily: FF.mono, fontSize: 10, color: C.inkMuted, marginTop: 1 },

  trekForecastRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: C.line2 },
  trekForecastLeft: { width: 72 },
  trekForecastJ: { fontFamily: FF.mono, fontSize: 9, letterSpacing: 0.8, textTransform: 'uppercase', color: C.inkMuted },
  trekForecastDate: { fontFamily: FF.mono, fontSize: 10, color: C.ink, fontWeight: '500' },
  trekForecastEmoji: { fontSize: 20, width: 28, textAlign: 'center' as const },
  trekForecastTemp: { fontFamily: FF.mono, fontSize: 12, color: C.ink, flex: 1 },
  precipPill: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 7, paddingVertical: 3 },
  precipText: { fontFamily: FF.mono, fontSize: 10, fontWeight: '600' as const },

  sourcesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  sourceChip: { backgroundColor: C.paper3, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: C.line },
  sourceText: { fontFamily: FF.mono, fontSize: 9, color: C.inkMuted },

  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.line2 },
  infoIcon: { fontFamily: FF.mono, fontSize: 13, width: 22, textAlign: 'center', color: C.ink },
  infoLabel: { fontFamily: FF.mono, fontSize: 12, color: C.ink, fontWeight: '500' },
  infoSub: { fontFamily: FF.mono, fontSize: 10, color: C.inkMuted, marginTop: 1 },
  sosNumber: { fontFamily: FF.display, fontSize: 20, fontWeight: '600', color: C.ink },
  altBadge: { backgroundColor: C.paper3, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: C.line, alignSelf: 'flex-start', marginTop: 2 },
  altText: { fontFamily: FF.mono, fontSize: 10, color: C.ink },
  warningRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 8, borderRadius: 6, borderWidth: 1, borderColor: C.accent, backgroundColor: 'rgba(200,80,42,0.05)', marginBottom: 4 },

  urgentBadge: { backgroundColor: 'rgba(200,80,42,0.12)', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, marginRight: 4 },
  urgentText: { fontFamily: FF.mono, fontSize: 7, letterSpacing: 1, color: C.accent, fontWeight: '700' },
  psStep: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.line2 },
  psStepDanger: { backgroundColor: 'rgba(200,80,42,0.04)', borderRadius: 6, borderBottomWidth: 0, marginBottom: 4 },
  psStepBadge: { width: 22, height: 22, borderRadius: 11, backgroundColor: C.paper3, borderWidth: 1, borderColor: C.line, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  psStepBadgeDanger: { borderColor: C.accent, backgroundColor: 'rgba(200,80,42,0.08)' },
  psStepBadgeText: { fontFamily: FF.mono, fontSize: 9, fontWeight: '700', color: C.ink },
  psStepText: { fontFamily: FF.mono, fontSize: 11, color: C.ink, flex: 1, lineHeight: 16, paddingTop: 3 },

  numRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.line2 },
  numIcon: { fontSize: 16, width: 24, textAlign: 'center' },
  numLabel: { fontFamily: FF.mono, fontSize: 12, color: C.ink, fontWeight: '500' },
  numSub: { fontFamily: FF.mono, fontSize: 9, color: C.inkMuted, marginTop: 1 },
  numTelBadge: { backgroundColor: C.blue, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5 },
  numTel: { fontFamily: FF.mono, fontSize: 10, color: '#fff', letterSpacing: 0.5 },
});
