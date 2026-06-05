import React, { useState, useEffect, useRef } from 'react';
import {
  Alert,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { ETAPES } from '../data/etapes';
import { useGpx } from '../context/GpxContext';

// ─── WMO helpers ──────────────────────────────────────────────────────────────

const WMO_EMOJI: Record<number, string> = {
  0: '☀️', 1: '🌤', 2: '⛅', 3: '☁️',
  45: '🌫', 48: '🌫',
  51: '🌦', 53: '🌦', 55: '🌧',
  61: '🌧', 63: '🌧', 65: '🌧',
  71: '🌨', 73: '❄️', 75: '❄️',
  80: '🌦', 81: '🌧', 82: '⛈',
  85: '🌨', 86: '❄️',
  95: '⛈', 96: '⛈', 99: '⛈',
  77: '🌨', 56: '🌦', 57: '🌧', 66: '🌧', 67: '🌧',
};

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

function wmoEmoji(code: number) { return WMO_EMOJI[code] ?? '🌡'; }
function wmoLabel(code: number) { return WMO_LABELS[code] ?? 'Inconnu'; }

// ─── Forecast types ───────────────────────────────────────────────────────────

interface DayForecast {
  date: string;
  tMax: number;
  tMin: number;
  code: number;
  precipMm: number;
  windMax: number;
}

// ─── Cache helpers (web only) ─────────────────────────────────────────────────

const CACHE_TTL_MS = 3 * 60 * 60 * 1000;

function cacheKey(lat: number, lng: number) {
  return `meteo_${lat.toFixed(3)}_${lng.toFixed(3)}`;
}

function loadCached(lat: number, lng: number): DayForecast[] | null {
  if (Platform.OS !== 'web') return null;
  try {
    const raw = localStorage.getItem(cacheKey(lat, lng));
    if (!raw) return null;
    const { ts, days } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL_MS) return null;
    return days;
  } catch {
    return null;
  }
}

function saveCache(lat: number, lng: number, days: DayForecast[]) {
  if (Platform.OS !== 'web') return;
  try {
    localStorage.setItem(cacheKey(lat, lng), JSON.stringify({ ts: Date.now(), days }));
  } catch {}
}

