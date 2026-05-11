import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { GR10_TRACE_SAMPLE, GR10_CENTER } from '../data/trace';
import { ETAPES } from '../data/etapes';
import { REFUGES } from '../data/refuges';
import { BIVOUACS } from '../data/bivouacs';
import {
  computeTilesForBbox,
  downloadTiles,
  clearTileCache,
  getTileCacheInfo,
} from '../utils/tileCache';

function useLeafletCSS() {
  useEffect(() => {
    if (document.getElementById('leaflet-css')) return;
    const link = document.createElement('link');
    link.id = 'leaflet-css';
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);
  }, []);
}

const etapeIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});
const refugeIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});
const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});
const bivouacIcon = new L.DivIcon({
  html: '<div style="font-size:20px;line-height:1;filter:drop-shadow(0 1px 2px rgba(0,0,0,.5))">⛺</div>',
  iconSize: [24, 24], iconAnchor: [12, 12], popupAnchor: [0, -14], className: '',
});

const COLORS = { trace: '#E63946', bg: '#F1FAEE' };

// ─── Download Panel ────────────────────────────────────────────────────────

type DlState = 'idle' | 'downloading' | 'done' | 'error';

function bboxForStages(fromIdx: number, toIdx: number) {
  const coords = ETAPES.slice(fromIdx, toIdx + 1).flatMap((e) => [e.coordDepart, e.coordArrivee]);
  const lats = coords.map((c) => c.lat);
  const lngs = coords.map((c) => c.lng);
  return {
    minLat: Math.min(...lats),
    maxLat: Math.max(...lats),
    minLng: Math.min(...lngs),
    maxLng: Math.max(...lngs),
  };
}

