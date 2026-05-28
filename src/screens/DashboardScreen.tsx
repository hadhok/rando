import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  TextInput,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { C, FF, notebookBg, injectFonts } from '../theme';
import { TREKS, Trek, StageRow, BadgeType } from '../data/treks';
import { CHECKLIST_DATA } from '../data/checklist';
import ElevationProfile from '../components/ElevationProfile';
import { useGpx } from '../context/GpxContext';

const CHECKED_KEY = 'rando_checked_v1';

const BADGE_INFO: Record<BadgeType, { bg: string; tc: string; label: string }> = {
  water:   { bg: '#dbeafe', tc: '#1e40af', label: 'eau' },
  village: { bg: '#d1fae5', tc: '#065f46', label: 'village' },
  biv:     { bg: '#fef3c7', tc: '#92400e', label: 'bivouac' },
  refuge:  { bg: '#f3e8ff', tc: '#6b21a8', label: 'refuge' },
};

const DIFF_INFO = {
  1: { bg: '#d1fae5', tc: '#065f46', label: 'Facile' },
  2: { bg: '#fef3c7', tc: '#92400e', label: 'Modéré' },
  3: { bg: '#fee2e2', tc: '#991b1b', label: 'Difficile' },
};

function computePct(checked: Record<string, boolean>): number {
  let total = 0, done = 0;
  CHECKLIST_DATA.forEach(s => s.items.forEach(i => { total++; if (checked[i.id]) done++; }));
  return total > 0 ? Math.round((done / total) * 100) : 0;
}

function Badge({ type }: { type: BadgeType }) {
  const b = BADGE_INFO[type];
  return (
    <View style={[s.badge, { backgroundColor: b.bg }]}>
      <Text style={[s.badgeText, { color: b.tc }]}>{b.label}</Text>
    </View>
  );
}

function StageTableRow({ row }: { row: StageRow }) {
  const bgColor =
    row.rowType === 'biv'       ? 'rgba(200,80,42,0.06)' :
    row.rowType === 'highlight' ? 'rgba(45,106,58,0.06)' : 'transparent';
  const dpPositive = row.dp.startsWith('+');
  const dpNegative = row.dp.startsWith('-');

  return (
    <View style={[s.stageRow, { backgroundColor: bgColor }]}>
      <View style={s.stageNameCell}>
        <Text style={s.stageName}>{row.name}</Text>
        {row.badges && (
          <View style={s.stageBadges}>
            {row.badges.map(b => <Badge key={b} type={b} />)}
          </View>
        )}
      </View>
      <Text style={s.stageCell}>{row.dist}</Text>
      <View style={[s.stageCellAlt, s.altBadge]}>
        <Text style={s.altText}>{row.alt}</Text>
      </View>
      <Text style={[s.stageCell, dpPositive ? s.dpPlus : dpNegative ? s.dpMinus : null]}>{row.dp}</Text>
      <Text style={[s.stageCell, s.timeCell]}>{row.time}</Text>
    </View>
  );
}

