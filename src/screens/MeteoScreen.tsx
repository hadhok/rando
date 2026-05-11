import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { ETAPES } from '../data/etapes';

// Étapes avec coordonnées représentatives pour la météo
const ETAPES_METEO = ETAPES.map((e) => ({
  label: e.arrivee,
  lat: e.coordArrivee.lat,
  lng: e.coordArrivee.lng,
}));

const WMO_LABELS: Record<number, string> = {
  0: 'Ciel dégagé', 1: 'Peu nuageux', 2: 'Partiellement nuageux', 3: 'Couvert',
  45: 'Brouillard', 48: 'Brouillard givrant',
  51: 'Bruine légère', 53: 'Bruine', 55: 'Bruine forte',
  61: 'Pluie légère', 63: 'Pluie', 65: 'Pluie forte',
  71: 'Neige légère', 73: 'Neige', 75: 'Neige forte',
  80: 'Averses légères', 81: 'Averses', 82: 'Averses fortes',
  85: 'Averses de neige', 86: 'Averses de neige fortes',
  95: 'Orage', 96: 'Orage avec grêle', 99: 'Orage violent',
  77: 'Grains de neige', 56: 'Bruine verglaçante', 57: 'Bruine verglaçante forte',
  66: 'Pluie verglaçante', 67: 'Pluie verglaçante forte',
};

const WMO_EMOJI: Record<number, string> = {
  0: '☀️', 1: '🌤', 2: '⛅', 3: '☁️',
  45: '🌫', 48: '🌫',
  51: '🌦', 53: '🌦', 55: '🌧',
  61: '🌧', 63: '🌧', 65: '🌧',
  71: '🌨', 73: '❄️', 75: '❄️',
  80: '🌦', 81: '🌧', 82: '⛈',
  85: '🌨', 86: '❄️',
  95: '⛈', 96: '⛈', 99: '⛈',
};

interface DayForecast {
  date: string;
  tMax: number;
  tMin: number;
  code: number;
  precipMm: number;
  windMax: number;
}

interface LocationForecast {
  label: string;
  days: DayForecast[];
}

function getLabel(code: number) {
  return WMO_LABELS[code] ?? 'Inconnu';
}
function getEmoji(code: number) {
  return WMO_EMOJI[code] ?? '🌡';
}

function alertLevel(day: DayForecast): 'ok' | 'caution' | 'danger' {
  if (day.code >= 95 || day.windMax > 60) return 'danger';
  if (day.code >= 61 || day.windMax > 40 || day.precipMm > 10) return 'caution';
  return 'ok';
}

const ALERT_COLOR = { ok: '#2A9D8F', caution: '#E9C46A', danger: '#E63946' };
const ALERT_LABEL = { ok: 'Favorable', caution: 'Prudence', danger: 'Danger' };

function DayCard({ day }: { day: DayForecast }) {
  const level = alertLevel(day);
  const dateObj = new Date(day.date);
  const dayName = dateObj.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
  return (
    <View style={[styles.dayCard, { borderLeftColor: ALERT_COLOR[level] }]}>
      <View style={styles.dayTop}>
        <Text style={styles.dayName}>{dayName}</Text>
        <Text style={styles.dayEmoji}>{getEmoji(day.code)}</Text>
        <View style={[styles.alertPill, { backgroundColor: ALERT_COLOR[level] }]}>
          <Text style={styles.alertPillText}>{ALERT_LABEL[level]}</Text>
        </View>
      </View>
      <Text style={styles.dayDesc}>{getLabel(day.code)}</Text>
      <View style={styles.dayStats}>
        <Stat icon="🌡" label={`${day.tMin}° / ${day.tMax}°`} />
        <Stat icon="💧" label={`${day.precipMm} mm`} />
        <Stat icon="💨" label={`${day.windMax} km/h`} />
      </View>
    </View>
  );
}

