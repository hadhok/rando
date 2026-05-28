import React, { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Linking,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { BIVOUACS, Bivouac } from '../data/bivouacs';
import { ETAPES } from '../data/etapes';
import { REFUGES, Refuge } from '../data/refuges';
import { isNearTrace, useGpx } from '../context/GpxContext';
import { useTrek } from '../context/TrekContext';

// ─── Palette ──────────────────────────────────────────────────────────────────

const C = {
  primary: '#264653',
  teal: '#2A9D8F',
  red: '#E63946',
  light: '#F1FAEE',
  gold: '#E9C46A',
  orange: '#F4A261',
  purple: '#8338EC',
  green: '#52B788',
};

// ─── Unified Spot type ────────────────────────────────────────────────────────

type SpotType = 'refuge' | 'gite' | 'camping' | 'village' | 'bivouac';

interface Spot {
  id: number;
  spotType: SpotType;
  nom: string;
  etapeId: number;
  altitude: number;
  coordonnees: { lat: number; lng: number };
  // refuge-specific
  prixNuit?: number;
  capacite?: number;
  telephone?: string;
  reservation?: boolean;
  gardien?: boolean;
  eau?: boolean;
  ravitaillement?: boolean;
  notes?: string;
  // bivouac-specific
  difficulteAcces?: 'facile' | 'moyen' | 'difficile';
  description?: string;
  conseils?: string;
  panorama?: string;
  eau_txt?: string;
  ravitaillement_txt?: string;
}

// ─── Type metadata ────────────────────────────────────────────────────────────

const TYPE_ICON: Record<SpotType, string> = {
  refuge: '⛺',
  gite: '🏠',
  camping: '🏕',
  village: '🏘',
  bivouac: '⛺',
};

const TYPE_COLOR: Record<SpotType, string> = {
  refuge: C.red,
  gite: C.teal,
  camping: C.green,
  village: C.primary,
  bivouac: C.orange,
};

const TYPE_LABEL: Record<SpotType, string> = {
  refuge: 'Refuge',
  gite: 'Gîte',
  camping: 'Camping',
  village: 'Village',
  bivouac: 'Bivouac',
};

const DIFF_COLOR: Record<string, string> = {
  facile: C.teal,
  moyen: C.gold,
  difficile: C.red,
};

const DIFF_LABEL: Record<string, string> = {
  facile: 'Accès facile',
  moyen: 'Accès moyen',
  difficile: 'Accès difficile',
};

// ─── Mapping helpers ──────────────────────────────────────────────────────────

function refugeToSpot(r: Refuge): Spot {
  return {
    id: r.id,
    spotType: r.type as SpotType,
    nom: r.nom,
    etapeId: r.etapeId,
    altitude: r.altitude,
    coordonnees: r.coordonnees,
    prixNuit: r.prixNuit,
    capacite: r.capacite,
    telephone: r.telephone,
    reservation: r.reservation,
    gardien: r.gardien,
    eau: r.eau,
    ravitaillement: r.ravitaillement,
    notes: r.notes,
  };
}

function bivouacToSpot(b: Bivouac): Spot {
  return {
    id: b.id + 10000, // avoid id collisions
    spotType: 'bivouac',
    nom: b.nom,
    etapeId: b.etapeId,
    altitude: b.altitude,
    coordonnees: b.coordonnees,
    difficulteAcces: b.difficulteAcces,
    description: b.description,
    conseils: b.conseils,
    panorama: b.panorama,
    eau_txt: b.eau,
    ravitaillement_txt: b.ravitaillement,
  };
}

// ─── Filter bar ───────────────────────────────────────────────────────────────

type FilterType = 'tous' | SpotType;

const FILTERS: { key: FilterType; label: string }[] = [
  { key: 'tous', label: 'Tous' },
  { key: 'refuge', label: '⛺ Refuges' },
  { key: 'gite', label: '🏠 Gîtes' },
  { key: 'camping', label: '🏕 Campings' },
  { key: 'bivouac', label: '⛺ Bivouacs' },
];

// ─── Pill ─────────────────────────────────────────────────────────────────────

function Pill({ label, color, filled }: { label: string; color: string; filled?: boolean }) {
  if (filled) {
    return (
      <View style={[styles.pillFilled, { backgroundColor: color }]}>
        <Text style={styles.pillFilledText}>{label}</Text>
      </View>
    );
  }
  return (
    <View style={[styles.pill, { borderColor: color }]}>
      <Text style={[styles.pillText, { color }]}>{label}</Text>
    </View>
  );
}

// ─── InfoRow ──────────────────────────────────────────────────────────────────

function InfoRow({
  icon,
  label,
  value,
  valueColor,
  last,
}: {
  icon: string;
  label: string;
  value: string;
  valueColor?: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.infoRow, last && styles.infoRowLast]}>
      <Text style={styles.infoIcon}>{icon}</Text>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, valueColor ? { color: valueColor } : undefined]}>
        {value}
      </Text>
    </View>
  );
}

