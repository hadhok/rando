import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
} from 'react-native';
import { C, FF, notebookBg } from '../theme';
import { useGpx } from '../context/GpxContext';
import { TREKS } from '../data/treks';

interface TransportStep {
  label: string;
  meta: string;
  badge?: { label: string; type: 'bus' | 'tad' | 'taxi' };
  last?: boolean;
}

interface TransportCard {
  id: string;
  trekIds: string[]; // which trek IDs this card applies to
  icon: string;
  title: string;
  meta: string;
  steps: TransportStep[];
  infos: { icon: string; label: string; sub: string }[];
}

const CARDS: TransportCard[] = [
  {
    id: 'gr10',
    trekIds: ['gr10'],
    icon: '🚌',
    title: 'Depuis Sare ou Ainhoa',
    meta: '→ Biriatou',
    steps: [
      { label: 'Sare / Ainhoa', meta: 'Lur Berri (Sare) ou centre Ainhoa', badge: { label: 'TAD Txik-Txak — réserver 1h avant', type: 'tad' } },
      { label: 'Saint-Jean-de-Luz', meta: 'Halte Routière — correspondance', badge: { label: 'Ligne 45 (Sare) · Ligne TAD (Ainhoa)', type: 'bus' } },
      { label: 'Hendaye', meta: 'Toutes les 30 min · ~25 min', badge: { label: 'Ligne 4 — 1,30€', type: 'bus' } },
      { label: 'Biriatou', meta: 'Parking village — votre voiture', badge: { label: 'TAD Hendaye → Biriatou · Lun–Sam 7h30–19h', type: 'tad' }, last: true },
    ],
    infos: [
      { icon: '📞', label: 'Réservation TAD', sub: '05 47 75 76 64 · Lun–Sam 7h–20h' },
      { icon: '🚕', label: 'Taxi Ainhoa → Biriatou', sub: '~25–35€ · Option dimanche si TAD fermé' },
      { icon: '💳', label: 'Tarif bus', sub: '1,30€ / trajet · CB sans contact · plafond 3,70€/jour' },
    ],
  },
  {
    id: 'ossau',
    trekIds: ['ayous', 'artouste'],
    icon: '🏔',
    title: "Depuis Lacs d'Ayous / Artouste",
    meta: '→ Parking Bious-Oumettes',
    steps: [
      { label: "Gare lac d'Artouste", meta: 'Fin de boucle Artouste · 2100m', badge: { label: 'artouste.fr · ouvert 9h–15h · billet campeur', type: 'bus' } },
      { label: 'Télécabine de la Sagette', meta: 'Descente incluse dans le billet Artouste', badge: { label: 'Compris dans billet train · env. 25€', type: 'bus' } },
      { label: 'Parking Fabrèges', meta: '~1h15 total depuis gare d\'Artouste', last: false },
      { label: 'Parking Bious-Oumettes', meta: 'Votre voiture · 1422m · accès route D934', last: true },
    ],
    infos: [
      { icon: '🚶', label: "Alternative : descente à pied", sub: "Lacs d'Ayous → Bious-Oumettes par la boucle · ~2h30" },
      { icon: '🚕', label: 'Taxi Laruns', sub: 'Option si télécabine fermée · Pau Ossau Taxis · 06 87 xx xx xx' },
      { icon: '⚠️', label: 'Télécabine fermée oct–mai', sub: 'Hors saison, prévoir navette ou descente à pied obligatoire' },
    ],
  },
];

const BADGE_COLORS = {
  bus:  { bg: '#dbeafe', tc: '#1e40af' },
  tad:  { bg: '#fef3c7', tc: '#92400e' },
  taxi: { bg: '#f3e8ff', tc: '#6b21a8' },
};

// trek ID → which card to show
const TREK_TO_CARD: Record<string, string> = {
  gr10:     'gr10',
  ayous:    'ossau',
  artouste: 'ossau',
};