function DownloadPanel({ onClose }: { onClose: () => void }) {
  const [fromIdx, setFromIdx] = useState(0);
  const [toIdx, setToIdx] = useState(Math.min(3, ETAPES.length - 1));
  const [dlState, setDlState] = useState<DlState>('idle');
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [cachedCount, setCachedCount] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    getTileCacheInfo().then((info) => setCachedCount(info.count));
  }, [dlState]);

  const bbox = bboxForStages(fromIdx, toIdx);
  const tiles = computeTilesForBbox(bbox.minLat, bbox.maxLat, bbox.minLng, bbox.maxLng);
  const estimateMB = Math.round(tiles.length * 30 / 1024);

  async function startDownload() {
    abortRef.current = new AbortController();
    setDlState('downloading');
    setProgress({ done: 0, total: tiles.length });
    try {
      await downloadTiles(tiles, (done, total) => setProgress({ done, total }), abortRef.current.signal);
      setDlState('done');
    } catch {
      setDlState('error');
    }
  }

  function cancelDownload() {
    abortRef.current?.abort();
    setDlState('idle');
    setProgress({ done: 0, total: 0 });
  }

  async function handleClear() {
    await clearTileCache();
    setCachedCount(0);
    setDlState('idle');
    setProgress({ done: 0, total: 0 });
  }

  const pct = progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <View style={dlStyles.panel}>
      <View style={dlStyles.header}>
        <Text style={dlStyles.title}>📥 Carte hors-ligne</Text>
        <TouchableOpacity onPress={onClose} style={dlStyles.closeBtn}>
          <Text style={dlStyles.closeTxt}>✕</Text>
        </TouchableOpacity>
      </View>

      {cachedCount > 0 && (
        <View style={dlStyles.cacheInfo}>
          <Text style={dlStyles.cacheInfoTxt}>✅ {cachedCount} tuiles en cache</Text>
          <TouchableOpacity onPress={handleClear}>
            <Text style={dlStyles.clearTxt}>Supprimer</Text>
          </TouchableOpacity>
        </View>
      )}

      <Text style={dlStyles.sectionLabel}>Étapes à télécharger</Text>

      <View style={dlStyles.rangeRow}>
        <View style={dlStyles.rangeCol}>
          <Text style={dlStyles.rangeLabel}>De</Text>
          <View style={dlStyles.selectRow}>
            <TouchableOpacity
              style={dlStyles.arrowBtn}
              onPress={() => setFromIdx((v) => Math.max(0, v - 1))}
            >
              <Text style={dlStyles.arrowTxt}>‹</Text>
            </TouchableOpacity>
            <Text style={dlStyles.selectVal}>
              {ETAPES[fromIdx].numero}
            </Text>
            <TouchableOpacity
              style={dlStyles.arrowBtn}
              onPress={() => setFromIdx((v) => Math.min(toIdx, v + 1))}
            >
              <Text style={dlStyles.arrowTxt}>›</Text>
            </TouchableOpacity>
          </View>
          <Text style={dlStyles.selectSub} numberOfLines={1}>{ETAPES[fromIdx].depart}</Text>
        </View>

        <Text style={dlStyles.arrow}>→</Text>

        <View style={dlStyles.rangeCol}>
          <Text style={dlStyles.rangeLabel}>À</Text>
          <View style={dlStyles.selectRow}>
            <TouchableOpacity
              style={dlStyles.arrowBtn}
              onPress={() => setToIdx((v) => Math.max(fromIdx, v - 1))}
            >
              <Text style={dlStyles.arrowTxt}>‹</Text>
            </TouchableOpacity>
            <Text style={dlStyles.selectVal}>
              {ETAPES[toIdx].numero}
            </Text>
            <TouchableOpacity
              style={dlStyles.arrowBtn}
              onPress={() => setToIdx((v) => Math.min(ETAPES.length - 1, v + 1))}
            >
              <Text style={dlStyles.arrowTxt}>›</Text>
            </TouchableOpacity>
          </View>
          <Text style={dlStyles.selectSub} numberOfLines={1}>{ETAPES[toIdx].arrivee}</Text>
        </View>
      </View>

      <Text style={dlStyles.estimate}>
        ~{tiles.length} tuiles · ~{estimateMB} MB · zoom 11–14
      </Text>

      {dlState === 'downloading' && (
        <View style={dlStyles.progressBox}>
          <View style={dlStyles.progressBg}>
            <View style={[dlStyles.progressFill, { width: `${pct}%` as any }]} />
          </View>
          <Text style={dlStyles.progressTxt}>{progress.done}/{progress.total} ({pct}%)</Text>
          <TouchableOpacity style={dlStyles.cancelBtn} onPress={cancelDownload}>
            <Text style={dlStyles.cancelTxt}>Annuler</Text>
          </TouchableOpacity>
        </View>
      )}

      {dlState === 'done' && (
        <Text style={dlStyles.doneTxt}>✅ Téléchargement terminé !</Text>
      )}
      {dlState === 'error' && (
        <Text style={dlStyles.errorTxt}>❌ Erreur — réessayez en ligne</Text>
      )}

      {(dlState === 'idle' || dlState === 'done' || dlState === 'error') && (
        <TouchableOpacity style={dlStyles.dlBtn} onPress={startDownload}>
          <Text style={dlStyles.dlBtnTxt}>
            {dlState === 'done' ? '🔄 Mettre à jour' : '📥 Télécharger'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Main Map Screen ───────────────────────────────────────────────────────

export default function MapScreen() {
  useLeafletCSS();

  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState('');
  const [showRefuges, setShowRefuges] = useState(true);
  const [showBivouacs, setShowBivouacs] = useState(true);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showDlPanel, setShowDlPanel] = useState(false);

  useEffect(() => {
    const setOffline = () => setIsOffline(true);
    const setOnline = () => setIsOffline(false);
    window.addEventListener('offline', setOffline);
    window.addEventListener('online', setOnline);
    return () => {
      window.removeEventListener('offline', setOffline);
      window.removeEventListener('online', setOnline);
    };
  }, []);

  const traceCoords: [number, number][] = GR10_TRACE_SAMPLE.map(([lng, lat]) => [lat, lng]);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError('GPS non disponible');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setLocationError('Permission GPS refusée'),
      { enableHighAccuracy: false }
    );
  }, []);

  return (
    <View style={styles.container}>
      <MapContainer
        center={[GR10_CENTER.lat, GR10_CENTER.lng]}
        zoom={8}
        style={{ flex: 1, height: '100%', width: '100%' }}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.geoportail.gouv.fr">IGN-Géoportail</a>'
          url="https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2&STYLE=normal&FORMAT=image/png&TILEMATRIXSET=PM&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}"
          maxZoom={19}
        />
        <Polyline positions={traceCoords} color={COLORS.trace} weight={3} />

        {ETAPES.map((etape) => (
          <Marker key={`etape-${etape.id}`} position={[etape.coordDepart.lat, etape.coordDepart.lng]} icon={etapeIcon}>
            <Popup>
              <strong>Étape {etape.numero}</strong><br />
              {etape.depart} → {etape.arrivee}<br />
              {etape.distance} km · {etape.dureeEstimee}h
            </Popup>
          </Marker>
        ))}

        {showRefuges && REFUGES.map((refuge) => (
          <Marker key={`refuge-${refuge.id}`} position={[refuge.coordonnees.lat, refuge.coordonnees.lng]} icon={refugeIcon}>
            <Popup>
              <strong>{refuge.nom}</strong><br />
              {refuge.type} · {refuge.prixNuit}€/nuit · {refuge.capacite} places
              {refuge.telephone && <><br />📞 {refuge.telephone}</>}
            </Popup>
          </Marker>
        ))}

        {showBivouacs && BIVOUACS.map((biv) => (
          <Marker key={`biv-${biv.id}`} position={[biv.coordonnees.lat, biv.coordonnees.lng]} icon={bivouacIcon}>
            <Popup>
              <strong>⛺ {biv.nom}</strong><br />
              {biv.altitude}m · {biv.difficulteAcces}<br />
              💧 {biv.eau.split('.')[0]}
            </Popup>
          </Marker>
        ))}

        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
            <Popup>Ma position</Popup>
          </Marker>
        )}
      </MapContainer>

      {/* Légende */}
      <View style={styles.legend}>
        <View style={styles.legendRow}>
          <View style={[styles.legendDot, { backgroundColor: COLORS.trace }]} />
          <Text style={styles.legendText}>Tracé GR10</Text>
        </View>
        <View style={styles.legendRow}>
          <View style={[styles.legendDot, { backgroundColor: '#2A9D8F' }]} />
          <Text style={styles.legendText}>Étapes</Text>
        </View>
        <View style={styles.legendRow}>
          <View style={[styles.legendDot, { backgroundColor: '#FFB703' }]} />
          <Text style={styles.legendText}>Refuges</Text>
        </View>
        <View style={styles.legendRow}>
          <Text style={styles.legendEmoji}>⛺</Text>
          <Text style={styles.legendText}>Bivouacs</Text>
        </View>
      </View>

      {/* Contrôles */}
      <View style={styles.controls}>
        <TouchableOpacity style={styles.btn} onPress={() => setShowRefuges((v) => !v)}>
          <Text style={styles.btnText}>{showRefuges ? '🏠 Masquer' : '🏠 Refuges'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btn} onPress={() => setShowBivouacs((v) => !v)}>
          <Text style={styles.btnText}>{showBivouacs ? '⛺ Masquer' : '⛺ Bivouacs'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.btnDownload]} onPress={() => setShowDlPanel((v) => !v)}>
          <Text style={styles.btnText}>📥 Carte offline</Text>
        </TouchableOpacity>
      </View>

      {/* Panneau de téléchargement */}
      {showDlPanel && <DownloadPanel onClose={() => setShowDlPanel(false)} />}

      {isOffline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>📴 Mode hors-ligne · Tracé actif</Text>
        </View>
      )}

      {locationError !== '' && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{locationError}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  legend: {
    position: 'absolute', top: 12, left: 12, zIndex: 1000,
    backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 8, padding: 8, gap: 4,
  },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendEmoji: { fontSize: 12, width: 10, textAlign: 'center' },
  legendText: { fontSize: 12, color: '#264653' },
  controls: { position: 'absolute', bottom: 24, right: 12, zIndex: 1000, gap: 8 },
  btn: { backgroundColor: 'rgba(255,255,255,0.95)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  btnDownload: { borderWidth: 1, borderColor: '#264653' },
  btnText: { fontSize: 13, color: '#264653', fontWeight: '600' },
  offlineBanner: {
    position: 'absolute', top: 12, right: 12, zIndex: 1000,
    backgroundColor: '#264653', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8,
  },
  offlineText: { fontSize: 12, color: '#A8DADC', fontWeight: '600' },
  errorBanner: {
    position: 'absolute', bottom: 24, left: 12, zIndex: 1000,
    backgroundColor: '#FFB703', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8,
  },
  errorText: { fontSize: 12, color: '#264653', fontWeight: '600' },
});

