import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, RefreshControl, Platform,
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

const ZONE_BY_TREK: Record<string, { lat: number; lng: number; label: string; sub: string }> = {
  gr10:     { lat: 43.37, lng: -1.78, label: 'GR10 — Pays Basque', sub: 'Zone côtière · 0–600m' },
  ayous:    { lat: 42.84, lng: -0.44, label: 'Pyrénées — Ossau',   sub: 'Altitude 2000m+' },
  artouste: { lat: 42.84, lng: -0.44, label: 'Pyrénées — Ossau',   sub: 'Altitude 2000m+' },
};
const ALL_ZONES = [
  { id: 'gr10',  ...ZONE_BY_TREK.gr10 },
  { id: 'ossau', ...ZONE_BY_TREK.ayous },
];

const CACHE_TTL = 3 * 60 * 60 * 1000;

interface DayForecast { tMax: number; tMin: number; code: number; }
interface ZoneResult { days: DayForecast[]; ts: number; fromCache: boolean; }

function cacheKey(id: string) { return `meteo_${id}_v2`; }
function ageLabel(ts: number): string {
  const min = Math.round((Date.now() - ts) / 60000);
  if (min < 2) return 'À l\'instant';
  if (min < 60) return `Il y a ${min} min`;
  return `Il y a ${Math.round(min / 60)}h`;
}