function TrekDetail({
  trek,
  initialNote,
  onNoteChange,
  onClose,
}: {
  trek: Trek;
  initialNote: string;
  onNoteChange: (text: string) => void;
  onClose: () => void;
}) {
  const [myNotes, setMyNotes] = useState(initialNote);
  const [saved, setSaved] = useState(false);

  const handleNotesChange = (text: string) => {
    setMyNotes(text);
    setSaved(false);
    onNoteChange(text);
    setSaved(true);
  };

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={[s.detailContainer, notebookBg as any]}>
        <View style={s.detailHeader}>
          <TouchableOpacity onPress={onClose} style={s.backBtn}>
            <Text style={s.backBtnText}>←</Text>
          </TouchableOpacity>
          <Text style={s.detailTitle} numberOfLines={1}>{trek.name}</Text>
        </View>
        <ScrollView
          style={s.detailScroll}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Elevation */}
          <View style={s.elevContainer}>
            <Text style={s.elevTitle}>Profil altimétrique</Text>
            <ElevationProfile path={trek.detailElevPath} color={trek.color} height={80} />
          </View>

          {/* Days */}
          {trek.trekDays.map((day, di) => (
            <View key={di}>
              <View style={s.dayHeader}>
                <Text style={s.dayHeaderText}>{day.title}</Text>
              </View>
              <View style={s.stageHeaderRow}>
                <Text style={[s.stageHeaderCell, { flex: 2 }]}>Étape</Text>
                <Text style={s.stageHeaderCell}>Dist.</Text>
                <Text style={s.stageHeaderCell}>Alt.</Text>
                <Text style={s.stageHeaderCell}>D+</Text>
                <Text style={s.stageHeaderCell}>Heure</Text>
              </View>
              {day.stages.map((row, ri) => (
                <StageTableRow key={ri} row={row} />
              ))}
            </View>
          ))}

          {/* Logistique */}
          <View style={s.notesCard}>
            {trek.notes.map((n, i) => (
              <View key={i} style={[s.infoRow, i === trek.notes.length - 1 && { borderBottomWidth: 0 }]}>
                <Text style={s.infoIcon}>{n.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={s.infoLabel}>{n.label}</Text>
                  <Text style={s.infoSub}>{n.sub}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Mes notes */}
          <View style={s.myNotesSection}>
            <View style={s.myNotesHeader}>
              <Text style={s.myNotesTitle}>✏ Mes notes</Text>
              {saved && myNotes.trim().length > 0 && (
                <Text style={s.savedLabel}>Sauvegardé</Text>
              )}
            </View>
            <TextInput
              style={s.myNotesInput}
              multiline
              value={myNotes}
              onChangeText={handleNotesChange}
              placeholder={"Pensées, idées, rappels sur ce trek…\n\nEx: partir tôt le J1, prévoir ravito Sare, vérifier météo 48h avant…"}
              placeholderTextColor={`${C.ink}55`}
              textAlignVertical="top"
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

export default function DashboardScreen() {
  injectFonts();
  const { trekNotes, setTrekNote } = useGpx();
  const [selectedTrek, setSelectedTrek] = useState<Trek | null>(null);
  const [checkPct, setCheckPct] = useState(0);
  const [isOnline, setIsOnline] = useState(true);

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem(CHECKED_KEY).then(raw => {
        const checked = raw ? JSON.parse(raw) : {};
        setCheckPct(computePct(checked));
      });
      if (Platform.OS === 'web') setIsOnline(navigator.onLine);
    }, [])
  );

  const STATS = [
    { val: `${TREKS.length}`, lbl: 'Treks planifiés', accent: true },
    { val: '34km', lbl: 'GR10 planifié' },
    { val: '6J', lbl: 'Bivouacs prévus' },
    { val: `${checkPct}%`, lbl: 'Sac préparé' },
  ];

  return (
    <View style={[s.root, notebookBg as any]}>
      <ScrollView contentContainerStyle={s.scroll}>
        {/* Online banner */}
        <View style={[s.banner, isOnline ? s.bannerOnline : s.bannerOffline]}>
          <Text style={s.bannerDot}>◉</Text>
          <Text style={s.bannerText}>
            {isOnline ? 'Données disponibles — mode offline activé' : 'Mode offline — toutes les données disponibles'}
          </Text>
        </View>

        {/* Stats grid */}
        <View style={s.statsGrid}>
          {STATS.map((stat, i) => (
            <View key={i} style={[s.statCard, stat.accent && s.statCardAccent]}>
              <Text style={[s.statVal, stat.accent && { color: C.paper }]}>{stat.val}</Text>
              <Text style={[s.statLbl, stat.accent && { color: C.paper }]}>{stat.lbl}</Text>
            </View>
          ))}
        </View>

        {/* Section title */}
        <Text style={s.sectionTitle}>Mes treks</Text>

        {/* Trek cards */}
        {TREKS.map(trek => {
          const diff = DIFF_INFO[trek.difficulty];
          return (
            <TouchableOpacity key={trek.id} style={s.trekCard} onPress={() => setSelectedTrek(trek)} activeOpacity={0.85}>
              <View style={s.trekHero}>
                <ElevationProfile path={trek.cardElevPath} color={trek.color} height={80} />
              </View>
              <View style={s.trekInfo}>
                <View style={s.trekNameRow}>
                  <Text style={s.trekName}>{trek.name}</Text>
                  {trekNotes[trek.id]?.trim() ? (
                    <View style={s.notesDot}>
                      <Text style={s.notesDotText}>✏</Text>
                    </View>
                  ) : null}
                </View>
                <View style={s.trekTags}>
                  <View style={[s.tag, { backgroundColor: C.ink }]}>
                    <Text style={[s.tagText, { color: C.paper }]}>{trek.days} jours</Text>
                  </View>
                  <View style={[s.tag, { backgroundColor: C.accent2 }]}>
                    <Text style={[s.tagText, { color: C.ink }]}>Bivouac</Text>
                  </View>
                  <View style={[s.tag, { backgroundColor: diff.bg }]}>
                    <Text style={[s.tagText, { color: diff.tc }]}>{diff.label}</Text>
                  </View>
                </View>
                <View style={s.trekStats}>
                  {[
                    { val: trek.distance, lbl: 'Distance' },
                    { val: trek.dp, lbl: 'D+' },
                    { val: trek.region, lbl: 'Région' },
                    { val: trek.maxAlt, lbl: 'Max alt.' },
                  ].map((st, i) => (
                    <View key={i} style={s.statBox}>
                      <Text style={s.statBoxVal}>{st.val}</Text>
                      <Text style={s.statBoxLbl}>{st.lbl}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {selectedTrek && (
        <TrekDetail
          trek={selectedTrek}
          initialNote={trekNotes[selectedTrek.id] ?? ''}
          onNoteChange={(text) => setTrekNote(selectedTrek.id, text)}
          onClose={() => setSelectedTrek(null)}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.paper },
  scroll: { padding: 16, paddingBottom: 32 },

  banner: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 8, marginBottom: 14 },
  bannerOnline: { backgroundColor: C.green },
  bannerOffline: { backgroundColor: C.ink },
  bannerDot: { color: C.paper, fontSize: 12 },
  bannerText: { color: C.paper, fontSize: 10, letterSpacing: 0.5, fontFamily: FF.mono, flex: 1 },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
  statCard: {
    flex: 1, minWidth: '45%', backgroundColor: C.paper2, borderWidth: 1, borderColor: C.line,
    borderRadius: 10, padding: 14,
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, elevation: 2,
  },
  statCardAccent: { backgroundColor: C.accent, borderColor: C.accent },
  statVal: { fontFamily: FF.display, fontSize: 28, fontWeight: '700', color: C.ink, lineHeight: 32 },
  statLbl: { fontFamily: FF.mono, fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', opacity: 0.6, color: C.ink, marginTop: 4 },

  sectionTitle: {
    fontFamily: FF.display, fontSize: 18, fontWeight: '600', color: C.ink,
    letterSpacing: -0.5, marginBottom: 14,
  },

  trekCard: {
    backgroundColor: C.paper2, borderWidth: 1, borderColor: C.line, borderRadius: 10,
    marginBottom: 12, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, elevation: 2,
  },
  trekHero: { overflow: 'hidden' },
  trekInfo: { padding: 12 },
  trekNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  trekName: { fontFamily: FF.display, fontSize: 16, fontWeight: '600', color: C.ink, letterSpacing: -0.3, flex: 1 },
  notesDot: { backgroundColor: 'rgba(232,160,48,0.2)', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: C.accent2 },
  notesDotText: { fontSize: 10 },
  trekTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  tag: { borderRadius: 20, paddingHorizontal: 7, paddingVertical: 2 },
  tagText: { fontSize: 9, letterSpacing: 0.5, textTransform: 'uppercase', fontWeight: '500', fontFamily: FF.mono },
  trekStats: { flexDirection: 'row', gap: 6 },
  statBox: { flex: 1, backgroundColor: C.paper3, borderRadius: 6, padding: 5, alignItems: 'center' },
  statBoxVal: { fontFamily: FF.mono, fontSize: 12, fontWeight: '500', color: C.ink },
  statBoxLbl: { fontFamily: FF.mono, fontSize: 8, color: C.ink, opacity: 0.5, letterSpacing: 0.5, textTransform: 'uppercase', marginTop: 1 },

  // Detail modal
  detailContainer: { flex: 1, backgroundColor: C.paper },
  detailHeader: { backgroundColor: C.ink, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  backBtn: { padding: 4 },
  backBtnText: { color: C.paper, fontSize: 22, lineHeight: 26 },
  detailTitle: { fontFamily: FF.display, fontSize: 18, fontWeight: '600', color: C.paper, flex: 1, letterSpacing: -0.3 },
  detailScroll: { flex: 1 },

  elevContainer: { backgroundColor: C.paper3, borderRadius: 8, padding: 10, borderWidth: 1, borderColor: C.line, marginBottom: 16, overflow: 'hidden' },
  elevTitle: { fontFamily: FF.mono, fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', opacity: 0.5, color: C.ink, marginBottom: 6 },

  dayHeader: { backgroundColor: C.ink2, borderRadius: 6, paddingHorizontal: 12, paddingVertical: 8, marginTop: 14, marginBottom: 4 },
  dayHeaderText: { fontFamily: FF.mono, fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', color: C.paper },

  stageHeaderRow: { flexDirection: 'row', paddingHorizontal: 4, paddingBottom: 4, borderBottomWidth: 1, borderBottomColor: C.line },
  stageHeaderCell: { flex: 1, fontFamily: FF.mono, fontSize: 8, letterSpacing: 0.8, textTransform: 'uppercase', opacity: 0.5, color: C.ink, textAlign: 'left' },

  stageRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 7, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: C.line2 },
  stageNameCell: { flex: 2 },
  stageName: { fontFamily: FF.mono, fontSize: 11, color: C.ink },
  stageBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: 3, marginTop: 2 },
  badge: { borderRadius: 3, paddingHorizontal: 4, paddingVertical: 1 },
  badgeText: { fontFamily: FF.mono, fontSize: 7, letterSpacing: 0.3 },
  stageCell: { flex: 1, fontFamily: FF.mono, fontSize: 10, color: C.ink },
  stageCellAlt: { flex: 1 },
  altBadge: { backgroundColor: C.paper3, borderRadius: 3, paddingHorizontal: 4, paddingVertical: 1, alignSelf: 'flex-start', borderWidth: 1, borderColor: C.line },
  altText: { fontFamily: FF.mono, fontSize: 9, color: C.ink },
  dpPlus: { color: C.green },
  dpMinus: { color: C.accent },
  timeCell: { color: C.blue },

  notesCard: { backgroundColor: C.paper2, borderRadius: 10, borderWidth: 1, borderColor: C.line, marginTop: 14, overflow: 'hidden' },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.line2 },
  infoIcon: { fontSize: 16, width: 24, textAlign: 'center' },
  infoLabel: { fontFamily: FF.mono, fontSize: 12, color: C.ink, fontWeight: '500' },
  infoSub: { fontFamily: FF.mono, fontSize: 10, color: C.ink, opacity: 0.5, marginTop: 1 },

  myNotesSection: {
    marginTop: 14, borderRadius: 10, borderWidth: 1.5,
    borderColor: C.accent2, backgroundColor: 'rgba(232,160,48,0.06)', overflow: 'hidden',
  },
  myNotesHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingTop: 10, paddingBottom: 6,
    borderBottomWidth: 1, borderBottomColor: 'rgba(232,160,48,0.2)',
  },
  myNotesTitle: {
    fontFamily: FF.mono, fontSize: 10, letterSpacing: 0.8,
    textTransform: 'uppercase', color: C.accent2, fontWeight: '500',
  },
  savedLabel: {
    fontFamily: FF.mono, fontSize: 9, color: C.green, letterSpacing: 0.5,
  },
  myNotesInput: {
    fontFamily: FF.mono, fontSize: 12, color: C.ink,
    padding: 12, minHeight: 120, lineHeight: 20,
  },
});