export default function RetourScreen() {
  const { activeTrekId } = useGpx();
  const activeTrek = activeTrekId ? TREKS.find(t => t.id === activeTrekId) : null;

  const visibleCards = activeTrekId
    ? CARDS.filter(c => c.id === TREK_TO_CARD[activeTrekId])
    : CARDS;

  const [expanded, setExpanded] = useState<Record<string, boolean>>(
    Object.fromEntries(CARDS.map(c => [c.id, c.id === (activeTrekId ? TREK_TO_CARD[activeTrekId] : 'gr10')]))
  );

  const toggle = (id: string) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <View style={[s.root, notebookBg as any]}>
      <ScrollView contentContainerStyle={s.scroll}>
        {/* Trek banner */}
        {activeTrek ? (
          <View style={[s.trekBanner, { borderLeftColor: activeTrek.color }]}>
            <View style={[s.trekDot, { backgroundColor: activeTrek.color }]} />
            <View style={{ flex: 1 }}>
              <Text style={s.trekBannerLabel}>Trek actif</Text>
              <Text style={s.trekBannerName}>{activeTrek.name}</Text>
            </View>
          </View>
        ) : (
          <View style={s.noTrekBanner}>
            <Text style={s.noTrekText}>Sélectionnez un trek dans l'onglet Treks pour filtrer les retours.</Text>
          </View>
        )}

        <Text style={s.sectionTitle}>
          {activeTrek ? 'Retour depuis ce trek' : 'Retour au départ'}
        </Text>

        {visibleCards.map(card => {
          const isOpen = !!expanded[card.id];
          return (
            <View key={card.id} style={s.card}>
              <TouchableOpacity style={s.cardHeader} onPress={() => toggle(card.id)} activeOpacity={0.75}>
                <Text style={s.cardIcon}>{card.icon}</Text>
                <Text style={s.cardTitle}>{card.title}</Text>
                <Text style={s.cardMeta}>{card.meta}</Text>
                <Text style={s.chevron}>{isOpen ? '▾' : '▸'}</Text>
              </TouchableOpacity>

              {isOpen && (
                <View style={s.cardBody}>
                  {card.steps.map((step, si) => (
                    <View key={si} style={s.step}>
                      <View style={s.stepLine}>
                        <View style={s.stepDot} />
                        {!step.last && <View style={s.stepConnector} />}
                      </View>
                      <View style={s.stepContent}>
                        <Text style={s.stepLabel}>{step.label}</Text>
                        <Text style={s.stepMeta}>{step.meta}</Text>
                        {step.badge && (
                          <View style={[s.stepBadge, { backgroundColor: BADGE_COLORS[step.badge.type].bg }]}>
                            <Text style={[s.stepBadgeText, { color: BADGE_COLORS[step.badge.type].tc }]}>
                              {step.badge.label}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  ))}

                  <View style={s.divider} />

                  {card.infos.map((info, ii) => (
                    <View key={ii} style={[s.infoRow, ii === card.infos.length - 1 && { borderBottomWidth: 0 }]}>
                      <Text style={s.infoIcon}>{info.icon}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={s.infoLabel}>{info.label}</Text>
                        <Text style={s.infoSub}>{info.sub}</Text>
                      </View>
                    </View>
                  ))}
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

  trekBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: C.paper2, borderRadius: 8, borderWidth: 1, borderColor: C.line,
    borderLeftWidth: 4, padding: 10, marginBottom: 12,
  },
  trekDot: { width: 8, height: 8, borderRadius: 4 },
  trekBannerLabel: { fontFamily: FF.mono, fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase', color: C.inkMuted },
  trekBannerName: { fontFamily: FF.display, fontSize: 13, fontWeight: '600', color: C.ink, letterSpacing: -0.3 },

  noTrekBanner: {
    backgroundColor: C.paper3, borderRadius: 8, borderWidth: 1, borderColor: C.line,
    padding: 10, marginBottom: 12,
  },
  noTrekText: { fontFamily: FF.mono, fontSize: 10, color: C.inkMuted, lineHeight: 15 },

  sectionTitle: {
    fontFamily: FF.display, fontSize: 18, fontWeight: '600', color: C.ink,
    letterSpacing: -0.5, marginBottom: 14,
  },

  card: {
    backgroundColor: C.paper2, borderWidth: 1, borderColor: C.line, borderRadius: 10,
    marginBottom: 12, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12,
  },
  cardIcon: { fontSize: 18 },
  cardTitle: { fontFamily: FF.display, fontSize: 15, fontWeight: '600', color: C.ink, flex: 1, letterSpacing: -0.3 },
  cardMeta: { fontFamily: FF.mono, fontSize: 10, color: C.accent, letterSpacing: 0.5, fontWeight: '500' },
  chevron: { fontFamily: FF.mono, fontSize: 12, color: C.inkMuted, marginLeft: 4 },

  cardBody: { borderTopWidth: 1, borderTopColor: C.line, padding: 14 },

  step: { flexDirection: 'row', gap: 12, paddingVertical: 10 },
  stepLine: { flexDirection: 'column', alignItems: 'center', width: 20, flexShrink: 0 },
  stepDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.accent },
  stepConnector: { flex: 1, width: 2, backgroundColor: C.line, marginTop: 3 },
  stepContent: { flex: 1 },
  stepLabel: { fontFamily: FF.mono, fontSize: 12, fontWeight: '500', color: C.ink },
  stepMeta: { fontFamily: FF.mono, fontSize: 10, color: C.inkMuted, marginTop: 2 },
  stepBadge: { alignSelf: 'flex-start', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2, marginTop: 4 },
  stepBadgeText: { fontFamily: FF.mono, fontSize: 9, letterSpacing: 0.3 },

  divider: { height: 1, backgroundColor: C.line, marginVertical: 12 },

  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.line2 },
  infoIcon: { fontSize: 16, width: 24, textAlign: 'center' },
  infoLabel: { fontFamily: FF.mono, fontSize: 12, color: C.ink, fontWeight: '500' },
  infoSub: { fontFamily: FF.mono, fontSize: 10, color: C.inkMuted, marginTop: 1 },
});
