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
  Linking,
  Alert,
} from 'react-native';
import { REFUGES, Refuge, TypeHebergement } from '../data/refuges';
import { ETAPES } from '../data/etapes';

const TYPE_ICON: Record<TypeHebergement, string> = {
  refuge: '⛺',
  gite: '🏠',
  camping: '🏕',
  village: '🏘',
};

const TYPE_COLOR: Record<TypeHebergement, string> = {
  refuge: '#E63946',
  gite: '#2A9D8F',
  camping: '#52B788',
  village: '#264653',
};

function callPhone(numero: string) {
  Linking.openURL(`tel:${numero}`).catch(() =>
    Alert.alert('Erreur', 'Impossible d\'ouvrir le téléphone')
  );
}

function RefugeCard({ refuge, onPress }: { refuge: Refuge; onPress: () => void }) {
  const etape = ETAPES.find((e) => e.id === refuge.etapeId);
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.cardTop}>
        <View style={[styles.typeBadge, { backgroundColor: TYPE_COLOR[refuge.type] }]}>
          <Text style={styles.typeIcon}>{TYPE_ICON[refuge.type]}</Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardNom}>{refuge.nom}</Text>
          {etape && (
            <Text style={styles.cardEtape}>Étape {etape.numero} · {etape.nom}</Text>
          )}
        </View>
      </View>
      <View style={styles.cardStats}>
        <Pill label={`${refuge.prixNuit}€`} color="#264653" />
        <Pill label={`${refuge.capacite} places`} color="#555" />
        {refuge.altitude > 0 && <Pill label={`${refuge.altitude}m`} color="#777" />}
        {refuge.reservation && <Pill label="Résa requise" color="#E63946" />}
        {!refuge.gardien && <Pill label="Non gardé" color="#F4A261" />}
        {refuge.ravitaillement && <Pill label="Ravito" color="#2A9D8F" />}
      </View>
    </TouchableOpacity>
  );
}

function Pill({ label, color }: { label: string; color: string }) {
  return (
    <View style={[styles.pill, { borderColor: color }]}>
      <Text style={[styles.pillText, { color }]}>{label}</Text>
    </View>
  );
}

function RefugeDetail({ refuge, onClose }: { refuge: Refuge; onClose: () => void }) {
  const etape = ETAPES.find((e) => e.id === refuge.etapeId);
  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modal}>
        <View style={styles.modalHeader}>
          <View style={styles.modalHeaderLeft}>
            <Text style={styles.typeIconLarge}>{TYPE_ICON[refuge.type]}</Text>
            <Text style={styles.modalTitle}>{refuge.nom}</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.modalContent}>
          {etape && (
            <View style={styles.etapeRef}>
              <Text style={styles.etapeRefText}>
                📍 Étape {etape.numero} — {etape.nom}
              </Text>
            </View>
          )}

          <View style={styles.infoGrid}>
            <InfoRow icon="💰" label="Prix nuit" value={`${refuge.prixNuit} €`} />
            <InfoRow icon="🛏" label="Capacité" value={`${refuge.capacite} places`} />
            <InfoRow icon="🏔" label="Altitude" value={`${refuge.altitude} m`} />
            <InfoRow
              icon="🗓"
              label="Réservation"
              value={refuge.reservation ? 'Obligatoire' : 'Non requise'}
              valueColor={refuge.reservation ? '#E63946' : '#2A9D8F'}
            />
            <InfoRow
              icon="👤"
              label="Gardien"
              value={refuge.gardien ? 'Oui' : 'Non gardé'}
              valueColor={refuge.gardien ? '#2A9D8F' : '#F4A261'}
            />
            <InfoRow
              icon="💧"
              label="Eau potable"
              value={refuge.eau ? 'Disponible' : 'Non disponible'}
              valueColor={refuge.eau ? '#2A9D8F' : '#E63946'}
            />
            <InfoRow
              icon="🛒"
              label="Ravitaillement"
              value={refuge.ravitaillement ? 'Disponible' : 'Non disponible'}
              valueColor={refuge.ravitaillement ? '#2A9D8F' : '#888'}
            />
          </View>

          {refuge.notes && (
            <View style={styles.notesBox}>
              <Text style={styles.notesTitle}>Notes</Text>
              <Text style={styles.notesText}>{refuge.notes}</Text>
            </View>
          )}

          {refuge.telephone && (
            <TouchableOpacity
              style={styles.phoneBtn}
              onPress={() => callPhone(refuge.telephone!)}
            >
              <Text style={styles.phoneBtnText}>📞 Appeler · {refuge.telephone}</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function InfoRow({
  icon,
  label,
  value,
  valueColor,
}: {
  icon: string;
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoIcon}>{icon}</Text>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, valueColor ? { color: valueColor } : undefined]}>
        {value}
      </Text>
    </View>
  );
}

