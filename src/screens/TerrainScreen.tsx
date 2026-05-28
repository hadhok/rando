import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { C, FF, notebookBg } from '../theme';

interface InfoRow {
  icon: string;
  label: string;
  sub?: string;
  alt?: string;
  warning?: boolean;
}

interface TerrainCard {
  id: string;
  icon: string;
  title: string;
  meta?: string;
  defaultOpen?: boolean;
  rows: InfoRow[];
}

const CARDS: TerrainCard[] = [
  {
    id: 'water',
    icon: '💧',
    title: 'Points d\'eau — GR10',
    meta: 'Biriatou → Ainhoa',
    defaultOpen: true,
    rows: [
      { icon: '●', label: 'Fontaine de Biriatou', sub: 'Village · Eau potable garantie · km 0', alt: '56m' },
      { icon: '●', label: "Col d'Ibardin", sub: 'Source + ventas · km 7,5', alt: '318m' },
      { icon: '●', label: "Entrée d'Olheta", sub: 'Ruisseau · Filtrer obligatoire · km 13,6', alt: '96m' },
      { icon: '●', label: 'Sare', sub: 'Fontaine village · km 22,7 · Dernier point avant frontière', alt: '80m' },
      { icon: '●', label: 'Pont du Diable', sub: 'Rivière Nive · km 28,3 · Eau abondante', alt: '58m' },
      { icon: '⚠️', label: 'Zone Sare → Pont du Diable', sub: 'Aucun point d\'eau — faire le plein à Sare', warning: true },
    ],
  },
  {
    id: 'bivouac',
    icon: '⛺',
    title: 'Spots bivouac',
    meta: 'Validés randonneurs',
    rows: [
      { icon: 'J1', label: 'Crête Mandalé', sub: 'Zone ouverte · Vue océan · Terrain herbeux', alt: '380m' },
      { icon: 'J1', label: "Entrée d'Olheta — ruisseau", sub: 'Eau sur place · Terrain plat · Discret', alt: '96m' },
      { icon: 'J2', label: 'Col des Trois-Fontaines', sub: 'Cabane 4 pers · Source faible · Vue mer', alt: '563m' },
      { icon: 'J2', label: 'Frontière Sare/Espagne', sub: 'Zone ouverte · Pottoks · Côté espagnol plus libre', alt: '110m' },
    ],
  },
  {
    id: 'fauna',
    icon: '🐴',
    title: 'Faune & flore',
    rows: [
      { icon: '🐴', label: 'Pottoks', sub: 'Chevaux basques sauvages · Ne pas nourrir · Inoffensifs' },
      { icon: '🦔', label: 'Tiques', sub: 'Risque élevé prairies · Vérifier le soir · Pince obligatoire' },
      { icon: '🦫', label: 'Marmottes (Ossau)', sub: "Nombreuses autour des lacs d'Ayous · Peu farouches" },
      { icon: '🦌', label: 'Isards', sub: 'Pyrénées · Visibles sur les névés en altitude' },
    ],
  },
  {
    id: 'regs',
    icon: '⚖️',
    title: 'Réglementation bivouac',
    rows: [
      { icon: '✓', label: 'Heure légale', sub: 'Installation après 19h · Départ avant 9h' },
      { icon: '✓', label: 'Parc National Pyrénées', sub: 'Bivouac autorisé 19h–9h · Tarp bas · Pas de feu · Chiens interdits' },
      { icon: '✗', label: 'Lacs Roumassot & Miey', sub: 'Bivouac interdit — zone pastorale' },
      { icon: '✗', label: 'Lac Gentau (juil–sept)', sub: 'Bivouac interdit · Aller au lac Bersau (+30 min)' },
    ],
  },
  {
    id: 'maps',
    icon: '🗺',
    title: 'Cartes & navigation',
    rows: [
      { icon: '📱', label: 'OsmAnd — navigation offline', sub: 'GPX GR10_Hendaye_Iraty_BIVOUAC_v2.gpx importé · Fonds OpenStreetMap' },
      { icon: '📄', label: 'Cartes IGN papier', sub: '1346OT — Hendaye / La Rhune · 1547OT — Ossau' },
      { icon: '🌐', label: 'Impression cartes', sub: 'geoportail.gouv.fr → Imprimer → A4 · 1:25 000' },
    ],
  },
  {
    id: 'sos',
    icon: '🆘',
    title: 'Urgences',
    defaultOpen: true,
    rows: [
      { icon: '📞', label: '112', sub: 'Urgences Europe — fonctionne hors réseau' },
      { icon: '⛑', label: 'PGHM Pyrénées Atlantiques', sub: '05 59 37 09 59 · Secours montagne 64' },
      { icon: '📡', label: 'Signal variable en crête', sub: 'Se déplacer vers une crête dégagée pour avoir le réseau' },
    ],
  },
];

