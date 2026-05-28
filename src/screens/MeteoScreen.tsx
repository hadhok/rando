import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { C, FF, notebookBg } from '../theme';

const WMO_LABEL: Record<number, string> = {
  0: 'Ciel dégagé', 1: 'Peu nuageux', 2: 'Partiellement nuageux', 3: 'Couvert',
  45: 'Brouillard', 48: 'Brouillard givrant',
  51: 'Bruine légère', 53: 'Bruine', 55: 'Bruine forte',
  61: 'Pluie légère', 63: 'Pluie', 65: 'Pluie forte',
  71: 'Neige légère', 73: 'Neige', 75: 'Neige forte',
  80: 'Averses légères', 81: 'Averses', 82: 'Averses fortes',
  95: 'Orage', 96: 'Orage + grêle', 99: 'Orage violent',
};

const WMO_EMOJI: Record<number, string> = {
  0: '☀️', 1: '🌤', 2: '⛅', 3: '☁️',
  45: '🌫', 48: '🌫',
  51: '🌦', 53: '🌦', 55: '🌧',
  61: '🌧', 63: '🌧', 65: '🌧',
  71: '🌨', 73: '❄️', 75: '❄️',
  80: '🌦', 81: '🌧', 82: '⛈',
  95: '⛈', 96: '⛈', 99: '⛈',
};

const CACHE_TTL = 3 * 60 * 60 * 1000;

interface DayForecast {
  date: string;
  tMax: number;
  tMin: number;
  code: number;
}

interface ZoneForecast {
  label: string;
  sub: string;
  icon: string;
  tip?: string;
  tipSub?: string;
  days: DayForecast[];
}

const ZONES = [
  { label: 'GR10 — Pays Basque', sub: 'Zone côtière', icon: '📍', lat: 43.37, lng: -1.78, cacheKey: 'meteo_paysbasque_v1' },
  { label: 'Pyrénées — Ossau', sub: 'Altitude 2000m+', icon: '🏔', lat: 42.84, lng: -0.44, cacheKey: 'meteo_ossau_v1',
    tip: 'Nuit au lac Bersau (2083m)', tipSub: 'Estimation ~3–5°C · Sac de couchage 0°C indispensable',
    tip2: 'Orages en altitude', tipSub2: "Fréquents l'après-midi en été · redescendre avant 14h si nuages",
  },
];

const DAY_LABELS = ['Auj.', 'Dem.', 'J+2', 'J+3', 'J+4', 'J+5', 'J+6'];

function isGoodWeather(code: number): boolean {
  return code <= 2;
}
function isBadWeather(code: number): boolean {
  return code >= 51;
}