async function fetchZone(id: string, lat: number, lng: number): Promise<ZoneResult> {
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
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=Europe%2FParis&forecast_days=3`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('fetch failed');
  const json = await res.json();
  const d = json.daily;
  const days: DayForecast[] = d.time.map((_: string, i: number) => ({
    tMax: Math.round(d.temperature_2m_max[i]),
    tMin: Math.round(d.temperature_2m_min[i]),
    code: d.weathercode[i],
  }));
  if (Platform.OS === 'web') {
    try { localStorage.setItem(key, JSON.stringify({ ts: now, data: days })); } catch {}
  }
  return { days, ts: now, fromCache: false };
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
        { icon: 'J1', label: "Lac Bersau", sub: 'Alternative si lac Gentau interdit · Belle vue sur Pic du Midi', alt: '2083m' },
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
        { icon: '✗', label: 'Lacs Roumassot & Miey', sub: 'Zone pastorale — bivouac interdit toute l\'année' },
        { icon: '✗', label: 'Lac Gentau (juil–sept)', sub: 'Bivouac interdit · Zone survisitée · Aller au lac Bersau' },
        { icon: '✗', label: 'Chiens interdits', sub: 'En zone cœur PNP · Même tenu en laisse' },
      ],
    },
    {
      id: 'maps', icon: '🗺', title: 'Cartes & navigation',
      rows: [
        { icon: '📱', label: 'OsmAnd / Komoot', sub: 'GPX Ayous_Boucle.gpx · Fonds IGN / OSM hors ligne' },
        { icon: '📄', label: '1547OT — Ossau', sub: 'Haute-Vallée d\'Ossau · Carte IGN 1:25 000 · Indispensable' },
        { icon: '📄', label: 'Editions Rando', sub: 'Carte Pyrénées n°3 — Béarn · Réf. 03' },
        { icon: '🌐', label: 'Impression cartes', sub: 'geoportail.gouv.fr → Imprimer → A4 · 1:25 000' },
      ],
    },
    CARDS_SOS,
  ],
};

// Artouste uses same terrain as Ayous (same mountain zone)
TERRAIN_BY_TREK.artouste = TERRAIN_BY_TREK.ayous;

// Fallback when no trek selected — merge both without duplicating SOS
const ALL_TERRAIN_CARDS: TerrainCard[] = [
  ...TERRAIN_BY_TREK.gr10.filter(c => c.id !== 'sos'),
  ...TERRAIN_BY_TREK.ayous.filter(c => c.id !== 'sos'),
  CARDS_SOS,
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function TerrainScreen() {
  const { activeTrekId } = useGpx();
  const activeTrek = activeTrekId ? TREKS.find(t => t.id === activeTrekId) : null;

  const terrainCards = activeTrekId
    ? (TERRAIN_BY_TREK[activeTrekId] ?? ALL_TERRAIN_CARDS)
    : ALL_TERRAIN_CARDS;

  const [expanded, setExpanded] = useState<Record<string, boolean>>(
    Object.fromEntries(terrainCards.filter(c => c.defaultOpen).map(c => [c.id, true]))
  );
  const [weather, setWeather] = useState<Record<string, ZoneResult | null>>({});
  const [refreshing, setRefreshing] = useState(false);

  const loadWeather = useCallback(async (force = false) => {
    if (force && Platform.OS === 'web') {
      ALL_ZONES.forEach(z => { try { localStorage.removeItem(cacheKey(z.id)); } catch {} });
    }
    const results = await Promise.all(
      ALL_ZONES.map(z => fetchZone(z.id, z.lat, z.lng).catch(() => null))
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

  const toggle = (id: string) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  // Weather zone(s) to show
  const activeZone = activeTrekId ? ZONE_BY_TREK[activeTrekId] : null;
  const zonesToShow = activeZone
    ? [{ id: activeTrekId!, ...activeZone }]
    : ALL_ZONES;

  const firstResult = weather[ALL_ZONES[0].id];
  const cacheAge = firstResult ? ageLabel(firstResult.ts) : null;

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
      ) : (
        <View style={s.noTrekBanner}>
          <Text style={s.noTrekText}>Sélectionnez un trek dans Treks pour afficher les infos spécifiques.</Text>
        </View>
      )}

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
          const result = weather[zone.id];
          return (
            <View key={zone.id} style={s.card}>
              <View style={s.cardHeader}>
                <Text style={s.cardIcon}>{activeTrekId === zone.id ? '▶' : '📍'}</Text>
                <Text style={s.cardTitle}>{zone.label}</Text>
                <Text style={s.cardMeta}>{zone.sub}</Text>
              </View>
              <View style={s.cardBody}>
                {!result ? (
                  <Text style={s.loadingText}>Chargement…</Text>
                ) : (
                  <View style={s.weatherGrid}>
                    {result.days.map((day, di) => {
                      const good = day.code <= 2;
                      const bad  = day.code >= 51;
                      return (
                        <View key={di} style={[s.weatherDay, good && s.weatherGood, bad && s.weatherBad]}>
                          <Text style={s.weatherEmoji}>{WMO_EMOJI[day.code] ?? '🌡'}</Text>
                          <Text style={s.weatherLabel}>{DAY_LABELS[di]}</Text>
                          <Text style={s.weatherTemp}>{day.tMin}–{day.tMax}°C</Text>
                          <Text style={s.weatherDesc} numberOfLines={1}>{WMO_LABEL[day.code] ?? '—'}</Text>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            </View>
          );
        })}

        <View style={s.sourcesRow}>
          {['meteofrance.com', 'meteoblue.com', 'meteociel.fr'].map((src, i) => (
            <View key={i} style={s.sourceChip}>
              <Text style={s.sourceText}>{src}</Text>
            </View>
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
                        <View style={s.altBadge}>
                          <Text style={s.altText}>{row.alt}</Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        );
      })}
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
  trekBannerLabel: { fontFamily: FF.mono, fontSize: 8, letterSpacing: 1.2, textTransform: 'uppercase', color: C.ink, opacity: 0.4 },
  trekBannerName: { fontFamily: FF.display, fontSize: 13, fontWeight: '600', color: C.ink, letterSpacing: -0.3 },

  noTrekBanner: {
    backgroundColor: C.paper3, borderRadius: 8, borderWidth: 1, borderColor: C.line,
    padding: 10, marginBottom: 12,
  },
  noTrekText: { fontFamily: FF.mono, fontSize: 10, color: C.ink, opacity: 0.5, lineHeight: 15 },

  meteoSection: { marginBottom: 16 },
  meteoHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  cacheAge: { fontFamily: FF.mono, fontSize: 9, color: C.ink, opacity: 0.4, letterSpacing: 0.3 },

  sectionTitle: { fontFamily: FF.display, fontSize: 18, fontWeight: '600', color: C.ink, letterSpacing: -0.5, marginBottom: 10 },

  card: { backgroundColor: C.paper2, borderWidth: 1, borderColor: C.line, borderRadius: 10, marginBottom: 10, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 6, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 },
  cardIcon: { fontSize: 16 },
  cardTitle: { fontFamily: FF.display, fontSize: 14, fontWeight: '600', color: C.ink, flex: 1, letterSpacing: -0.3 },
  cardMeta: { fontFamily: FF.mono, fontSize: 9, color: C.accent, letterSpacing: 0.5 },
  chevron: { fontFamily: FF.mono, fontSize: 12, color: C.ink, opacity: 0.45 },
  cardBody: { borderTopWidth: 1, borderTopColor: C.line, padding: 12 },

  loadingText: { fontFamily: FF.mono, fontSize: 11, color: C.ink, opacity: 0.4, textAlign: 'center', paddingVertical: 12 },

  weatherGrid: { flexDirection: 'row', gap: 8 },
  weatherDay: { flex: 1, backgroundColor: C.paper3, borderRadius: 8, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: C.line },
  weatherGood: { borderColor: '#86efac' },
  weatherBad: { borderColor: '#fca5a5' },
  weatherEmoji: { fontSize: 22, marginBottom: 3 },
  weatherLabel: { fontFamily: FF.mono, fontSize: 9, letterSpacing: 0.5, textTransform: 'uppercase', color: C.ink, opacity: 0.5, marginBottom: 3 },
  weatherTemp: { fontFamily: FF.mono, fontSize: 12, fontWeight: '500', color: C.ink },
  weatherDesc: { fontFamily: FF.mono, fontSize: 8, color: C.ink, opacity: 0.6, marginTop: 2, textAlign: 'center' },

  sourcesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  sourceChip: { backgroundColor: C.paper3, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: C.line },
  sourceText: { fontFamily: FF.mono, fontSize: 9, color: C.ink, opacity: 0.5 },

  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.line2 },
  infoIcon: { fontFamily: FF.mono, fontSize: 13, width: 22, textAlign: 'center', color: C.ink },
  infoLabel: { fontFamily: FF.mono, fontSize: 12, color: C.ink, fontWeight: '500' },
  infoSub: { fontFamily: FF.mono, fontSize: 10, color: C.ink, opacity: 0.5, marginTop: 1 },
  sosNumber: { fontFamily: FF.display, fontSize: 20, fontWeight: '600', color: C.ink },

  altBadge: { backgroundColor: C.paper3, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: C.line, alignSelf: 'flex-start', marginTop: 2 },
  altText: { fontFamily: FF.mono, fontSize: 10, color: C.ink },

  warningRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 8, borderRadius: 6, borderWidth: 1, borderColor: C.accent, backgroundColor: 'rgba(200,80,42,0.05)', marginBottom: 4 },
});