export default function TerrainScreen() {
  const [expanded, setExpanded] = useState<Record<string, boolean>>(
    Object.fromEntries(CARDS.filter(c => c.defaultOpen).map(c => [c.id, true]))
  );

  const toggle = (id: string) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <View style={[s.root, notebookBg as any]}>
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.sectionTitle}>Info terrain</Text>

        {CARDS.map(card => {
          const isOpen = !!expanded[card.id];
          return (
            <View key={card.id} style={s.card}>
              <TouchableOpacity style={s.cardHeader} onPress={() => toggle(card.id)} activeOpacity={0.75}>
                <Text style={s.cardIcon}>{card.icon}</Text>
                <Text style={s.cardTitle}>{card.title}</Text>
                {card.meta && <Text style={s.cardMeta}>{card.meta}</Text>}
                <Text style={s.chevron}>{isOpen ? '▾' : '▸'}</Text>
              </TouchableOpacity>

              {isOpen && (
                <View style={s.cardBody}>
                  {card.rows.map((row, ri) => {
                    if (row.warning) {
                      return (
                        <View key={ri} style={s.warningRow}>
                          <Text style={s.warningIcon}>{row.icon}</Text>
                          <View style={{ flex: 1 }}>
                            <Text style={s.warningLabel}>{row.label}</Text>
                            <Text style={s.warningSub}>{row.sub}</Text>
                          </View>
                        </View>
                      );
                    }
                    return (
                      <View key={ri} style={[s.infoRow, ri === card.rows.filter(r => !r.warning || ri === card.rows.length - 1).length - 1 && {}]}>
                        <Text style={s.infoIcon}>{row.icon}</Text>
                        <View style={{ flex: 1 }}>
                          {card.id === 'sos' && ri === 0 ? (
                            <Text style={s.sosNumber}>{row.label}</Text>
                          ) : (
                            <Text style={s.infoLabel}>{row.label}</Text>
                          )}
                          {row.sub && <Text style={s.infoSub}>{row.sub}</Text>}
                        </View>
                        {row.alt && (
                          <View style={s.altBadge}>
                            <Text style={s.altText}>{row.alt}</Text>
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.paper },
  scroll: { padding: 16, paddingBottom: 40 },

  sectionTitle: {
    fontFamily: FF.display, fontSize: 18, fontWeight: '600', color: C.ink,
    letterSpacing: -0.5, marginBottom: 14,
  },

  card: {
    backgroundColor: C.paper2, borderWidth: 1, borderColor: C.line, borderRadius: 10,
    marginBottom: 12, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 },
  cardIcon: { fontSize: 18 },
  cardTitle: { fontFamily: FF.display, fontSize: 15, fontWeight: '600', color: C.ink, flex: 1, letterSpacing: -0.3 },
  cardMeta: { fontFamily: FF.mono, fontSize: 10, color: C.accent, letterSpacing: 0.5 },
  chevron: { fontFamily: FF.mono, fontSize: 12, color: C.ink, opacity: 0.5 },

  cardBody: { borderTopWidth: 1, borderTopColor: C.line, padding: 12 },

  infoRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.line2,
  },
  infoIcon: { fontFamily: FF.mono, fontSize: 13, width: 24, textAlign: 'center', color: C.ink },
  infoLabel: { fontFamily: FF.mono, fontSize: 12, color: C.ink, fontWeight: '500' },
  infoSub: { fontFamily: FF.mono, fontSize: 10, color: C.ink, opacity: 0.5, marginTop: 1 },
  sosNumber: { fontFamily: FF.display, fontSize: 20, fontWeight: '600', color: C.ink },

  altBadge: { backgroundColor: C.paper3, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: C.line, alignSelf: 'flex-start', marginTop: 2 },
  altText: { fontFamily: FF.mono, fontSize: 10, color: C.ink },

  warningRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    padding: 8, borderRadius: 6, borderWidth: 1, borderColor: C.accent,
    backgroundColor: 'rgba(200,80,42,0.05)', marginTop: 4,
  },
  warningIcon: { fontSize: 14, width: 22, textAlign: 'center' },
  warningLabel: { fontFamily: FF.mono, fontSize: 12, color: C.ink, fontWeight: '500' },
  warningSub: { fontFamily: FF.mono, fontSize: 10, color: C.ink, opacity: 0.5, marginTop: 1 },
});