async function fetchZone(lat: number, lng: number, cacheKey: string): Promise<DayForecast[]> {
  const now = Date.now();
  if (Platform.OS === 'web') {
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const { ts, data } = JSON.parse(cached);
        if (now - ts < CACHE_TTL) return data;
      }
    } catch {}
  }

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=Europe%2FParis&forecast_days=3`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('fetch failed');
  const json = await res.json();
  const d = json.daily;
  const days: DayForecast[] = d.time.map((date: string, i: number) => ({
    date,
    tMax: Math.round(d.temperature_2m_max[i]),
    tMin: Math.round(d.temperature_2m_min[i]),
    code: d.weathercode[i],
  }));

  if (Platform.OS === 'web') {
    try {
      localStorage.setItem(cacheKey, JSON.stringify({ ts: now, data: days }));
    } catch {}
  }
  return days;
}

export default function MeteoScreen() {
  const [forecasts, setForecasts] = useState<(DayForecast[] | null)[]>([null, null]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all(
      ZONES.map(z => fetchZone(z.lat, z.lng, z.cacheKey).catch(() => null))
    ).then(results => {
      setForecasts(results);
      setLoading(false);
    });
  }, []);

  return (
    <View style={[s.root, notebookBg as any]}>
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.sectionTitle}>Météo terrain</Text>

        {ZONES.map((zone, zi) => {
          const days = forecasts[zi];
          return (
            <View key={zi} style={s.card}>
              <View style={s.cardHeader}>
                <Text style={s.cardIcon}>{zone.icon}</Text>
                <Text style={s.cardTitle}>{zone.label}</Text>
                <Text style={s.cardMeta}>{zone.sub}</Text>
              </View>
              <View style={s.cardBody}>
                {loading || !days ? (
                  <ActivityIndicator color={C.accent} style={{ paddingVertical: 20 }} />
                ) : (
                  <View style={s.weatherGrid}>
                    {days.map((day, di) => {
                      const good = isGoodWeather(day.code);
                      const bad = isBadWeather(day.code);
                      return (
                        <View key={di} style={[s.weatherDay, good && s.weatherGood, bad && s.weatherBad]}>
                          <Text style={s.weatherEmoji}>{WMO_EMOJI[day.code] ?? '🌡'}</Text>
                          <Text style={s.weatherLabel}>{DAY_LABELS[di]}</Text>
                          <Text style={s.weatherTemp}>{day.tMin}–{day.tMax}°C</Text>
                          <Text style={s.weatherDesc}>{WMO_LABEL[day.code] ?? '—'}</Text>
                        </View>
                      );
                    })}
                  </View>
                )}
                {(zone as any).tip && (
                  <View style={s.infoRow}>
                    <Text style={s.infoIcon}>🌡</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={s.infoLabel}>{(zone as any).tip}</Text>
                      <Text style={s.infoSub}>{(zone as any).tipSub}</Text>
                    </View>
                  </View>
                )}
                {(zone as any).tip2 && (
                  <View style={[s.infoRow, { borderBottomWidth: 0 }]}>
                    <Text style={s.infoIcon}>⚡</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={s.infoLabel}>{(zone as any).tip2}</Text>
                      <Text style={s.infoSub}>{(zone as any).tipSub2}</Text>
                    </View>
                  </View>
                )}
              </View>
            </View>
          );
        })}

        {/* Sources */}
        <View style={s.card}>
          <View style={s.cardHeader}>
            <Text style={s.cardIcon}>📱</Text>
            <Text style={s.cardTitle}>Sources météo fiables</Text>
          </View>
          <View style={s.cardBody}>
            {[
              { icon: '🌐', label: 'meteofrance.com', sub: 'Prévisions montagne Pyrénées Atlantiques' },
              { icon: '🌐', label: 'meteoblue.com', sub: 'Heure par heure en altitude — très précis' },
              { icon: '🌐', label: 'meteociel.fr', sub: 'Modèles GFS/ECMWF — 7 jours' },
            ].map((row, i, arr) => (
              <View key={i} style={[s.infoRow, i === arr.length - 1 && { borderBottomWidth: 0 }]}>
                <Text style={s.infoIcon}>{row.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={s.infoLabel}>{row.label}</Text>
                  <Text style={s.infoSub}>{row.sub}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.paper },
  scroll: { padding: 16, paddingBottom: 40 },

  sectionTitle: {
    fontFamily: FF.display, fontSize: 18, fontWeight: '600', color: C.ink,
    letterSpacing: -0.5, marginBottom: 14,
  },

  card: {
    backgroundColor: C.paper2, borderWidth: 1, borderColor: C.line, borderRadius: 10,
    marginBottom: 12, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderBottomWidth: 1, borderBottomColor: C.line },
  cardIcon: { fontSize: 18 },
  cardTitle: { fontFamily: FF.display, fontSize: 15, fontWeight: '600', color: C.ink, flex: 1, letterSpacing: -0.3 },
  cardMeta: { fontFamily: FF.mono, fontSize: 10, color: C.accent, letterSpacing: 0.5 },
  cardBody: { padding: 12 },

  weatherGrid: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  weatherDay: {
    flex: 1, backgroundColor: C.paper3, borderRadius: 8, padding: 10,
    alignItems: 'center', borderWidth: 1, borderColor: C.line,
  },
  weatherGood: { borderColor: '#86efac' },
  weatherBad: { borderColor: '#fca5a5' },
  weatherEmoji: { fontSize: 22, marginBottom: 3 },
  weatherLabel: { fontFamily: FF.mono, fontSize: 9, letterSpacing: 0.5, textTransform: 'uppercase', color: C.ink, opacity: 0.5, marginBottom: 3 },
  weatherTemp: { fontFamily: FF.mono, fontSize: 12, fontWeight: '500', color: C.ink },
  weatherDesc: { fontFamily: FF.mono, fontSize: 8, color: C.ink, opacity: 0.6, marginTop: 2, textAlign: 'center' },

  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.line2 },
  infoIcon: { fontSize: 16, width: 24, textAlign: 'center' },
  infoLabel: { fontFamily: FF.mono, fontSize: 12, color: C.ink, fontWeight: '500' },
  infoSub: { fontFamily: FF.mono, fontSize: 10, color: C.ink, opacity: 0.5, marginTop: 1 },
});