const dlStyles = StyleSheet.create({
  panel: {
    position: 'absolute', bottom: 100, right: 12, zIndex: 2000,
    backgroundColor: '#fff', borderRadius: 12, padding: 16, width: 280,
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 12, elevation: 8,
    gap: 10,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 15, fontWeight: '700', color: '#264653' },
  closeBtn: { padding: 4 },
  closeTxt: { fontSize: 16, color: '#888' },
  cacheInfo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F1FAEE', borderRadius: 8, padding: 8 },
  cacheInfoTxt: { fontSize: 12, color: '#264653', fontWeight: '600' },
  clearTxt: { fontSize: 12, color: '#E63946', fontWeight: '600' },
  sectionLabel: { fontSize: 12, color: '#888', fontWeight: '600', textTransform: 'uppercase' },
  rangeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rangeCol: { flex: 1, alignItems: 'center', gap: 4 },
  rangeLabel: { fontSize: 11, color: '#888' },
  selectRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  arrowBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#F1FAEE', alignItems: 'center', justifyContent: 'center' },
  arrowTxt: { fontSize: 18, color: '#264653', lineHeight: 20 },
  selectVal: { fontSize: 18, fontWeight: '700', color: '#264653', minWidth: 36, textAlign: 'center' },
  selectSub: { fontSize: 11, color: '#888', maxWidth: 100, textAlign: 'center' },
  arrow: { fontSize: 16, color: '#888', marginTop: 10 },
  estimate: { fontSize: 12, color: '#555', textAlign: 'center', backgroundColor: '#F8F8F8', borderRadius: 6, padding: 8 },
  progressBox: { gap: 6 },
  progressBg: { height: 8, backgroundColor: '#eee', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: 8, backgroundColor: '#264653', borderRadius: 4 },
  progressTxt: { fontSize: 12, color: '#555', textAlign: 'center' },
  cancelBtn: { alignSelf: 'center' },
  cancelTxt: { fontSize: 12, color: '#E63946', fontWeight: '600' },
  doneTxt: { fontSize: 13, color: '#2A9D8F', fontWeight: '600', textAlign: 'center' },
  errorTxt: { fontSize: 13, color: '#E63946', fontWeight: '600', textAlign: 'center' },
  dlBtn: { backgroundColor: '#264653', borderRadius: 8, padding: 12, alignItems: 'center' },
  dlBtnTxt: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
