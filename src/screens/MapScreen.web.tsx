import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
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
import { TREK_GPX } from '../data/trekGpx';
import { parseGpx } from '../utils/gpxParser';
import { useGpx } from '../context/GpxContext';

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

const COLORS = { trace: '#E63946', bg: '#F1FAEE', gpx: '#8338EC' };

const SYNC_DOT: Record<string, string> = {
  syncing: '#f59e0b',
  ok:      '#22c55e',
  error:   '#ef4444',
};
const SYNC_LABEL: Record<string, string> = {
  syncing: '↑ Sync…',
  ok:      '✓ Sauvegardé',
  error:   '⚠ Erreur sync',
};

function FitBoundsToGpx({ points }: { points: Array<[number, number]> | null }) {
  const map = useMap();
  useEffect(() => {
    if (!points || points.length === 0) return;
    const bounds = L.latLngBounds(points);
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [points, map]);
  return null;
}

function LocateButton({ userLocation }: { userLocation: { lat: number; lng: number } | null }) {
  const map = useMap();
  function handleLocate() {
    if (userLocation) {
      map.flyTo([userLocation.lat, userLocation.lng], 14, { duration: 1 });
      return;
    }
    navigator.geolocation?.getCurrentPosition(
      (pos) => map.flyTo([pos.coords.latitude, pos.coords.longitude], 14, { duration: 1 }),
      () => {},
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }
  return (
    <div
      onClick={handleLocate}
      title="Ma position"
      style={{
        position: 'absolute', bottom: 90, right: 10, zIndex: 1000,
        width: 40, height: 40, borderRadius: 8,
        backgroundColor: 'rgba(255,255,255,0.95)',
        boxShadow: '0 1px 5px rgba(0,0,0,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', fontSize: 20, userSelect: 'none',
      }}
    >
      📍
    </div>
  );
}

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
  const { gpxTrack, setGpxTrack, syncStatus, activeTrekId } = useGpx();
  const [gpxError, setGpxError] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  useEffect(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.gpx,application/gpx+xml,text/xml';
    input.style.display = 'none';
    const handleChange = (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const content = ev.target?.result as string;
        const track = parseGpx(content);
        if (track) {
          setGpxTrack(track);
          setGpxError('');
        } else {
          setGpxError('Fichier GPX invalide ou vide');
          setTimeout(() => setGpxError(''), 3000);
        }
      };
      reader.readAsText(file);
      (e.target as HTMLInputElement).value = '';
    };
    input.addEventListener('change', handleChange);
    document.body.appendChild(input);
    fileInputRef.current = input;
    return () => {
      input.removeEventListener('change', handleChange);
      if (document.body.contains(input)) document.body.removeChild(input);
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

        {/* Toutes les traces de trek — pâles, sauf le trek actif en violet vif */}
        {Object.entries(TREK_GPX).map(([trekId, pts]) => {
          const isActive = trekId === activeTrekId;
          return (
            <Polyline
              key={`trek-${trekId}`}
              positions={pts}
              color={COLORS.gpx}
              weight={isActive ? 3.5 : 1.5}
              opacity={isActive ? 1 : 0.25}
            />
          );
        })}

        {activeTrekId && TREK_GPX[activeTrekId] && (
          <FitBoundsToGpx points={TREK_GPX[activeTrekId]} />
        )}

        {gpxTrack && (
          <>
            <Polyline
              positions={gpxTrack.points}
              color={COLORS.gpx}
              weight={3}
              dashArray="8,5"
              opacity={0.9}
            />
            {!activeTrekId && <FitBoundsToGpx points={gpxTrack.points} />}
          </>
        )}

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

        <LocateButton userLocation={userLocation} />
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
        <View style={styles.legendRow}>
          <View style={[styles.legendDot, { backgroundColor: COLORS.gpx, opacity: activeTrekId ? 1 : 0.4 }]} />
          <Text style={[styles.legendText, { color: activeTrekId ? COLORS.gpx : '#aaa', fontWeight: '600' }]}>
            {activeTrekId ? 'Trek actif' : 'Treks'}
          </Text>
        </View>
        {gpxTrack && (
          <View style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.gpx }]} />
            <Text style={[styles.legendText, { color: COLORS.gpx, fontWeight: '600' }]}>
              GPX importé
            </Text>
          </View>
        )}
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
        <TouchableOpacity
          style={[styles.btn, gpxTrack ? styles.btnGpxActive : styles.btnGpx]}
          onPress={() => fileInputRef.current?.click()}
        >
          <Text style={[styles.btnText, gpxTrack && { color: COLORS.gpx }]}>📂 Importer GPX</Text>
        </TouchableOpacity>
        {gpxTrack && (
          <View style={styles.gpxInfo}>
            <Text style={styles.gpxInfoName} numberOfLines={1}>{gpxTrack.name}</Text>
            <Text style={styles.gpxInfoPoints}>{gpxTrack.points.length} pts</Text>
            {syncStatus !== 'idle' && (
              <View style={styles.gpxSyncRow}>
                <View style={[styles.gpxSyncDot, { backgroundColor: SYNC_DOT[syncStatus] }]} />
                <Text style={[styles.gpxSyncText, { color: SYNC_DOT[syncStatus] }]}>
                  {SYNC_LABEL[syncStatus]}
                </Text>
              </View>
            )}
            <TouchableOpacity onPress={() => setGpxTrack(null)}>
              <Text style={styles.gpxClearBtn}>✕ Supprimer</Text>
            </TouchableOpacity>
          </View>
        )}
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

      {gpxError !== '' && (
        <View style={styles.gpxErrorBanner}>
          <Text style={styles.gpxErrorText}>{gpxError}</Text>
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
  btnGpx: { borderWidth: 1, borderColor: '#8338EC' },
  btnGpxActive: { borderWidth: 1.5, borderColor: '#8338EC', backgroundColor: '#F5F0FF' },
  gpxInfo: {
    backgroundColor: 'rgba(255,255,255,0.97)', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 8, gap: 3,
    borderLeftWidth: 3, borderLeftColor: '#8338EC',
  },
  gpxInfoName: { fontSize: 12, color: '#264653', fontWeight: '600', maxWidth: 140 },
  gpxInfoPoints: { fontSize: 11, color: '#888' },
  gpxSyncRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  gpxSyncDot: { width: 6, height: 6, borderRadius: 3 },
  gpxSyncText: { fontSize: 10, fontWeight: '600' },
  gpxClearBtn: { fontSize: 11, color: '#E63946', fontWeight: '600' },
  gpxErrorBanner: {
    position: 'absolute', bottom: 60, left: 12, zIndex: 1000,
    backgroundColor: '#8338EC', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8,
  },
  gpxErrorText: { fontSize: 12, color: '#fff', fontWeight: '600' },
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
