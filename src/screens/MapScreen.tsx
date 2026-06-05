import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import MapView, { Polyline, Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { useFocusEffect } from '@react-navigation/native';
import * as Location from 'expo-location';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { GR10_TRACE_SAMPLE, GR10_CENTER } from '../data/trace';
import { ETAPES } from '../data/etapes';
import { REFUGES } from '../data/refuges';
import { TREKS } from '../data/treks';
import { TREK_GPX } from '../data/trekGpx';
import { parseGpx } from '../utils/gpxParser';
import { useGpx } from '../context/GpxContext';

const COLORS = {
  trace: '#E63946',
  marker: '#2A9D8F',
  userPos: '#264653',
  bg: '#F1FAEE',
  gpx: '#8338EC',
};

// Calcule la région englobant un tableau de points [lat, lng]
function bboxRegion(pts: [number, number][], paddingFactor = 1.4) {
  const lats = pts.map(([lat]) => lat);
  const lngs = pts.map(([, lng]) => lng);
  const latD = (Math.max(...lats) - Math.min(...lats)) * paddingFactor || 0.08;
  const lngD = (Math.max(...lngs) - Math.min(...lngs)) * paddingFactor || 0.08;
  return {
    latitude:      (Math.min(...lats) + Math.max(...lats)) / 2,
    longitude:     (Math.min(...lngs) + Math.max(...lngs)) / 2,
    latitudeDelta:  latD,
    longitudeDelta: lngD,
  };
}

export default function MapScreen() {
  const mapRef = useRef<MapView>(null);
  const mapReady = useRef(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState('');
  const [showRefuges, setShowRefuges] = useState(true);
  const [loading, setLoading] = useState(true);
  const { gpxTrack, setGpxTrack, activeTrekId } = useGpx();

  const traceCoords = GR10_TRACE_SAMPLE.map(([lng, lat]) => ({ latitude: lat, longitude: lng }));

  // Trace du trek actif (mise en avant)
  const activeTrekTrace: [number, number][] | null = activeTrekId
    ? (TREK_GPX[activeTrekId] ?? null)
    : null;

  // GPX importé manuellement par l'utilisateur (overlay distinct)
  const userOverlay: [number, number][] | null = gpxTrack?.points ?? null;

  // Points à utiliser pour le zoom : trace active > GR10 > overlay
  const zoomPoints: [number, number][] | null = activeTrekTrace
    ?? (activeTrekId === 'gr10' ? GR10_TRACE_SAMPLE.map(([lng, lat]) => [lat, lng] as [number, number]) : null)
    ?? userOverlay;

  const zoomToTrek = useCallback(() => {
    if (!mapRef.current || !mapReady.current) return;
    if (zoomPoints && zoomPoints.length > 0) {
      mapRef.current.animateToRegion(bboxRegion(zoomPoints), 600);
    }
  }, [zoomPoints]);

  // Zoom dès que l'écran prend le focus
  useFocusEffect(useCallback(() => {
    // Petit délai pour laisser le temps à la carte de finir son rendu si elle vient de monter
    const t = setTimeout(zoomToTrek, 300);
    return () => clearTimeout(t);
  }, [zoomToTrek]));

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Permission GPS refusée');
        setLoading(false);
        return;
      }
      try {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setUserLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
      } catch {
        setLocationError('GPS indisponible');
      }
      setLoading(false);
    })();
  }, []);

  const centerOnUser = () => {
    if (!userLocation || !mapRef.current) return;
    mapRef.current.animateToRegion({
      latitude: userLocation.lat,
      longitude: userLocation.lng,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    });
  };

  const centerOnTrek = () => zoomToTrek();

  const importGpx = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/xml', 'application/gpx+xml', '*/*'],
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.[0]) return;
      const uri = result.assets[0].uri;
      const content = await FileSystem.readAsStringAsync(uri);
      const track = parseGpx(content);
      if (!track) {
        Alert.alert('Erreur', 'Fichier GPX invalide ou vide.');
        return;
      }
      setGpxTrack(track);
      if (track.points.length > 0) {
        const lats = track.points.map(([lat]) => lat);
        const lngs = track.points.map(([, lng]) => lng);
        const midLat = (Math.min(...lats) + Math.max(...lats)) / 2;
        const midLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
        mapRef.current?.animateToRegion({
          latitude: midLat,
          longitude: midLng,
          latitudeDelta: (Math.max(...lats) - Math.min(...lats)) * 1.4,
          longitudeDelta: (Math.max(...lngs) - Math.min(...lngs)) * 1.4,
        });
      }
    } catch {
      Alert.alert('Erreur', 'Impossible de lire le fichier.');
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={{
          latitude: GR10_CENTER.lat,
          longitude: GR10_CENTER.lng,
          latitudeDelta: 2.5,
          longitudeDelta: 2.5,
        }}
        onMapReady={() => { mapReady.current = true; zoomToTrek(); }}
        showsUserLocation={false}
        showsCompass
        showsScale
      >
        {/* Tracé GR10 */}
        <Polyline
          coordinates={traceCoords}
          strokeColor={COLORS.trace}
          strokeWidth={3}
        />

        {/* Toutes les traces TREK_GPX — grisées, sauf le trek actif en violet */}
        {Object.entries(TREK_GPX).map(([trekId, pts]) => {
          const isActive = trekId === activeTrekId;
          return (
            <Polyline
              key={`trek-${trekId}`}
              coordinates={pts.map(([lat, lng]) => ({ latitude: lat, longitude: lng }))}
              strokeColor={isActive ? COLORS.gpx : '#8338EC40'}
              strokeWidth={isActive ? 3.5 : 1.5}
            />
          );
        })}

        {/* Overlay GPX importé manuellement */}
        {userOverlay && (
          <Polyline
            coordinates={userOverlay.map(([lat, lng]) => ({ latitude: lat, longitude: lng }))}
            strokeColor="#E63946"
            strokeWidth={2.5}
            lineDashPattern={[8, 5]}
          />
        )}

        {/* Marqueurs étapes */}
        {ETAPES.map((etape) => (
          <Marker
            key={`etape-${etape.id}`}
            coordinate={{ latitude: etape.coordDepart.lat, longitude: etape.coordDepart.lng }}
            title={`Étape ${etape.numero}`}
            description={etape.depart}
            pinColor={COLORS.marker}
          />
        ))}

        {/* Marqueurs refuges */}
        {showRefuges &&
          REFUGES.map((refuge) => (
            <Marker
              key={`refuge-${refuge.id}`}
              coordinate={{ latitude: refuge.coordonnees.lat, longitude: refuge.coordonnees.lng }}
              title={refuge.nom}
              description={`${refuge.type} · ${refuge.prixNuit}€/nuit · ${refuge.capacite} places`}
              pinColor="#FFB703"
            />
          ))}

        {/* Position utilisateur */}
        {userLocation && (
          <Marker
            coordinate={{ latitude: userLocation.lat, longitude: userLocation.lng }}
            title="Ma position"
            pinColor={COLORS.userPos}
          />
        )}
      </MapView>

      {/* Légende */}
      <View style={styles.legend}>
        <View style={styles.legendRow}>
          <View style={[styles.legendDot, { backgroundColor: COLORS.trace }]} />
          <Text style={styles.legendText}>Tracé GR10</Text>
        </View>
        <View style={styles.legendRow}>
          <View style={[styles.legendDot, { backgroundColor: COLORS.marker }]} />
          <Text style={styles.legendText}>Étapes</Text>
        </View>
        <View style={styles.legendRow}>
          <View style={[styles.legendDot, { backgroundColor: '#FFB703' }]} />
          <Text style={styles.legendText}>Refuges</Text>
        </View>
        <View style={styles.legendRow}>
          <View style={[styles.legendDot, { backgroundColor: COLORS.gpx }]} />
          <Text style={[styles.legendText, { color: activeTrekId ? COLORS.gpx : '#aaa', fontWeight: '600' }]}>
            {activeTrekId ? 'Tracé trek' : 'Treks'}
          </Text>
        </View>
        {userOverlay && (
          <View style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: '#E63946' }]} />
            <Text style={[styles.legendText, { color: '#E63946', fontWeight: '600' }]}>GPX importé</Text>
          </View>
        )}
      </View>

      {/* Contrôles */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.btn}
          onPress={() => setShowRefuges((v) => !v)}
        >
          <Text style={styles.btnText}>{showRefuges ? '🏠 Masquer' : '🏠 Refuges'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btn} onPress={centerOnTrek}>
          <Text style={styles.btnText}>🗺 Vue trek</Text>
        </TouchableOpacity>
        {userLocation && (
          <TouchableOpacity style={[styles.btn, styles.btnAccent]} onPress={centerOnUser}>
            <Text style={[styles.btnText, { color: '#fff' }]}>📍 Ma position</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.btn, userOverlay ? styles.btnGpxActive : styles.btnGpx]}
          onPress={importGpx}
        >
          <Text style={[styles.btnText, userOverlay ? { color: COLORS.gpx } : {}]}>📂 {userOverlay ? 'GPX importé' : 'Importer GPX'}</Text>
        </TouchableOpacity>
        {userOverlay && gpxTrack && (
          <View style={styles.gpxInfo}>
            <Text style={styles.gpxInfoName} numberOfLines={1}>{gpxTrack.name}</Text>
            <Text style={styles.gpxInfoPoints}>{gpxTrack.points.length} pts</Text>
            <TouchableOpacity onPress={() => setGpxTrack(null)}>
              <Text style={styles.gpxClearBtn}>✕ Supprimer</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* DEBUG — à retirer après validation */}
      <View style={{ position: 'absolute', top: 60, left: 12, backgroundColor: 'rgba(0,0,0,0.7)', padding: 6, borderRadius: 6 }}>
        <Text style={{ color: '#fff', fontSize: 10 }}>activeTrekId: {activeTrekId ?? 'null'}</Text>
        <Text style={{ color: '#fff', fontSize: 10 }}>TREK_GPX keys: {Object.keys(TREK_GPX).join(', ')}</Text>
        <Text style={{ color: '#fff', fontSize: 10 }}>trace pts: {activeTrekId ? (TREK_GPX[activeTrekId]?.length ?? 0) : 0}</Text>
      </View>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color={COLORS.trace} />
          <Text style={styles.loadingText}>Localisation...</Text>
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
  map: { flex: 1 },
  legend: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 8,
    padding: 8,
    gap: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12, color: '#264653' },
  controls: {
    position: 'absolute',
    bottom: 24,
    right: 12,
    gap: 8,
  },
  btn: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  btnAccent: { backgroundColor: '#E63946' },
  btnGpx: { borderWidth: 1, borderColor: '#8338EC' },
  btnGpxActive: { borderWidth: 1.5, borderColor: '#8338EC', backgroundColor: '#F5F0FF' },
  btnText: { fontSize: 13, color: '#264653', fontWeight: '600' },
  gpxInfo: {
    backgroundColor: 'rgba(255,255,255,0.97)', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 8, gap: 3,
    borderLeftWidth: 3, borderLeftColor: '#8338EC',
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
  },
  gpxInfoName: { fontSize: 12, color: '#264653', fontWeight: '600', maxWidth: 140 },
  gpxInfoPoints: { fontSize: 11, color: '#888' },
  gpxClearBtn: { fontSize: 11, color: '#E63946', fontWeight: '600' },
  loadingOverlay: {
    position: 'absolute',
    bottom: 24,
    left: 12,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: { fontSize: 12, color: '#264653' },
  errorBanner: {
    position: 'absolute',
    bottom: 24,
    left: 12,
    backgroundColor: '#FFB703',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  errorText: { fontSize: 12, color: '#264653', fontWeight: '600' },
});
