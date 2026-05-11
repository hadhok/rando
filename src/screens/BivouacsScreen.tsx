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
import { BIVOUACS, Bivouac } from '../data/bivouacs';

const DIFF_COLOR: Record<Bivouac['difficulteAcces'], string> = {
  facile: '#2A9D8F',
  moyen: '#E9C46A',
  difficile: '#E63946',
};
const DIFF_LABEL: Record<Bivouac['difficulteAcces'], string> = {
  facile: 'Accès facile',
  moyen: 'Accès moyen',
  difficile: 'Accès difficile',
};

type Filter = 'tous' | Bivouac['difficulteAcces'];

function BivouacCard({ biv, onPress }: { biv: Bivouac; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.cardTop}>
        <View style={styles.tentBadge}>
          <Text style={styles.tentIcon}>⛺</Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardNom}>{biv.nom}</Text>
          <Text style={styles.cardAlt}>↑ {biv.altitude} m</Text>
        </View>
        <View style={[styles.diffPill, { backgroundColor: DIFF_COLOR[biv.difficulteAcces] }]}>
          <Text style={styles.diffPillText}>{DIFF_LABEL[biv.difficulteAcces]}</Text>
        </View>
      </View>
      <Text style={styles.cardDesc} numberOfLines={2}>
        {biv.description}
      </Text>
      <View style={styles.cardFooter}>
        <Text style={styles.cardFooterItem}>💧 {biv.eau.split('.')[0]}</Text>
      </View>
    </TouchableOpacity>
  );
}

function DetailRow({ icon, title, content }: { icon: string; title: string; content: string }) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailHeader}>
        <Text style={styles.detailIcon}>{icon}</Text>
        <Text style={styles.detailTitle}>{title}</Text>
      </View>
      <Text style={styles.detailContent}>{content}</Text>
    </View>
  );
}

function BivouacDetail({ biv, onClose }: { biv: Bivouac; onClose: () => void }) {
  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modal}>
        <View style={styles.modalHeader}>
          <View style={styles.modalHeaderLeft}>
            <Text style={styles.modalHeaderIcon}>⛺</Text>
            <Text style={styles.modalTitle}>{biv.nom}</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.modalContent}>
          {/* Badges altitude + difficulté */}
          <View style={styles.badgeRow}>
            <View style={styles.altBadge}>
              <Text style={styles.altBadgeText}>⛰ {biv.altitude} m</Text>
            </View>
            <View style={[styles.diffBadge, { backgroundColor: DIFF_COLOR[biv.difficulteAcces] }]}>
              <Text style={styles.diffBadgeText}>{DIFF_LABEL[biv.difficulteAcces]}</Text>
            </View>
          </View>

          {/* Panorama */}
          <View style={styles.panoramaBox}>
            <Text style={styles.panoramaLabel}>🌄 Panorama</Text>
            <Text style={styles.panoramaText}>{biv.panorama}</Text>
          </View>

          {/* Description */}
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{biv.description}</Text>

          {/* Infos pratiques */}
          <Text style={styles.sectionTitle}>Infos pratiques</Text>
          <View style={styles.detailCard}>
            <DetailRow icon="💧" title="Points d'eau" content={biv.eau} />
            <View style={styles.separator} />
            <DetailRow icon="🛒" title="Ravitaillement" content={biv.ravitaillement} />
            <View style={styles.separator} />
            <DetailRow icon="💡" title="Conseils" content={biv.conseils} />
          </View>

          {/* Règles du bivouac */}
          <View style={styles.rulesBox}>
            <Text style={styles.rulesTitle}>📋 Règles du bivouac en montagne</Text>
            <Text style={styles.rulesText}>
              • Arrivée après 19h, départ avant 9h{'\n'}
              • Interdit dans les zones cœur de Parc National{'\n'}
              • 1 nuit maximum au même emplacement{'\n'}
              • Feux de camp interdits (sauf zone dédiée){'\n'}
              • Déchets : tout remporter, laisser propre
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

