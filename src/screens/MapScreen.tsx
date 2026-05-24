import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import MapView, { Polyline, Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import * as Location from 'expo-location';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GR10_TRACE_SAMPLE, GR10_CENTER } from '../data/trace';
import { ETAPES } from '../data/etapes';
import { REFUGES } from '../data/refuges';
import { parseGpx, GpxPoint } from '../utils/gpxParser';

const STORAGE_KEY_GPX = '@gpx_track';

const COLORS = {
  trace: '#E63946',
  gpx: '#457B9D',
  marker: '#2A9D8F',
  userPos: '#264653',
  bg: '#F1FAEE',
};

export default function MapScreen() {
  const mapRef = useRef<MapView>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState('');
  const [showRefuges, setShowRefuges] = useState(true);
  const [loading, setLoading] = useState(true);
  const [gpxTrack, setGpxTrack] = useState<GpxPoint[]>([]);
  const [gpxName, setGpxName] = useState<string>('');
  const [gpxLoading, setGpxLoading] = useState(false);

  const traceCoords = GR10_TRACE_SAMPLE.map(([lng, lat]) => ({ latitude: lat, longitude: lng }));

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

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY_GPX);
        if (stored) {
          const { points, name } = JSON.parse(stored);
          setGpxTrack(points);
          setGpxName(name);
        }
      } catch {}
    })();
  }, []);

  const importGpx = async () => {
    try {
      setGpxLoading(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/gpx+xml', 'text/xml', 'application/xml', '*/*'],
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.length) {
        setGpxLoading(false);
        return;
      }
      const asset = result.assets[0];
      const response = await fetch(asset.uri);
      const content = await response.text();
      const points = parseGpx(content);
      if (points.length === 0) {
        Alert.alert('Fichier invalide', 'Aucun point trouvé dans ce fichier GPX.');
        setGpxLoading(false);
        return;
      }
      setGpxTrack(points);
      setGpxName(asset.name);
      await AsyncStorage.setItem(
        STORAGE_KEY_GPX,
        JSON.stringify({ points, name: asset.name })
      );
      // Center map on imported track
      const lats = points.map((p) => p.latitude);
      const lngs = points.map((p) => p.longitude);
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const minLng = Math.min(...lngs);
      const maxLng = Math.max(...lngs);
      mapRef.current?.animateToRegion({
        latitude: (minLat + maxLat) / 2,
        longitude: (minLng + maxLng) / 2,
        latitudeDelta: (maxLat - minLat) * 1.4 || 0.1,
        longitudeDelta: (maxLng - minLng) * 1.4 || 0.1,
      });
    } catch {
      Alert.alert('Erreur', 'Impossible de lire le fichier GPX.');
    }
    setGpxLoading(false);
  };

  const clearGpx = () => {
    Alert.alert('Supprimer l\'itinéraire', 'Voulez-vous supprimer l\'itinéraire importé ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          setGpxTrack([]);
          setGpxName('');
          await AsyncStorage.removeItem(STORAGE_KEY_GPX);
        },
      },
    ]);
  };

  const centerOnUser = () => {
    if (!userLocation || !mapRef.current) return;
    mapRef.current.animateToRegion({
      latitude: userLocation.lat,
      longitude: userLocation.lng,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    });
  };

  const centerOnTrace = () => {
    mapRef.current?.animateToRegion({
      latitude: GR10_CENTER.lat,
      longitude: GR10_CENTER.lng,
      latitudeDelta: 2.5,
      longitudeDelta: 2.5,
    });
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

        {/* Itinéraire GPX importé */}
        {gpxTrack.length > 0 && (
          <Polyline
            coordinates={gpxTrack}
            strokeColor={COLORS.gpx}
            strokeWidth={3}
          />
        )}

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
        {gpxTrack.length > 0 && (
          <View style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.gpx }]} />
            <Text style={styles.legendText} numberOfLines={1}>
              {gpxName || 'Mon itinéraire'}
            </Text>
          </View>
        )}
        <View style={styles.legendRow}>
          <View style={[styles.legendDot, { backgroundColor: COLORS.marker }]} />
          <Text style={styles.legendText}>Étapes</Text>
        </View>
        <View style={styles.legendRow}>
          <View style={[styles.legendDot, { backgroundColor: '#FFB703' }]} />
          <Text style={styles.legendText}>Refuges</Text>
        </View>
      </View>

      {/* Contrôles */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.btn}
          onPress={() => setShowRefuges((v) => !v)}
        >
          <Text style={styles.btnText}>{showRefuges ? '🏠 Masquer' : '🏠 Refuges'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btn} onPress={centerOnTrace}>
          <Text style={styles.btnText}>🗺 Vue globale</Text>
        </TouchableOpacity>
        {userLocation && (
          <TouchableOpacity style={[styles.btn, styles.btnAccent]} onPress={centerOnUser}>
            <Text style={[styles.btnText, { color: '#fff' }]}>📍 Ma position</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.btn, styles.btnGpx, gpxLoading && styles.btnDisabled]}
          onPress={importGpx}
          disabled={gpxLoading}
        >
          <Text style={[styles.btnText, { color: '#fff' }]}>
            {gpxLoading ? '⏳ Chargement…' : '📂 Importer GPX'}
          </Text>
        </TouchableOpacity>
        {gpxTrack.length > 0 && (
          <TouchableOpacity style={[styles.btn, styles.btnClearGpx]} onPress={clearGpx}>
            <Text style={[styles.btnText, { color: '#fff' }]}>✕ Supprimer GPX</Text>
          </TouchableOpacity>
        )}
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
  btnGpx: { backgroundColor: '#457B9D' },
  btnClearGpx: { backgroundColor: '#888' },
  btnDisabled: { opacity: 0.6 },
  btnText: { fontSize: 13, color: '#264653', fontWeight: '600' },
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