// ─── DetailSection ────────────────────────────────────────────────────────────

function DetailSection({
  icon,
  title,
  content,
}: {
  icon: string;
  title: string;
  content: string;
}) {
  return (
    <View style={styles.detailSection}>
      <View style={styles.detailSectionHeader}>
        <Text style={styles.detailSectionIcon}>{icon}</Text>
        <Text style={styles.detailSectionTitle}>{title}</Text>
      </View>
      <Text style={styles.detailSectionContent}>{content}</Text>
    </View>
  );
}

// ─── SpotCard ─────────────────────────────────────────────────────────────────

function SpotCard({ spot, onPress }: { spot: Spot; onPress: () => void }) {
  const etape = ETAPES.find((e) => e.id === spot.etapeId);
  const color = TYPE_COLOR[spot.spotType];
  const icon = TYPE_ICON[spot.spotType];

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.78}>
      <View style={styles.cardRow}>
        {/* Left badge */}
        <View style={[styles.typeBadge, { backgroundColor: color }]}>
          <Text style={styles.typeBadgeIcon}>{icon}</Text>
        </View>

        {/* Center content */}
        <View style={styles.cardContent}>
          <Text style={styles.cardNom} numberOfLines={2}>
            {spot.nom}
          </Text>
          {etape && (
            <Text style={styles.cardEtape}>
              Étape {etape.numero} · {etape.nom}
            </Text>
          )}

          {/* Pills row */}
          <View style={styles.pillsRow}>
            {/* Refuge: price */}
            {spot.prixNuit !== undefined && (
              <Pill label={`${spot.prixNuit} €`} color={C.primary} />
            )}
            {/* Bivouac: difficulty */}
            {spot.difficulteAcces && (
              <Pill
                label={DIFF_LABEL[spot.difficulteAcces]}
                color={DIFF_COLOR[spot.difficulteAcces]}
                filled
              />
            )}
            {/* Altitude */}
            {spot.altitude > 0 && (
              <Pill label={`${spot.altitude} m`} color="#777" />
            )}
            {/* Capacity */}
            {spot.capacite !== undefined && (
              <Pill label={`${spot.capacite} places`} color="#555" />
            )}
            {/* Reservation */}
            {spot.reservation === true && (
              <Pill label="Résa requise" color={C.red} />
            )}
          </View>
        </View>

        {/* Chevron */}
        <Text style={styles.chevron}>›</Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── SpotDetailModal ──────────────────────────────────────────────────────────

