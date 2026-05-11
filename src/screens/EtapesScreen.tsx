import React, { useState } from 'react';
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
        <View
          style={[
            styles.diffBadge,
            { backgroundColor: DIFFICULTE_COLOR[etape.difficulte] },
          ]}
        >
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
          <View
            style={[
              styles.diffBadgeLarge,
              { backgroundColor: DIFFICULTE_COLOR[etape.difficulte] },
            ]}
          >
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

          <InfoSection
            icon="🗺"
            title="Itinéraire & terrain"
            content={etape.itineraire}
          />
          <InfoSection
            icon="🛒"
            title="Ravitaillement"
            content={etape.ravitaillement}
          />
          <InfoSection
            icon="💧"
            title="Points d'eau"
            content={etape.eau}
          />
          <InfoSection
            icon="🏠"
            title="Hébergement à l'arrivée"
            content={etape.hebergement}
          />
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

export default function EtapesScreen() {
  const [selected, setSelected] = useState<Etape | null>(null);

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

      <FlatList
        data={ETAPES}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <EtapeCard etape={item} onPress={() => setSelected(item)} />
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />

      {selected && (
        <EtapeDetail etape={selected} onClose={() => setSelected(null)} />
      )}
    </SafeAreaView>
  );
}

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
  diffBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
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
  diffBadgeLarge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
  },
  diffTextLarge: { fontSize: 13, color: '#fff', fontWeight: '700' },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
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
  infoSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
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