async function fetchForecast(lat: number, lng: number): Promise<DayForecast[]> {
  const cached = loadCached(lat, lng);
  if (cached) return cached;

  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${lat}&longitude=${lng}` +
    `&daily=temperature_2m_max,temperature_2m_min,weathercode,precipitation_sum,windspeed_10m_max` +
    `&timezone=Europe%2FParis&forecast_days=7`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Erreur réseau');
  const data = await res.json();
  const days: DayForecast[] = data.daily.time.map((date: string, i: number) => ({
    date,
    tMax: Math.round(data.daily.temperature_2m_max[i]),
    tMin: Math.round(data.daily.temperature_2m_min[i]),
    code: data.daily.weathercode[i],
    precipMm: Math.round(data.daily.precipitation_sum[i] * 10) / 10,
    windMax: Math.round(data.daily.windspeed_10m_max[i]),
  }));
  saveCache(lat, lng, days);
  return days;
}

// ─── Location data ────────────────────────────────────────────────────────────

const LOCATIONS = ETAPES.map((e) => ({
  label: e.arrivee,
  lat: e.coordArrivee.lat,
  lng: e.coordArrivee.lng,
}));

// ─── PGHM data ────────────────────────────────────────────────────────────────

const PGHM = [
  { region: 'Pyrénées-Atlantiques (64)', service: 'PGHM Oloron',             numero: '05 59 10 22 10' },
  { region: 'Hautes-Pyrénées (65)',       service: 'PGHM Luz-Saint-Sauveur', numero: '05 62 92 41 41' },
  { region: 'Haute-Garonne (31)',         service: 'PGHM Bagnères-de-Luchon', numero: '05 61 79 98 80' },
  { region: 'Ariège (09)',               service: 'PGHM Foix',               numero: '05 61 65 10 04' },
  { region: 'Pyrénées-Orientales (66)',   service: 'PGHM Perpignan',          numero: '04 68 61 31 44' },
];

const SAFETY_TIPS = [
  { icon: '📍', titre: 'Partagez votre itinéraire', desc: 'Laissez votre programme à un proche avec votre heure de retour estimée.' },
  { icon: '🌤', titre: 'Surveillez la météo',       desc: 'Consultez les prévisions avant chaque étape. Orages possibles l\'après-midi en été.' },
  { icon: '💊', titre: 'Trousse de secours',        desc: 'Pansements, antiseptique, antidouleur, couverture de survie.' },
  { icon: '📱', titre: 'Batterie chargée',          desc: 'Emportez une batterie externe. Le GPS consomme beaucoup.' },
  { icon: '👟', titre: 'Demi-tour sans honte',       desc: 'Si les conditions se dégradent ou que vous êtes épuisé, rebroussez chemin.' },
];

// ─── Small components ─────────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return <Text style={st.sectionHeader}>{title}</Text>;
}

function ForecastCard({ day }: { day: DayForecast }) {
  const d = new Date(day.date);
  const dayName = d.toLocaleDateString('fr-FR', { weekday: 'short' });
  const dayNum  = d.toLocaleDateString('fr-FR', { day: 'numeric' });
  return (
    <View style={st.forecastCard}>
      <Text style={st.fcDay}>{dayName}</Text>
      <Text style={st.fcDayNum}>{dayNum}</Text>
      <Text style={st.fcEmoji}>{wmoEmoji(day.code)}</Text>
      <Text style={st.fcTempMax}>{day.tMax}°</Text>
      <Text style={st.fcTempMin}>{day.tMin}°</Text>
      <Text style={st.fcRain}>💧{day.precipMm}mm</Text>
      <Text style={st.fcWind}>💨{day.windMax}</Text>
    </View>
  );
}

function callPhone(numero: string) {
  const digits = numero.replace(/\s/g, '');
  Linking.openURL(`tel:${digits}`).catch(() =>
    Alert.alert('Erreur', 'Impossible d\'ouvrir le téléphone')
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function InfoScreen() {
  useGpx();
  const [locIdx, setLocIdx] = useState(0);
  const [forecasts, setForecasts] = useState<Record<number, DayForecast[]>>({});
  const [loading, setLoading] = useState(false);
  const [meteoError, setMeteoError] = useState('');
  const [copyStatus, setCopyStatus] = useState('');

  const loc = LOCATIONS[locIdx];

  useEffect(() => {
    if (forecasts[locIdx]) return;
    setLoading(true);
    setMeteoError('');
    fetchForecast(loc.lat, loc.lng)
      .then((days) => setForecasts((prev) => ({ ...prev, [locIdx]: days })))
      .catch(() => {
        const stale = loadCached(loc.lat, loc.lng);
        if (stale) {
          setForecasts((prev) => ({ ...prev, [locIdx]: stale }));
          setMeteoError('Données hors-ligne (dernière mise à jour disponible)');
        } else {
          setMeteoError('Impossible de charger la météo. Vérifiez votre connexion.');
        }
      })
      .finally(() => setLoading(false));
  }, [locIdx]);


  return (
    <SafeAreaView style={st.safe}>
      <View style={st.header}>
        <Text style={st.headerTitle}>Infos & Météo</Text>
        <Text style={st.headerSub}>GR10 · Pyrénées</Text>
      </View>

      <ScrollView contentContainerStyle={st.scroll} showsVerticalScrollIndicator={false}>

        {/* ── MÉTÉO ─────────────────────────────────────────────────────────── */}
        <SectionHeader title="🌤 MÉTÉO" />

        {/* Location chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={st.chipBar}
          contentContainerStyle={st.chipBarContent}
        >
          {LOCATIONS.map((l, i) => (
            <TouchableOpacity
              key={i}
              style={[st.locChip, locIdx === i && st.locChipActive]}
              onPress={() => setLocIdx(i)}
            >
              <Text style={[st.locChipTxt, locIdx === i && st.locChipTxtActive]} numberOfLines={1}>
                {l.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Mountain alert */}
        <View style={st.mountainAlert}>
          <Text style={st.mountainAlertTitle}>⛰ Météo montagne</Text>
          <Text style={st.mountainAlertText}>
            En altitude comptez -6°C/1000m par rapport à la vallée. Orages possibles chaque après-midi en été — partez avant 13h sur les crêtes.
          </Text>
        </View>

        {loading && (
          <View style={st.loadingRow}>
            <ActivityIndicator size="small" color="#264653" />
            <Text style={st.loadingTxt}>Chargement météo…</Text>
          </View>
        )}

        {meteoError !== '' && (
          <View style={st.errorRow}>
            <Text style={st.errorTxt}>{meteoError}</Text>
            <TouchableOpacity
              onPress={() => setForecasts((prev) => { const n = { ...prev }; delete n[locIdx]; return n; })}
              style={st.retryBtn}
            >
              <Text style={st.retryTxt}>Réessayer</Text>
            </TouchableOpacity>
          </View>
        )}

        {forecasts[locIdx] && !loading && (
          <View>
            <Text style={st.locTitle}>📍 {loc.label}</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={st.forecastRow}
            >
              {forecasts[locIdx].map((day) => (
                <ForecastCard key={day.date} day={day} />
              ))}
            </ScrollView>
            <Text style={st.sourceNote}>Source : Open-Meteo.com · Mise à jour automatique toutes les 3h</Text>
          </View>
        )}

        {/* ── URGENCES ──────────────────────────────────────────────────────── */}
        <SectionHeader title="🚨 URGENCES" />

        <View style={st.urgWarn}>
          <Text style={st.urgWarnTitle}>⚠️ En cas d'urgence en montagne</Text>
          <Text style={st.urgWarnText}>
            Restez calme. Donnez votre position précise (coordonnées GPS, nom du col, refuge). Protégez-vous du vent et du froid. Signalez-vous visuellement si possible.
          </Text>
        </View>

        {/* Big emergency buttons */}
        <View style={st.urgGrid}>
          <TouchableOpacity style={[st.urgBtn, { backgroundColor: '#E63946' }]} onPress={() => callPhone('112')} activeOpacity={0.8}>
            <Text style={st.urgNum}>112</Text>
            <Text style={st.urgSvc}>Urgences Européen</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[st.urgBtn, { backgroundColor: '#F4A261' }]} onPress={() => callPhone('15')} activeOpacity={0.8}>
            <Text style={st.urgNum}>15</Text>
            <Text style={st.urgSvc}>SAMU</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[st.urgBtn, { backgroundColor: '#264653' }]} onPress={() => callPhone('18')} activeOpacity={0.8}>
            <Text style={st.urgNum}>18</Text>
            <Text style={st.urgSvc}>Pompiers</Text>
          </TouchableOpacity>
        </View>

        {/* PGHM */}
        <Text style={st.subSectionTitle}>PGHM — Secours Montagne</Text>
        <Text style={st.subSectionSub}>Peloton de Gendarmerie de Haute Montagne</Text>
        {PGHM.map((p, i) => (
          <TouchableOpacity key={i} style={st.pghmCard} onPress={() => callPhone(p.numero)} activeOpacity={0.8}>
            <View style={st.pghmLeft}>
              <Text style={st.pghmRegion}>{p.region}</Text>
              <Text style={st.pghmService}>{p.service}</Text>
            </View>
            <View style={st.phoneChip}>
              <Text style={st.phoneChipTxt}>📞 {p.numero}</Text>
            </View>
          </TouchableOpacity>
        ))}

        {/* Safety tips */}
        <Text style={st.subSectionTitle}>Conseils de sécurité</Text>
        {SAFETY_TIPS.map((tip, i) => (
          <View key={i} style={st.tipRow}>
            <Text style={st.tipIcon}>{tip.icon}</Text>
            <View style={st.tipText}>
              <Text style={st.tipTitle}>{tip.titre}</Text>
              <Text style={st.tipDesc}>{tip.desc}</Text>
            </View>
          </View>
        ))}

        {/* ── À PROPOS ──────────────────────────────────────────────────────── */}
        <SectionHeader title="ℹ️ À PROPOS" />

        <View style={st.aboutCard}>
          <Text style={st.aboutLine}>GR10 · Hendaye → Banyuls-sur-Mer</Text>
          <Text style={st.aboutSub}>~900 km · 50 000 m D+</Text>
          <View style={st.aboutDivider} />
          <Text style={st.aboutItem}>📍 Données d'étapes : saisies manuellement</Text>
          <Text style={st.aboutItem}>🌤 Météo : Open-Meteo.com (libre & sans clé)</Text>
          <Text style={st.aboutItem}>🗺 Carte : OpenStreetMap contributors</Text>
          <Text style={st.aboutItem}>🔗 Sync : Supabase (stockage anonyme)</Text>
          <View style={st.aboutDivider} />
          <Text style={st.aboutVersion}>Expo ~54 · React Native 0.81</Text>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>

    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const st = StyleSheet.create({
  safe:               { flex: 1, backgroundColor: '#F1FAEE' },
  header:             { backgroundColor: '#264653', padding: 16 },
  headerTitle:        { color: '#fff', fontSize: 20, fontWeight: '700' },
  headerSub:          { color: '#A8DADC', fontSize: 13, marginTop: 2 },
  scroll:             { paddingBottom: 20 },

  sectionHeader:      { fontSize: 13, fontWeight: '800', color: '#264653', letterSpacing: 1, marginTop: 20, marginBottom: 10, paddingHorizontal: 16, paddingTop: 4 },

  // Météo
  chipBar:            { maxHeight: 44, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  chipBarContent:     { paddingHorizontal: 12, paddingVertical: 8, gap: 8, alignItems: 'center' },
  locChip:            { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 16, backgroundColor: '#F1FAEE' },
  locChipActive:      { backgroundColor: '#264653' },
  locChipTxt:         { fontSize: 12, color: '#555', fontWeight: '500' },
  locChipTxtActive:   { color: '#fff' },
  mountainAlert:      { marginHorizontal: 12, marginTop: 10, backgroundColor: '#FFF3CD', borderLeftWidth: 4, borderLeftColor: '#E9C46A', borderRadius: 8, padding: 12 },
  mountainAlertTitle: { fontSize: 13, fontWeight: '700', color: '#856404', marginBottom: 4 },
  mountainAlertText:  { fontSize: 12, color: '#664d03', lineHeight: 18 },
  loadingRow:         { flexDirection: 'row', alignItems: 'center', gap: 10, justifyContent: 'center', paddingVertical: 16 },
  loadingTxt:         { color: '#264653', fontSize: 13 },
  errorRow:           { marginHorizontal: 12, alignItems: 'center', gap: 10, paddingVertical: 12 },
  errorTxt:           { color: '#E63946', fontSize: 13, textAlign: 'center' },
  retryBtn:           { backgroundColor: '#264653', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  retryTxt:           { color: '#fff', fontWeight: '600', fontSize: 13 },
  locTitle:           { fontSize: 14, fontWeight: '700', color: '#264653', marginHorizontal: 12, marginTop: 10, marginBottom: 6 },
  forecastRow:        { paddingHorizontal: 12, gap: 8, paddingBottom: 4 },
  forecastCard:       { width: 82, backgroundColor: '#fff', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 6, alignItems: 'center', gap: 3, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  fcDay:              { fontSize: 11, fontWeight: '700', color: '#264653', textTransform: 'capitalize' },
  fcDayNum:           { fontSize: 11, color: '#888' },
  fcEmoji:            { fontSize: 24, marginVertical: 2 },
  fcTempMax:          { fontSize: 14, fontWeight: '700', color: '#E63946' },
  fcTempMin:          { fontSize: 12, color: '#2A9D8F' },
  fcRain:             { fontSize: 10, color: '#555' },
  fcWind:             { fontSize: 10, color: '#888' },
  sourceNote:         { fontSize: 10, color: '#aaa', textAlign: 'center', marginTop: 6, marginBottom: 2, paddingHorizontal: 12 },

  // Urgences
  urgWarn:            { marginHorizontal: 12, backgroundColor: '#FFF3CD', borderLeftWidth: 4, borderLeftColor: '#E9C46A', borderRadius: 8, padding: 12, marginBottom: 10 },
  urgWarnTitle:       { fontSize: 13, fontWeight: '700', color: '#856404', marginBottom: 4 },
  urgWarnText:        { fontSize: 12, color: '#664d03', lineHeight: 18 },
  urgGrid:            { flexDirection: 'row', marginHorizontal: 12, gap: 8, marginBottom: 14 },
  urgBtn:             { flex: 1, borderRadius: 12, paddingVertical: 16, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 6, elevation: 3 },
  urgNum:             { fontSize: 28, fontWeight: '800', color: '#fff' },
  urgSvc:             { fontSize: 10, color: 'rgba(255,255,255,0.85)', marginTop: 3, textAlign: 'center' },
  subSectionTitle:    { fontSize: 14, fontWeight: '700', color: '#264653', marginHorizontal: 12, marginBottom: 4, marginTop: 6 },
  subSectionSub:      { fontSize: 11, color: '#888', marginHorizontal: 12, marginBottom: 8, marginTop: -2 },
  pghmCard:           { flexDirection: 'row', alignItems: 'center', marginHorizontal: 12, marginBottom: 6, backgroundColor: '#fff', borderRadius: 10, padding: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  pghmLeft:           { flex: 1 },
  pghmRegion:         { fontSize: 13, fontWeight: '600', color: '#264653' },
  pghmService:        { fontSize: 11, color: '#888', marginTop: 2 },
  phoneChip:          { backgroundColor: '#264653', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6 },
  phoneChipTxt:       { color: '#fff', fontSize: 12, fontWeight: '600' },
  tipRow:             { flexDirection: 'row', gap: 12, marginHorizontal: 12, marginBottom: 6, backgroundColor: '#fff', borderRadius: 10, padding: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  tipIcon:            { fontSize: 20 },
  tipText:            { flex: 1 },
  tipTitle:           { fontSize: 13, fontWeight: '700', color: '#264653' },
  tipDesc:            { fontSize: 12, color: '#666', marginTop: 2, lineHeight: 17 },

  // À propos
  aboutCard:          { marginHorizontal: 12, backgroundColor: '#fff', borderRadius: 12, padding: 16, gap: 6, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  aboutLine:          { fontSize: 15, fontWeight: '700', color: '#264653' },
  aboutSub:           { fontSize: 13, color: '#2A9D8F', fontWeight: '600' },
  aboutDivider:       { height: 1, backgroundColor: '#eee', marginVertical: 4 },
  aboutItem:          { fontSize: 12, color: '#555', lineHeight: 20 },
  aboutVersion:       { fontSize: 11, color: '#aaa', fontStyle: 'italic' },
});