type Filter = 'tous' | TypeHebergement;

export default function RefugesScreen() {
  const [selected, setSelected] = useState<Refuge | null>(null);
  const [filter, setFilter] = useState<Filter>('tous');

  const filtered = filter === 'tous' ? REFUGES : REFUGES.filter((r) => r.type === filter);

  const filters: { key: Filter; label: string }[] = [
    { key: 'tous', label: 'Tous' },
    { key: 'refuge', label: '⛺ Refuges' },
    { key: 'gite', label: '🏠 Gîtes' },
    { key: 'camping', label: '🏕 Campings' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Hébergements</Text>
        <Text style={styles.headerSub}>{filtered.length} hébergements</Text>
      </View>

      <View style={styles.filterBar}>
        {filters.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterBtn, filter === f.key && styles.filterBtnActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text
              style={[styles.filterBtnText, filter === f.key && styles.filterBtnTextActive]}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <RefugeCard refuge={item} onPress={() => setSelected(item)} />
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />

      {selected && (
        <RefugeDetail refuge={selected} onClose={() => setSelected(null)} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1FAEE' },
  header: {
    backgroundColor: '#264653',
    padding: 16,
  },
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
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F1FAEE',
  },
  filterBtnActive: { backgroundColor: '#264653' },
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
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  typeBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  typeIcon: { fontSize: 18 },
  cardInfo: { flex: 1 },
  cardNom: { fontSize: 14, fontWeight: '600', color: '#264653' },
  cardEtape: { fontSize: 11, color: '#888', marginTop: 2 },
  cardStats: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  pill: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  pillText: { fontSize: 11, fontWeight: '500' },
  modal: { flex: 1, backgroundColor: '#F1FAEE' },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#264653',
  },
  modalHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  typeIconLarge: { fontSize: 24 },
  modalTitle: { color: '#fff', fontSize: 16, fontWeight: '700', flex: 1 },
  closeBtn: { padding: 4 },
  closeBtnText: { color: '#A8DADC', fontSize: 18 },
  modalContent: { padding: 20, gap: 16 },
  etapeRef: {
    backgroundColor: '#264653',
    borderRadius: 8,
    padding: 10,
  },
  etapeRefText: { color: '#A8DADC', fontSize: 13 },
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
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    gap: 10,
  },
  infoIcon: { fontSize: 16, width: 24 },
  infoLabel: { flex: 1, fontSize: 14, color: '#555' },
  infoValue: { fontSize: 14, fontWeight: '600', color: '#264653' },
  notesBox: {
    backgroundColor: '#fff8e1',
    borderRadius: 10,
    padding: 14,
  },
  notesTitle: { fontSize: 13, fontWeight: '700', color: '#F4A261', marginBottom: 6 },
  notesText: { fontSize: 13, color: '#555', lineHeight: 20 },
  phoneBtn: {
    backgroundColor: '#2A9D8F',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
  },
  phoneBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