export default function BivouacsScreen() {
  const [selected, setSelected] = useState<Bivouac | null>(null);
  const [filter, setFilter] = useState<Filter>('tous');

  const filtered =
    filter === 'tous' ? BIVOUACS : BIVOUACS.filter((b) => b.difficulteAcces === filter);

  const filters: { key: Filter; label: string }[] = [
    { key: 'tous', label: 'Tous' },
    { key: 'facile', label: '🟢 Facile' },
    { key: 'moyen', label: '🟡 Moyen' },
    { key: 'difficile', label: '🔴 Difficile' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bivouacs GR10</Text>
        <Text style={styles.headerSub}>{filtered.length} spots sélectionnés · Gratuit</Text>
      </View>

      <View style={styles.filterBar}>
        {filters.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterBtn, filter === f.key && styles.filterBtnActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[styles.filterBtnText, filter === f.key && styles.filterBtnTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <BivouacCard biv={item} onPress={() => setSelected(item)} />
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />

      {selected && (
        <BivouacDetail biv={selected} onClose={() => setSelected(null)} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1FAEE' },
  header: { backgroundColor: '#2A4A3E', padding: 16 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '700' },
  headerSub: { color: '#A8DADC', fontSize: 13, marginTop: 2 },
  filterBar: {
    flexDirection: 'row',
    padding: 10,
    gap: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filterBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: '#F1FAEE',
  },
  filterBtnActive: { backgroundColor: '#2A4A3E' },
  filterBtnText: { fontSize: 12, color: '#555', fontWeight: '500' },
  filterBtnTextActive: { color: '#fff' },
  list: { padding: 12, gap: 10 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    gap: 8,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  tentBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#2A4A3E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tentIcon: { fontSize: 18 },
  cardInfo: { flex: 1 },
  cardNom: { fontSize: 14, fontWeight: '700', color: '#264653' },
  cardAlt: { fontSize: 12, color: '#888', marginTop: 2 },
  diffPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, alignSelf: 'flex-start' },
  diffPillText: { fontSize: 10, color: '#fff', fontWeight: '700' },
  cardDesc: { fontSize: 13, color: '#555', lineHeight: 19 },
  cardFooter: { borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 8 },
  cardFooterItem: { fontSize: 12, color: '#2A9D8F', fontWeight: '500' },
  // Modal
  modal: { flex: 1, backgroundColor: '#F1FAEE' },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#2A4A3E',
  },
  modalHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  modalHeaderIcon: { fontSize: 22 },
  modalTitle: { color: '#fff', fontSize: 16, fontWeight: '700', flex: 1 },
  closeBtn: { padding: 4 },
  closeBtnText: { color: '#A8DADC', fontSize: 18 },
  modalContent: { padding: 20, gap: 16 },
  badgeRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  altBadge: {
    backgroundColor: '#264653',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
  },
  altBadgeText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  diffBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 14 },
  diffBadgeText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  panoramaBox: {
    backgroundColor: '#264653',
    borderRadius: 10,
    padding: 14,
    gap: 6,
  },
  panoramaLabel: { color: '#A8DADC', fontSize: 12, fontWeight: '600' },
  panoramaText: { color: '#fff', fontSize: 14, lineHeight: 21, fontStyle: 'italic' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#264653' },
  description: { fontSize: 14, color: '#555', lineHeight: 22 },
  detailCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  detailRow: { padding: 14, gap: 6 },
  detailHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailIcon: { fontSize: 15 },
  detailTitle: { fontSize: 13, fontWeight: '700', color: '#264653' },
  detailContent: { fontSize: 13, color: '#555', lineHeight: 20 },
  separator: { height: 1, backgroundColor: '#f0f0f0' },
  rulesBox: {
    backgroundColor: '#FFF3CD',
    borderLeftWidth: 4,
    borderLeftColor: '#E9C46A',
    borderRadius: 8,
    padding: 14,
    gap: 8,
  },
  rulesTitle: { fontSize: 13, fontWeight: '700', color: '#856404' },
  rulesText: { fontSize: 12, color: '#664d03', lineHeight: 20 },
});