function SpotDetailModal({ spot, onClose }: { spot: Spot; onClose: () => void }) {
  const { trekPlan, updateJour } = useTrek();
  const etape = ETAPES.find((e) => e.id === spot.etapeId);
  const color = TYPE_COLOR[spot.spotType];
  const icon = TYPE_ICON[spot.spotType];
  const isBivouac = spot.spotType === 'bivouac';

  // Find matching trek jour
  const trekJour = trekPlan?.jours.find((j) => j.etapeId === spot.etapeId);
  const jourIndex = trekPlan?.jours.findIndex((j) => j.etapeId === spot.etapeId) ?? -1;

  function handleAssign() {
    if (!trekJour) return;
    const hebergType = isBivouac ? 'bivouac' : (spot.spotType as any);
    const realId = isBivouac ? spot.id - 10000 : spot.id;
    updateJour(spot.etapeId, {
      hebergement: {
        type: hebergType,
        id: realId,
        nom: spot.nom,
        confirmed: true,
      },
    });
    Alert.alert('Trek mis à jour', `${spot.nom} assigné au jour ${jourIndex + 1}.`);
  }

  function formatDate(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
  }

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modal}>
        {/* Modal header */}
        <View style={[styles.modalHeader, { backgroundColor: color }]}>
          <View style={styles.modalHeaderLeft}>
            <View style={styles.modalIconCircle}>
              <Text style={styles.modalIconText}>{icon}</Text>
            </View>
            <View style={styles.modalTitleBlock}>
              <Text style={styles.modalTypeLabel}>{TYPE_LABEL[spot.spotType]}</Text>
              <Text style={styles.modalTitle} numberOfLines={2}>
                {spot.nom}
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={false}>
          {/* Étape reference */}
          {etape && (
            <View style={styles.etapeRef}>
              <Text style={styles.etapeRefText}>
                📍 Étape {etape.numero} — {etape.nom}
              </Text>
              <Text style={styles.etapeRefSub}>
                {etape.depart} → {etape.arrivee}
              </Text>
            </View>
          )}

          {/* ── REFUGE details ── */}
          {!isBivouac && (
            <>
              <View style={styles.infoGrid}>
                {spot.prixNuit !== undefined && (
                  <InfoRow icon="💰" label="Prix nuit" value={`${spot.prixNuit} €`} />
                )}
                {spot.capacite !== undefined && (
                  <InfoRow icon="🛏" label="Capacité" value={`${spot.capacite} places`} />
                )}
                <InfoRow icon="🏔" label="Altitude" value={`${spot.altitude} m`} />
                {spot.reservation !== undefined && (
                  <InfoRow
                    icon="🗓"
                    label="Réservation"
                    value={spot.reservation ? 'Obligatoire' : 'Non requise'}
                    valueColor={spot.reservation ? C.red : C.teal}
                  />
                )}
                {spot.gardien !== undefined && (
                  <InfoRow
                    icon="👤"
                    label="Gardien"
                    value={spot.gardien ? 'Oui' : 'Non gardé'}
                    valueColor={spot.gardien ? C.teal : C.orange}
                  />
                )}
                {spot.eau !== undefined && (
                  <InfoRow
                    icon="💧"
                    label="Eau potable"
                    value={spot.eau ? 'Disponible' : 'Non disponible'}
                    valueColor={spot.eau ? C.teal : C.red}
                  />
                )}
                {spot.ravitaillement !== undefined && (
                  <InfoRow
                    icon="🛒"
                    label="Ravitaillement"
                    value={spot.ravitaillement ? 'Disponible' : 'Non disponible'}
                    valueColor={spot.ravitaillement ? C.teal : '#888'}
                    last
                  />
                )}
              </View>

              {spot.notes && (
                <View style={styles.notesBox}>
                  <Text style={styles.notesTitle}>📝 Notes</Text>
                  <Text style={styles.notesText}>{spot.notes}</Text>
                </View>
              )}
            </>
          )}

          {/* ── BIVOUAC details ── */}
          {isBivouac && (
            <>
              {/* Altitude + difficulty badges */}
              <View style={styles.badgeRow}>
                <View style={styles.altBadge}>
                  <Text style={styles.altBadgeText}>⛰ {spot.altitude} m</Text>
                </View>
                {spot.difficulteAcces && (
                  <View style={[styles.diffBadge, { backgroundColor: DIFF_COLOR[spot.difficulteAcces] }]}>
                    <Text style={styles.diffBadgeText}>{DIFF_LABEL[spot.difficulteAcces]}</Text>
                  </View>
                )}
              </View>

              {/* Panorama */}
              {spot.panorama && (
                <View style={styles.panoramaBox}>
                  <Text style={styles.panoramaLabel}>🌄 Panorama</Text>
                  <Text style={styles.panoramaText}>{spot.panorama}</Text>
                </View>
              )}

              {/* Description */}
              {spot.description && (
                <>
                  <Text style={styles.sectionTitle}>Description</Text>
                  <Text style={styles.descriptionText}>{spot.description}</Text>
                </>
              )}

              {/* Infos pratiques */}
              <Text style={styles.sectionTitle}>Infos pratiques</Text>
              <View style={styles.detailCard}>
                {spot.eau_txt && (
                  <DetailSection icon="💧" title="Points d'eau" content={spot.eau_txt} />
                )}
                {spot.ravitaillement_txt && (
                  <>
                    <View style={styles.detailSeparator} />
                    <DetailSection icon="🛒" title="Ravitaillement" content={spot.ravitaillement_txt} />
                  </>
                )}
                {spot.conseils && (
                  <>
                    <View style={styles.detailSeparator} />
                    <DetailSection icon="💡" title="Conseils" content={spot.conseils} />
                  </>
                )}
              </View>

              {/* Règles bivouac */}
              <View style={styles.rulesBox}>
                <Text style={styles.rulesTitle}>📋 Règles du bivouac en montagne</Text>
                <Text style={styles.rulesText}>
                  {'• Arrivée après 19h, départ avant 9h\n'}
                  {'• Interdit dans les zones cœur de Parc National\n'}
                  {'• 1 nuit maximum au même emplacement\n'}
                  {'• Feux de camp interdits (sauf zone dédiée)\n'}
                  {'• Déchets : tout remporter, laisser propre'}
                </Text>
              </View>
            </>
          )}

          {/* ── Phone button ── */}
          {spot.telephone && (
            <TouchableOpacity
              style={styles.phoneBtn}
              onPress={() =>
                Linking.openURL(`tel:${spot.telephone}`).catch(() =>
                  Alert.alert('Erreur', "Impossible d'ouvrir le téléphone"),
                )
              }
            >
              <Text style={styles.phoneBtnText}>📞 Appeler · {spot.telephone}</Text>
            </TouchableOpacity>
          )}

          {/* ── Add to trek ── */}
          {trekPlan && trekJour && (
            <View style={styles.trekBox}>
              <Text style={styles.trekBoxTitle}>🗺 Ajouter au trek</Text>
              <Text style={styles.trekBoxSub}>
                Ce spot correspond à votre Jour {jourIndex + 1}
              </Text>
              <TouchableOpacity style={styles.trekAssignBtn} onPress={handleAssign}>
                <Text style={styles.trekAssignBtnText}>
                  Assigner à Jour {jourIndex + 1} · {formatDate(trekJour.date)}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function SpotsScreen() {
  const { traceBbox } = useGpx();
  const [filterType, setFilterType] = useState<FilterType>('tous');
  const [searchText, setSearchText] = useState('');
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);

  // Build unified list sorted by etapeId then type (refuges before bivouacs)
  const allSpots = useMemo<Spot[]>(() => {
    const refugeSpots = REFUGES.map(refugeToSpot);
    const bivouacSpots = BIVOUACS.map(bivouacToSpot);
    return [...refugeSpots, ...bivouacSpots].sort((a, b) => {
      if (a.etapeId !== b.etapeId) return a.etapeId - b.etapeId;
      // bivouacs last within same etape
      const aIsBiv = a.spotType === 'bivouac' ? 1 : 0;
      const bIsBiv = b.spotType === 'bivouac' ? 1 : 0;
      return aIsBiv - bIsBiv;
    });
  }, []);

  const filtered = useMemo<Spot[]>(() => {
    return allSpots
      .filter((s) => filterType === 'tous' || s.spotType === filterType)
      .filter(
        (s) =>
          !searchText || s.nom.toLowerCase().includes(searchText.toLowerCase()),
      )
      .filter(
        (s) =>
          !traceBbox ||
          isNearTrace(s.coordonnees.lat, s.coordonnees.lng, traceBbox),
      );
  }, [allSpots, filterType, searchText, traceBbox]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📍 Points d'intérêt</Text>
        <Text style={styles.headerSub}>
          {filtered.length} spots
          {traceBbox ? ' · (filtrés par trace)' : ''}
          {traceBbox && ' 🟣'}
        </Text>
      </View>

      {/* Trace filter banner */}
      {traceBbox && (
        <View style={styles.traceBanner}>
          <Text style={styles.traceBannerText}>
            🟣 Filtrés par trace GPX importée
          </Text>
        </View>
      )}

      {/* Filter bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterBarScroll}
        contentContainerStyle={styles.filterBarContent}
      >
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[
              styles.filterChip,
              filterType === f.key && styles.filterChipActive,
            ]}
            onPress={() => setFilterType(f.key)}
          >
            <Text
              style={[
                styles.filterChipText,
                filterType === f.key && styles.filterChipTextActive,
              ]}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Search bar */}
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un spot…"
          placeholderTextColor="#aaa"
          value={searchText}
          onChangeText={setSearchText}
          clearButtonMode="while-editing"
          returnKeyType="search"
        />
        {searchText.length > 0 && (
          <TouchableOpacity onPress={() => setSearchText('')} style={styles.searchClear}>
            <Text style={styles.searchClearText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => `${item.spotType}-${item.id}`}
        renderItem={({ item }) => (
          <SpotCard spot={item} onPress={() => setSelectedSpot(item)} />
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🏔</Text>
            <Text style={styles.emptyTitle}>Aucun spot trouvé</Text>
            <Text style={styles.emptyMsg}>
              {traceBbox
                ? 'Aucun spot proche de votre trace pour ces filtres.'
                : 'Essayez un autre filtre ou terme de recherche.'}
            </Text>
          </View>
        }
      />

      {/* Detail modal */}
      {selectedSpot && (
        <SpotDetailModal
          spot={selectedSpot}
          onClose={() => setSelectedSpot(null)}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.light },

  // Header
  header: {
    backgroundColor: C.primary,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '700' },
  headerSub: { color: '#A8DADC', fontSize: 13, marginTop: 2 },

  // Trace banner
  traceBanner: {
    backgroundColor: '#EDE9FE',
    borderBottomWidth: 1,
    borderBottomColor: '#C4B5FD',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  traceBannerText: { fontSize: 12, color: '#5B21B6', fontWeight: '600' },

  // Filter bar
  filterBarScroll: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexGrow: 0,
  },
  filterBarContent: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    flexDirection: 'row',
  },
  filterChip: {
    paddingHorizontal: 13,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: C.light,
  },
  filterChipActive: { backgroundColor: C.primary },
  filterChipText: { fontSize: 12, color: '#555', fontWeight: '500' },
  filterChipTextActive: { color: '#fff' },

  // Search bar
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginTop: 10,
    marginBottom: 2,
    borderRadius: 10,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    height: 40,
  },
  searchIcon: { fontSize: 14, marginRight: 6 },
  searchInput: { flex: 1, fontSize: 14, color: '#264653', paddingVertical: 0 },
  searchClear: { padding: 4 },
  searchClearText: { fontSize: 12, color: '#aaa' },

  // List
  list: { padding: 12, paddingTop: 8, gap: 10 },

  // Card
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardRow: { flexDirection: 'row', alignItems: 'flex-start' },
  typeBadge: {
    width: 40,
    height: 40,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  typeBadgeIcon: { fontSize: 19 },
  cardContent: { flex: 1 },
  cardNom: { fontSize: 14, fontWeight: '700', color: C.primary, lineHeight: 20 },
  cardEtape: { fontSize: 11, color: '#888', marginTop: 3, marginBottom: 7 },
  pillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  chevron: {
    fontSize: 22,
    color: '#ccc',
    alignSelf: 'center',
    marginLeft: 8,
    fontWeight: '300',
  },

  // Pills
  pill: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  pillText: { fontSize: 11, fontWeight: '500' },
  pillFilled: {
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  pillFilledText: { fontSize: 11, fontWeight: '600', color: '#fff' },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 32,
    gap: 8,
  },
  emptyIcon: { fontSize: 40 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: C.primary },
  emptyMsg: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
    lineHeight: 20,
  },

  // ── Modal ──
  modal: { flex: 1, backgroundColor: C.light },

  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  modalHeaderLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
  modalIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalIconText: { fontSize: 22 },
  modalTitleBlock: { flex: 1 },
  modalTypeLabel: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  modalTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginTop: 1 },
  closeBtn: { marginLeft: 8 },
  closeBtnText: { color: 'rgba(255,255,255,0.8)', fontSize: 20, fontWeight: '300' },

  modalContent: { padding: 20, gap: 16 },

  // Étape ref
  etapeRef: {
    backgroundColor: C.primary,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 3,
  },
  etapeRefText: { color: '#A8DADC', fontSize: 13, fontWeight: '600' },
  etapeRefSub: { color: 'rgba(168,218,220,0.7)', fontSize: 11 },

  // Info grid (refuges)
  infoGrid: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#f2f2f2',
    gap: 10,
  },
  infoRowLast: { borderBottomWidth: 0 },
  infoIcon: { fontSize: 16, width: 22 },
  infoLabel: { flex: 1, fontSize: 14, color: '#555' },
  infoValue: { fontSize: 14, fontWeight: '600', color: C.primary },

  // Notes box
  notesBox: {
    backgroundColor: '#FFF8E1',
    borderRadius: 10,
    padding: 14,
    gap: 6,
  },
  notesTitle: { fontSize: 13, fontWeight: '700', color: C.orange },
  notesText: { fontSize: 13, color: '#555', lineHeight: 20 },

  // Bivouac — badge row
  badgeRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  altBadge: {
    backgroundColor: C.primary,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
  },
  altBadgeText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  diffBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 14 },
  diffBadgeText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  // Panorama
  panoramaBox: {
    backgroundColor: C.primary,
    borderRadius: 10,
    padding: 14,
    gap: 6,
  },
  panoramaLabel: { color: '#A8DADC', fontSize: 12, fontWeight: '600' },
  panoramaText: { color: '#fff', fontSize: 14, lineHeight: 21, fontStyle: 'italic' },

  sectionTitle: { fontSize: 15, fontWeight: '700', color: C.primary },
  descriptionText: { fontSize: 14, color: '#555', lineHeight: 22, marginTop: -8 },

  // Detail card (bivouac infos)
  detailCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
    marginTop: -8,
  },
  detailSection: { padding: 14, gap: 6 },
  detailSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailSectionIcon: { fontSize: 15 },
  detailSectionTitle: { fontSize: 13, fontWeight: '700', color: C.primary },
  detailSectionContent: { fontSize: 13, color: '#555', lineHeight: 20 },
  detailSeparator: { height: 1, backgroundColor: '#f2f2f2' },

  // Rules box
  rulesBox: {
    backgroundColor: '#FFF3CD',
    borderLeftWidth: 4,
    borderLeftColor: C.gold,
    borderRadius: 8,
    padding: 14,
    gap: 8,
  },
  rulesTitle: { fontSize: 13, fontWeight: '700', color: '#856404' },
  rulesText: { fontSize: 12, color: '#664D03', lineHeight: 20 },

  // Phone button
  phoneBtn: {
    backgroundColor: C.teal,
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
  },
  phoneBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  // Trek assign box
  trekBox: {
    backgroundColor: '#EDE9FE',
    borderRadius: 12,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: '#C4B5FD',
  },
  trekBoxTitle: { fontSize: 15, fontWeight: '700', color: '#5B21B6' },
  trekBoxSub: { fontSize: 13, color: '#7C3AED' },
  trekAssignBtn: {
    backgroundColor: C.purple,
    borderRadius: 9,
    paddingVertical: 11,
    alignItems: 'center',
    marginTop: 4,
  },
  trekAssignBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
