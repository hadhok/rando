import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { ETAPES, TOTAL_KM, TOTAL_DENIVELE, Etape } from '../data/etapes';
import { useGpx } from '../context/GpxContext';
import { GpxWaypoint, GpxBadge, GpxTrack } from '../utils/gpxParser';

// ─── GR10 helpers ─────────────────────────────────────────────────────────────

const DIFFICULTE_COLOR: Record<string, string> = {
  facile: '#2A9D8F',
  moyen: '#E9C46A',
  difficile: '#F4A261',
  tres_difficile: '#E63946',
};

const DIFFICULTE_LABEL: Record<string, string> = {
  facile: 'Facile',
  moyen: 'Moyen',
  difficile: 'Difficile',
  tres_difficile: 'Très difficile',
};

function ElevationBar({ pos, neg }: { pos: number; neg: number }) {
  const max = Math.max(pos, neg, 1);
  return (
    <View style={styles.elevBar}>
      <View style={styles.elevRow}>
        <Text style={styles.elevLabel}>▲ {pos}m</Text>
        <View style={[styles.elevFill, styles.elevPos, { width: `${(pos / max) * 100}%` as any }]} />
      </View>
      <View style={styles.elevRow}>
        <Text style={styles.elevLabel}>▼ {neg}m</Text>
        <View style={[styles.elevFill, styles.elevNeg, { width: `${(neg / max) * 100}%` as any }]} />
      </View>
    </View>
  );
}

function EtapeCard({ etape, onPress }: { etape: Etape; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.cardHeader}>
        <View style={styles.numBadge}>
          <Text style={styles.numText}>{etape.numero}</Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardNom}>{etape.nom}</Text>
          <Text style={styles.cardSub}>
            {etape.distance} km · {etape.dureeEstimee}h
          </Text>
        </View>
        <View style={[styles.diffBadge, { backgroundColor: DIFFICULTE_COLOR[etape.difficulte] }]}>
          <Text style={styles.diffText}>{DIFFICULTE_LABEL[etape.difficulte]}</Text>
        </View>
      </View>
      <ElevationBar pos={etape.denivelePos} neg={etape.deniveleNeg} />
    </TouchableOpacity>
  );
}

function InfoSection({ icon, title, content }: { icon: string; title: string; content: string }) {
  return (
    <View style={styles.infoSection}>
      <View style={styles.infoSectionHeader}>
        <Text style={styles.infoSectionIcon}>{icon}</Text>
        <Text style={styles.infoSectionTitle}>{title}</Text>
      </View>
      <Text style={styles.infoSectionContent}>{content}</Text>
    </View>
  );
}