function Stat({ icon, label }: { icon: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

async function fetchForecast(lat: number, lng: number): Promise<DayForecast[]> {
  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${lat}&longitude=${lng}` +
    `&daily=temperature_2m_max,temperature_2m_min,weathercode,precipitation_sum,windspeed_10m_max` +
    `&timezone=Europe%2FParis&forecast_days=7`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Erreur réseau');
  const data = await res.json();
  return data.daily.time.map((date: string, i: number) => ({
    date,
    tMax: Math.round(data.daily.temperature_2m_max[i]),
    tMin: Math.round(data.daily.temperature_2m_min[i]),
    code: data.daily.weathercode[i],
    precipMm: Math.round(data.daily.precipitation_sum[i] * 10) / 10,
    windMax: Math.round(data.daily.windspeed_10m_max[i]),
  }));
}

export default function MeteoScreen() {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [forecasts, setForecasts] = useState<Record<number, LocationForecast>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const selected = ETAPES_METEO[selectedIdx];

  useEffect(() => {
    if (forecasts[selectedIdx]) return;
    setLoading(true);
    setError('');
    fetchForecast(selected.lat, selected.lng)
      .then((days) => {
        setForecasts((prev) => ({ ...prev, [selectedIdx]: { label: selected.label, days } }));
      })
      .catch(() => setError('Impossible de charger la météo. Vérifiez votre connexion.'))
      .finally(() => setLoading(false));
  }, [selectedIdx]);

  const forecast = forecasts[selectedIdx];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Météo GR10</Text>
        <Text style={styles.headerSub}>7 jours · Données Open-Meteo</Text>
      </View>

      {/* Sélecteur de localisation */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.selectorBar}
        contentContainerStyle={styles.selectorContent}
      >
        {ETAPES_METEO.map((loc, idx) => (
          <TouchableOpacity
            key={idx}
            style={[styles.selectorBtn, selectedIdx === idx && styles.selectorBtnActive]}
            onPress={() => setSelectedIdx(idx)}
          >
            <Text style={[styles.selectorBtnText, selectedIdx === idx && styles.selectorBtnTextActive]}>
              {loc.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Alerte montagne */}
      <View style={styles.alertBox}>
        <Text style={styles.alertTitle}>⛰ Météo montagne</Text>
        <Text style={styles.alertText}>
          Les prévisions sont données à basse altitude. En altitude (+1000m), comptez{' '}
          <Text style={{ fontWeight: '700' }}>–6°C par 1000m</Text> et des conditions souvent plus
          sévères. Orages possibles chaque après-midi en été. Partez avant 13h sur les crêtes.
        </Text>
      </View>

      {loading && (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#264653" />
          <Text style={styles.loadingText}>Chargement météo…</Text>
        </View>
      )}

      {error !== '' && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => {
              setForecasts((prev) => { const n = { ...prev }; delete n[selectedIdx]; return n; });
            }}
          >
            <Text style={styles.retryBtnText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      )}

      {forecast && !loading && (
        <ScrollView contentContainerStyle={styles.dayList} showsVerticalScrollIndicator={false}>
          <Text style={styles.locationTitle}>📍 {forecast.label}</Text>
          {forecast.days.map((day) => (
            <DayCard key={day.date} day={day} />
          ))}
          <Text style={styles.sourceNote}>
            Source : Open-Meteo.com · Mise à jour automatique
          </Text>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1FAEE' },
  header: { backgroundColor: '#264653', padding: 16 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '700' },
  headerSub: { color: '#A8DADC', fontSize: 13, marginTop: 2 },
  selectorBar: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    maxHeight: 50,
  },
  selectorContent: {
    padding: 8,
    gap: 8,
    alignItems: 'center',
  },
  selectorBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F1FAEE',
  },
  selectorBtnActive: { backgroundColor: '#264653' },
  selectorBtnText: { fontSize: 12, color: '#555', fontWeight: '500' },
  selectorBtnTextActive: { color: '#fff' },
  alertBox: {
    margin: 12,
    backgroundColor: '#FFF3CD',
    borderLeftWidth: 4,
    borderLeftColor: '#E9C46A',
    borderRadius: 8,
    padding: 12,
  },
  alertTitle: { fontSize: 13, fontWeight: '700', color: '#856404', marginBottom: 4 },
  alertText: { fontSize: 12, color: '#664d03', lineHeight: 18 },
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { color: '#264653', fontSize: 14 },
  errorBox: { margin: 16, alignItems: 'center', gap: 12 },
  errorText: { color: '#E63946', fontSize: 14, textAlign: 'center' },
  retryBtn: {
    backgroundColor: '#264653',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryBtnText: { color: '#fff', fontWeight: '600' },
  dayList: { padding: 12, gap: 10 },
  locationTitle: { fontSize: 16, fontWeight: '700', color: '#264653', marginBottom: 4 },
  dayCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    gap: 6,
  },
  dayTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dayName: { fontSize: 13, fontWeight: '600', color: '#264653', flex: 1 },
  dayEmoji: { fontSize: 22 },
  alertPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  alertPillText: { fontSize: 11, color: '#fff', fontWeight: '700' },
  dayDesc: { fontSize: 13, color: '#555' },
  dayStats: { flexDirection: 'row', gap: 16, marginTop: 2 },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statIcon: { fontSize: 14 },
  statLabel: { fontSize: 12, color: '#444', fontWeight: '500' },
  sourceNote: { fontSize: 11, color: '#aaa', textAlign: 'center', marginTop: 8, marginBottom: 16 },
});
