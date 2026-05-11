import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Linking,
  Alert,
} from 'react-native';
import { URGENCES } from '../data/refuges';

function callPhone(numero: string) {
  Linking.openURL(`tel:${numero}`).catch(() =>
    Alert.alert('Erreur', 'Impossible d\'ouvrir le téléphone')
  );
}

export default function UrgencesScreen() {
  const principaux = URGENCES.filter((u) => ['15', '112', '18'].includes(u.numero));
  const pghm = URGENCES.filter((u) => !['15', '112', '18'].includes(u.numero));

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Urgences</Text>
        <Text style={styles.headerSub}>Numéros disponibles hors connexion</Text>
      </View>

      <FlatList
        data={[]}
        keyExtractor={() => ''}
        renderItem={() => null}
        ListHeaderComponent={
          <View style={styles.content}>
            {/* Avertissement */}
            <View style={styles.alertBox}>
              <Text style={styles.alertTitle}>⚠️ En cas d'urgence en montagne</Text>
              <Text style={styles.alertText}>
                Restez calme. Donnez votre position précise (coordonnées GPS, nom du col, refuge).
                Protégez-vous du vent et du froid. Signalez-vous visuellement si possible.
              </Text>
            </View>

            {/* Numéros principaux */}
            <Text style={styles.sectionTitle}>Numéros d'urgence</Text>
            <View style={styles.urgGrid}>
              {principaux.map((u) => (
                <TouchableOpacity
                  key={u.numero}
                  style={styles.urgCard}
                  onPress={() => callPhone(u.numero)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.urgNumero}>{u.numero}</Text>
                  <Text style={styles.urgService}>{u.service}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* PGHM par département */}
            <Text style={styles.sectionTitle}>PGHM — Secours Montagne</Text>
            <Text style={styles.sectionSub}>
              Peloton de Gendarmerie de Haute Montagne
            </Text>
            {pghm.map((u) => (
              <TouchableOpacity
                key={u.numero + u.region}
                style={styles.pghmCard}
                onPress={() => callPhone(u.numero)}
                activeOpacity={0.8}
              >
                <View style={styles.pghmLeft}>
                  <Text style={styles.pghmRegion}>{u.region}</Text>
                  <Text style={styles.pghmService}>{u.service}</Text>
                </View>
                <View style={styles.phoneChip}>
                  <Text style={styles.phoneChipText}>📞 {u.numero}</Text>
                </View>
              </TouchableOpacity>
            ))}

            {/* Conseils */}
            <Text style={styles.sectionTitle}>Conseils de sécurité</Text>
            {CONSEILS.map((c, i) => (
              <View key={i} style={styles.conseilRow}>
                <Text style={styles.conseilIcon}>{c.icon}</Text>
                <View style={styles.conseilTextBlock}>
                  <Text style={styles.conseilTitle}>{c.titre}</Text>
                  <Text style={styles.conseilDesc}>{c.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const CONSEILS = [
  {
    icon: '📍',
    titre: 'Partagez votre itinéraire',
    desc: 'Laissez votre programme à un proche avec votre heure de retour estimée.',
  },
  {
    icon: '🌤',
    titre: 'Surveillez la météo',
    desc: 'Consultez les prévisions avant chaque étape. Orages possibles l\'après-midi en été.',
  },
  {
    icon: '💊',
    titre: 'Trousse de premiers secours',
    desc: 'Pansements, désinfectant, antidouleur, couverture de survie, élastique.',
  },
  {
    icon: '📱',
    titre: 'Batterie chargée',
    desc: 'Emportez une batterie externe. Le GPS consomme beaucoup.',
  },
  {
    icon: '🧭',
    titre: 'Carte papier en complément',
    desc: 'Topoguide GR10 recommandé. Ne dépendez pas uniquement du téléphone.',
  },
  {
    icon: '👟',
    titre: 'Demi-tour sans honte',
    desc: 'Si les conditions se dégradent ou que vous êtes épuisé, rebroussez chemin.',
  },
];

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1FAEE' },
  header: {
    backgroundColor: '#E63946',
    padding: 16,
  },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '700' },
  headerSub: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 2 },
  content: { padding: 14, gap: 16 },
  alertBox: {
    backgroundColor: '#FFF3CD',
    borderLeftWidth: 4,
    borderLeftColor: '#E9C46A',
    borderRadius: 8,
    padding: 14,
  },
  alertTitle: { fontSize: 14, fontWeight: '700', color: '#856404', marginBottom: 6 },
  alertText: { fontSize: 13, color: '#664d03', lineHeight: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#264653', marginTop: 4 },
  sectionSub: { fontSize: 12, color: '#888', marginTop: -10, marginBottom: 6 },
  urgGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  urgCard: {
    flex: 1,
    backgroundColor: '#E63946',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#E63946',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  urgNumero: { fontSize: 26, fontWeight: '800', color: '#fff' },
  urgService: { fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 4 },
  pghmCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  pghmLeft: { flex: 1 },
  pghmRegion: { fontSize: 13, fontWeight: '600', color: '#264653' },
  pghmService: { fontSize: 11, color: '#888', marginTop: 2 },
  phoneChip: {
    backgroundColor: '#264653',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  phoneChipText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  conseilRow: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  conseilIcon: { fontSize: 22 },
  conseilTextBlock: { flex: 1 },
  conseilTitle: { fontSize: 13, fontWeight: '700', color: '#264653' },
  conseilDesc: { fontSize: 12, color: '#666', marginTop: 3, lineHeight: 18 },
});