function EtapeDetail({ etape, onClose }: { etape: Etape; onClose: () => void }) {
  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modal}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Étape {etape.numero}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.modalContent}>
          <Text style={styles.modalNom}>{etape.nom}</Text>
          <View style={[styles.diffBadgeLarge, { backgroundColor: DIFFICULTE_COLOR[etape.difficulte] }]}>
            <Text style={styles.diffTextLarge}>{DIFFICULTE_LABEL[etape.difficulte]}</Text>
          </View>
          <View style={styles.statsGrid}>
            <StatBox label="Distance" value={`${etape.distance} km`} icon="📏" />
            <StatBox label="Durée estimée" value={`${etape.dureeEstimee}h`} icon="⏱" />
            <StatBox label="Dénivelé +" value={`+${etape.denivelePos} m`} icon="▲" />
            <StatBox label="Dénivelé -" value={`-${etape.deniveleNeg} m`} icon="▼" />
          </View>
          <View style={styles.itineraireBox}>
            <View style={styles.itineraireRow}>
              <View style={[styles.dot, { backgroundColor: '#2A9D8F' }]} />
              <Text style={styles.itineraireText}>{etape.depart}</Text>
            </View>
            <View style={styles.itineraireLineFill} />
            <View style={styles.itineraireRow}>
              <View style={[styles.dot, { backgroundColor: '#E63946' }]} />
              <Text style={styles.itineraireText}>{etape.arrivee}</Text>
            </View>
          </View>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{etape.description}</Text>
          <InfoSection icon="🗺" title="Itinéraire & terrain" content={etape.itineraire} />
          <InfoSection icon="🛒" title="Ravitaillement" content={etape.ravitaillement} />
          <InfoSection icon="💧" title="Points d'eau" content={etape.eau} />
          <InfoSection icon="🏠" title="Hébergement à l'arrivée" content={etape.hebergement} />
          <View style={styles.retourBox}>
            <View style={styles.retourHeader}>
              <Text style={styles.retourIcon}>🚆</Text>
              <Text style={styles.retourTitle}>Retour à Hendaye</Text>
            </View>
            <Text style={styles.retourContent}>{etape.retourHendaye}</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function StatBox({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ─── GPX itinerary helpers ────────────────────────────────────────────────────

const BADGE_CFG: Record<GpxBadge, { label: string; bg: string; color: string }> = {
  eau:     { label: '💧 eau',     bg: '#DBEAFE', color: '#1E40AF' },
  bivouac: { label: '🏕 bivouac', bg: '#FEF3C7', color: '#92400E' },
  refuge:  { label: '🏠 refuge',  bg: '#EDE9FE', color: '#5B21B6' },
  parking: { label: '🅿️ départ',  bg: '#F3F4F6', color: '#6B7280' },
  sommet:  { label: '⛰ col',     bg: '#D1FAE5', color: '#065F46' },
};

const DEPART_H = 9; // 09:00 default

function fmtArrival(cumH: number): string {
  const tot = Math.round(DEPART_H * 60 + cumH * 60);
  return `${String(Math.floor(tot / 60)).padStart(2, '0')}h${String(tot % 60).padStart(2, '0')}`;
}

function fmtDur(h: number): string {
  const m = Math.round(h * 60);
  if (m === 0) return '—';
  const hh = Math.floor(m / 60);
  const mm = m % 60;
  if (hh === 0) return `${mm}min`;
  return mm === 0 ? `${hh}h` : `${hh}h${String(mm).padStart(2, '0')}`;
}

function WayptRow({ wpt, isFirst, isLast }: { wpt: GpxWaypoint; isFirst: boolean; isLast: boolean }) {
  const arrival = fmtArrival(wpt.cumTimeH);
  return (
    <View style={[gpx.row, isLast && gpx.rowLast]}>
      {/* Vertical timeline line */}
      <View style={gpx.timelineCol}>
        <View style={[gpx.dot, isFirst ? gpx.dotStart : isLast ? gpx.dotEnd : gpx.dotMid]} />
        {!isLast && <View style={gpx.line} />}
      </View>

      <View style={gpx.rowContent}>
        {/* Name + arrival */}
        <View style={gpx.rowTop}>
          <Text style={[gpx.name, (isFirst || isLast) && gpx.nameBold]} numberOfLines={2}>
            {wpt.name}
          </Text>
          <Text style={[gpx.time, isFirst && gpx.timeDepart]}>
            {isFirst ? `dep. ${arrival}` : arrival}
          </Text>
        </View>

        {/* Badges */}
        {wpt.badges.length > 0 && (
          <View style={gpx.badges}>
            {wpt.badges.map((b) => (
              <View key={b} style={[gpx.badge, { backgroundColor: BADGE_CFG[b].bg }]}>
                <Text style={[gpx.badgeTxt, { color: BADGE_CFG[b].color }]}>
                  {BADGE_CFG[b].label}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Stats */}
        <View style={gpx.stats}>
          {!isFirst && (
            <Text style={gpx.statTxt}>
              <Text style={gpx.statLbl}>dist </Text>
              {wpt.distCumKm.toFixed(1)} km
            </Text>
          )}
          {wpt.ele != null && (
            <Text style={gpx.statTxt}>
              <Text style={gpx.statLbl}>alt </Text>
              {Math.round(wpt.ele)} m
            </Text>
          )}
          {!isFirst && (
            <>
              <Text style={[gpx.statTxt, gpx.dp]}>▲{Math.round(wpt.dpCumM)} m</Text>
              <Text style={[gpx.statTxt, gpx.dm]}>▼{Math.round(wpt.dmCumM)} m</Text>
              <Text style={gpx.statTxt}>
                <Text style={gpx.statLbl}>seg </Text>+{fmtDur(wpt.segTimeH)}
              </Text>
              <Text style={gpx.statTxt}>
                <Text style={gpx.statLbl}>cum </Text>{fmtDur(wpt.cumTimeH)}
              </Text>
            </>
          )}
        </View>
      </View>
    </View>
  );
}

function GpxItinerary({ track }: { track: GpxTrack }) {
  const { waypoints } = track;
  const hasWaypoints = waypoints.length > 0;
  const last = hasWaypoints ? waypoints[waypoints.length - 1] : null;

  return (
    <ScrollView contentContainerStyle={gpx.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={gpx.header}>
        <Text style={gpx.headerTitle}>{track.name}</Text>
        {last && (
          <View style={gpx.headerStats}>
            <View style={gpx.chip}>
              <Text style={gpx.chipVal}>{last.distCumKm.toFixed(1)} km</Text>
              <Text style={gpx.chipLbl}>distance</Text>
            </View>
            <View style={gpx.chip}>
              <Text style={[gpx.chipVal, { color: '#0F6E56' }]}>+{Math.round(last.dpCumM)} m</Text>
              <Text style={gpx.chipLbl}>dénivelé +</Text>
            </View>
            <View style={gpx.chip}>
              <Text style={[gpx.chipVal, { color: '#993C1D' }]}>-{Math.round(last.dmCumM)} m</Text>
              <Text style={gpx.chipLbl}>dénivelé -</Text>
            </View>
            <View style={gpx.chip}>
              <Text style={gpx.chipVal}>{fmtDur(last.cumTimeH)}</Text>
              <Text style={gpx.chipLbl}>durée</Text>
            </View>
          </View>
        )}
        <Text style={gpx.naismith}>
          Naismith · 4 km/h plat · +300 m/h montée · -500 m/h descente · départ 09h00
        </Text>
      </View>

      {/* Waypoints */}
      {hasWaypoints ? (
        <View style={gpx.list}>
          {waypoints.map((wpt, i) => (
            <WayptRow
              key={i}
              wpt={wpt}
              isFirst={i === 0}
              isLast={i === waypoints.length - 1}
            />
          ))}
        </View>
      ) : (
        <View style={gpx.emptyBox}>
          <Text style={gpx.emptyIcon}>📍</Text>
          <Text style={gpx.emptyTitle}>Pas d'étapes dans ce fichier</Text>
          <Text style={gpx.emptySub}>
            Ce GPX contient uniquement le tracé.{'\n'}
            Ajoutez des waypoints ou des points de route dans votre application GPS.
          </Text>
          {track.points.length > 0 && (
            <Text style={gpx.emptyPts}>{track.points.length} points de trace importés</Text>
          )}
        </View>
      )}
    </ScrollView>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function EtapesScreen() {
  const [selected, setSelected] = useState<Etape | null>(null);
  const [activeTab, setActiveTab] = useState<'gr10' | 'gpx'>('gr10');
  const { gpxTrack, setGpxTrack } = useGpx();

  useEffect(() => {
    if (!gpxTrack) {
      setActiveTab('gr10');
    } else {
      setActiveTab('gpx');
    }
  }, [gpxTrack]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>GR10 · Pyrénées</Text>
        <Text style={styles.headerSub}>
          Hendaye → Banyuls-sur-Mer · ~{Math.round(TOTAL_KM)} km · D+ {TOTAL_DENIVELE.toLocaleString('fr')} m
        </Text>
        <View style={styles.headerNote}>
          <Text style={styles.headerNoteText}>
            ⚠️ 10 étapes affichées (Hendaye → Lescun)
          </Text>
        </View>
      </View>

      {/* Tab switcher — shown only when a GPX is imported */}
      {gpxTrack && (
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'gr10' && styles.tabActive]}
            onPress={() => setActiveTab('gr10')}
          >
            <Text style={[styles.tabTxt, activeTab === 'gr10' && styles.tabTxtActive]}>
              GR10
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'gpx' && styles.tabActiveGpx]}
            onPress={() => setActiveTab('gpx')}
          >
            <Text
              style={[styles.tabTxt, activeTab === 'gpx' && styles.tabTxtGpx]}
              numberOfLines={1}
            >
              🟣 {gpxTrack.name}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tabClear} onPress={() => setGpxTrack(null)}>
            <Text style={styles.tabClearTxt}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      {activeTab === 'gr10' || !gpxTrack ? (
        <FlatList
          data={ETAPES}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <EtapeCard etape={item} onPress={() => setSelected(item)} />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <GpxItinerary track={gpxTrack} />
      )}

      {selected && (
        <EtapeDetail etape={selected} onClose={() => setSelected(null)} />
      )}
    </SafeAreaView>
  );
}

// ─── Styles GR10 (unchanged) ──────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1FAEE' },
  header: {
    backgroundColor: '#264653',
    padding: 16,
    paddingBottom: 20,
  },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '700' },
  headerSub: { color: '#A8DADC', fontSize: 13, marginTop: 4 },
  headerNote: {
    marginTop: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 6,
    padding: 6,
  },
  headerNoteText: { color: '#E9C46A', fontSize: 12 },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 0,
    gap: 6,
    alignItems: 'flex-end',
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
    maxWidth: 180,
  },
  tabActive: {
    borderBottomColor: '#264653',
    backgroundColor: '#F1FAEE',
  },
  tabActiveGpx: {
    borderBottomColor: '#8338EC',
    backgroundColor: '#F5F0FF',
  },
  tabTxt: { fontSize: 13, fontWeight: '600', color: '#999' },
  tabTxtActive: { color: '#264653' },
  tabTxtGpx: { color: '#8338EC' },
  tabClear: {
    marginLeft: 'auto' as any,
    paddingHorizontal: 8,
    paddingVertical: 8,
    alignSelf: 'center',
  },
  tabClearTxt: { fontSize: 14, color: '#bbb' },
  list: { padding: 12, gap: 10 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  numBadge: {
    minWidth: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#264653',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    paddingHorizontal: 6,
  },
  numText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  cardInfo: { flex: 1 },
  cardNom: { fontSize: 14, fontWeight: '600', color: '#264653' },
  cardSub: { fontSize: 12, color: '#888', marginTop: 2 },
  diffBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  diffText: { fontSize: 11, color: '#fff', fontWeight: '600' },
  elevBar: { gap: 4 },
  elevRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  elevLabel: { fontSize: 11, color: '#888', width: 60 },
  elevFill: { height: 6, borderRadius: 3 },
  elevPos: { backgroundColor: '#2A9D8F' },
  elevNeg: { backgroundColor: '#E63946' },
  modal: { flex: 1, backgroundColor: '#F1FAEE' },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#264653',
  },
  modalTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  closeBtn: { padding: 4 },
  closeBtnText: { color: '#A8DADC', fontSize: 18 },
  modalContent: { padding: 20, gap: 16 },
  modalNom: { fontSize: 22, fontWeight: '700', color: '#264653' },
  diffBadgeLarge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 14 },
  diffTextLarge: { fontSize: 13, color: '#fff', fontWeight: '700' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statBox: {
    flex: 1,
    minWidth: 120,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  statIcon: { fontSize: 20, marginBottom: 4 },
  statValue: { fontSize: 16, fontWeight: '700', color: '#264653' },
  statLabel: { fontSize: 11, color: '#888', marginTop: 2 },
  itineraireBox: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  itineraireRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  itineraireLineFill: {
    width: 2,
    height: 20,
    backgroundColor: '#ddd',
    marginLeft: 4,
    marginVertical: 2,
  },
  itineraireText: { fontSize: 15, fontWeight: '600', color: '#264653' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#264653' },
  description: { fontSize: 14, color: '#555', lineHeight: 22 },
  infoSection: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
    gap: 8,
  },
  infoSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoSectionIcon: { fontSize: 16 },
  infoSectionTitle: { fontSize: 14, fontWeight: '700', color: '#264653' },
  infoSectionContent: { fontSize: 13, color: '#555', lineHeight: 20 },
  retourBox: {
    backgroundColor: '#EAF4FB',
    borderLeftWidth: 4,
    borderLeftColor: '#264653',
    borderRadius: 10,
    padding: 14,
    gap: 8,
    marginBottom: 8,
  },
  retourHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  retourIcon: { fontSize: 16 },
  retourTitle: { fontSize: 14, fontWeight: '700', color: '#264653' },
  retourContent: { fontSize: 13, color: '#2c5f70', lineHeight: 20 },
});

// ─── Styles GPX ───────────────────────────────────────────────────────────────

const gpx = StyleSheet.create({
  container: { padding: 12, gap: 0, paddingBottom: 32 },
  header: {
    backgroundColor: '#F5F0FF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#8338EC',
    gap: 10,
  },
  headerTitle: { fontSize: 15, fontWeight: '700', color: '#3d1c7a' },
  headerStats: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
    minWidth: 70,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  chipVal: { fontSize: 14, fontWeight: '700', color: '#264653' },
  chipLbl: { fontSize: 10, color: '#888', marginTop: 1 },
  naismith: { fontSize: 11, color: '#7c5cbf', fontStyle: 'italic', lineHeight: 16 },
  list: { gap: 0 },
  row: {
    flexDirection: 'row',
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  rowLast: { paddingBottom: 0 },
  timelineCol: {
    width: 24,
    alignItems: 'center',
    paddingTop: 4,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    zIndex: 1,
  },
  dotStart: { backgroundColor: '#2A9D8F', borderWidth: 2, borderColor: '#fff', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  dotMid: { backgroundColor: '#8338EC', borderWidth: 2, borderColor: '#fff' },
  dotEnd: { backgroundColor: '#E63946', borderWidth: 2, borderColor: '#fff', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: '#ddd',
    marginTop: 2,
    minHeight: 40,
  },
  rowContent: {
    flex: 1,
    paddingLeft: 10,
    paddingBottom: 16,
    gap: 4,
  },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  name: {
    flex: 1,
    fontSize: 13,
    color: '#264653',
    lineHeight: 18,
  },
  nameBold: { fontWeight: '700', fontSize: 14 },
  time: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8338EC',
    minWidth: 52,
    textAlign: 'right',
  },
  timeDepart: { color: '#2A9D8F' },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeTxt: { fontSize: 10, fontWeight: '600' },
  stats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  statTxt: {
    fontSize: 11,
    color: '#555',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statLbl: { color: '#999', fontSize: 10 },
  dp: { color: '#0F6E56', backgroundColor: '#F0FDF4' },
  dm: { color: '#993C1D', backgroundColor: '#FFF7F0' },
  emptyBox: {
    alignItems: 'center',
    padding: 40,
    gap: 10,
  },
  emptyIcon: { fontSize: 40 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#264653', textAlign: 'center' },
  emptySub: { fontSize: 13, color: '#888', textAlign: 'center', lineHeight: 20 },
  emptyPts: {
    marginTop: 8,
    fontSize: 12,
    color: '#8338EC',
    backgroundColor: '#F5F0FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    fontWeight: '600',
  },
});
