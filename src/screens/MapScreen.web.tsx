import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { GR10_TRACE_SAMPLE, GR10_CENTER } from '../data/trace';
import { ETAPES } from '../data/etapes';
import { REFUGES } from '../data/refuges';

// Leaflet CSS injecté dynamiquement (évite les problèmes d'import CSS avec Metro)
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

// Icônes Leaflet via CDN (évite le bug des chemins d'images manquants)
const etapeIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const refugeIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const COLORS = {
  trace: '#E63946',
  bg: '#F1FAEE',
};

export default function MapScreen() {
  useLeafletCSS();

  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState('');
  const [showRefuges, setShowRefuges] = useState(true);

  // Leaflet attend [lat, lng], le tracé est stocké en [lng, lat]
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
        {/* IGN Plan V2 – Géoportail open data (sans clé API requise) */}
        <TileLayer
          attribution='&copy; <a href="https://www.geoportail.gouv.fr">IGN-Géoportail</a>'
          url="https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2&STYLE=normal&FORMAT=image/png&TILEMATRIXSET=PM&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}"
          maxZoom={19}
        />

        {/* Tracé GR10 */}
        <Polyline positions={traceCoords} color={COLORS.trace} weight={3} />

        {/* Marqueurs étapes */}
        {ETAPES.map((etape) => (
          <Marker
            key={`etape-${etape.id}`}
            position={[etape.coordDepart.lat, etape.coordDepart.lng]}
            icon={etapeIcon}
          >
            <Popup>
              <strong>Étape {etape.numero}</strong><br />
              {etape.depart} → {etape.arrivee}<br />
              {etape.distance} km · {etape.dureeEstimee}h
            </Popup>
          </Marker>
        ))}

        {/* Marqueurs refuges */}
        {showRefuges && REFUGES.map((refuge) => (
          <Marker
            key={`refuge-${refuge.id}`}
            position={[refuge.coordonnees.lat, refuge.coordonnees.lng]}
            icon={refugeIcon}
          >
            <Popup>
              <strong>{refuge.nom}</strong><br />
              {refuge.type} · {refuge.prixNuit}€/nuit · {refuge.capacite} places
              {refuge.telephone && <><br />📞 {refuge.telephone}</>}
            </Popup>
          </Marker>
        ))}

        {/* Position utilisateur */}
        {userLocation && (
          <Marker
            position={[userLocation.lat, userLocation.lng]}
            icon={userIcon}
          >
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
      </View>

      {/* Contrôles */}
      <View style={styles.controls}>
        <TouchableOpacity style={styles.btn} onPress={() => setShowRefuges((v) => !v)}>
          <Text style={styles.btnText}>{showRefuges ? '🏠 Masquer' : '🏠 Refuges'}</Text>
        </TouchableOpacity>
      </View>

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
    position: 'absolute',
    top: 12,
    left: 12,
    zIndex: 1000,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 8,
    padding: 8,
    gap: 4,
  },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12, color: '#264653' },
  controls: {
    position: 'absolute',
    bottom: 24,
    right: 12,
    zIndex: 1000,
    gap: 8,
  },
  btn: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  btnText: { fontSize: 13, color: '#264653', fontWeight: '600' },
  errorBanner: {
    position: 'absolute',
    bottom: 24,
    left: 12,
    zIndex: 1000,
    backgroundColor: '#FFB703',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  errorText: { fontSize: 12, color: '#264653', fontWeight: '600' },
});
