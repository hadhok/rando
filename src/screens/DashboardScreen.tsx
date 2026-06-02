import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Modal, SafeAreaView, TextInput, Platform,
  Animated, PanResponder,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { C, FF, notebookBg, injectFonts } from '../theme';
import { TREKS, Trek, StageRow, BadgeType } from '../data/treks';
import { CHECKLIST_DATA } from '../data/checklist';
import ElevationProfile from '../components/ElevationProfile';
import DateInput from '../components/DateInput';
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

function daysUntil(dateStr: string): number | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  const diff = Math.ceil((d.getTime() - Date.now()) / 86400000);
  return diff;
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
  const bg = row.rowType === 'biv' ? 'rgba(200,80,42,0.06)' : row.rowType === 'highlight' ? 'rgba(45,106,58,0.06)' : 'transparent';
  return (
    <View style={[s.stageRow, { backgroundColor: bg }]}>
      <View style={s.stageNameCell}>
        <Text style={s.stageName}>{row.name}</Text>
        {row.badges && <View style={s.stageBadges}>{row.badges.map(b => <Badge key={b} type={b} />)}</View>}
      </View>
      <Text style={s.stageCell}>{row.dist}</Text>
      <View style={[s.stageCellAlt, s.altBadge]}><Text style={s.altText}>{row.alt}</Text></View>
      <Text style={[s.stageCell, row.dp.startsWith('+') ? s.dpPlus : row.dp.startsWith('-') ? s.dpMinus : null]}>{row.dp}</Text>
      <Text style={[s.stageCell, s.timeCell]}>{row.time}</Text>
    </View>
  );
}

function TrekDetail({
  trek, initialNote, onNoteChange,
  isActive, onActivate,
  departureDate, onDateChange,
  onClose,
}: {
  trek: Trek;
  initialNote: string;
  onNoteChange: (text: string) => void;
  isActive: boolean;
  onActivate: () => void;
  departureDate: string;
  onDateChange: (d: string) => void;
  onClose: () => void;
}) {
  const [myNotes, setMyNotes] = useState(initialNote);
  const [saved, setSaved] = useState(false);

  // Swipe to dismiss
  const panY = useRef(new Animated.Value(0)).current;
  const panResponder = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_, { dy, dx }) => dy > 6 && dy > Math.abs(dx),
    onPanResponderMove: (_, { dy }) => { if (dy > 0) panY.setValue(dy); },
    onPanResponderRelease: (_, { dy, vy }) => {
      if (dy > 120 || vy > 0.5) {
        onClose();
      } else {
        Animated.spring(panY, { toValue: 0, useNativeDriver: true }).start();
      }
    },
  })).current;

  const handleNotesChange = (text: string) => {
    setMyNotes(text);
    setSaved(false);
    onNoteChange(text);
    setSaved(true);
  };

  const countdown = daysUntil(departureDate);

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <Animated.View style={[{ flex: 1 }, { transform: [{ translateY: panY }] }]}>
        <SafeAreaView style={[s.detailContainer, notebookBg as any]}>
          {/* Swipe handle */}
          <View {...panResponder.panHandlers} style={s.handleArea}>
            <View style={s.handleBar} />
          </View>

          {/* Header */}
          <View style={s.detailHeader}>
            <TouchableOpacity onPress={onClose} style={s.backBtn}>
              <Text style={s.backBtnText}>←</Text>
            </TouchableOpacity>
            <Text style={s.detailTitle} numberOfLines={1}>{trek.name}</Text>
            <TouchableOpacity
              onPress={onActivate}
              style={[s.activateBtn, isActive && s.activateBtnActive]}
            >
              <Text style={[s.activateBtnText, isActive && { color: C.paper }]}>
                {isActive ? '▶ ACTIF' : 'Activer'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={s.detailScroll}
            contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
            keyboardShouldPersistTaps="handled"
          >
            {/* Date de départ */}
            <View style={s.dateRow}>
              <Text style={s.dateLabel}>📅 Départ</Text>
              <DateInput value={departureDate} onChange={onDateChange} />
              {countdown !== null && (
                <View style={[s.countdownBadge, countdown <= 0 ? s.countdownNow : countdown <= 7 ? s.countdownSoon : {}]}>
                  <Text style={s.countdownText}>
                    {countdown < 0 ? `il y a ${Math.abs(countdown)}j` : countdown === 0 ? "Aujourd'hui !" : `dans ${countdown}j`}
                  </Text>
                </View>
              )}
            </View>

            {/* Elevation */}
            <View style={s.elevContainer}>
              <Text style={s.elevTitle}>Profil altimétrique</Text>
              <ElevationProfile path={trek.detailElevPath} color={trek.color} height={80} />
            </View>

            {/* Days */}
            {trek.trekDays.map((day, di) => (
              <View key={di}>
                <View style={s.dayHeader}><Text style={s.dayHeaderText}>{day.title}</Text></View>
                <View style={s.stageHeaderRow}>
                  <Text style={[s.stageHeaderCell, { flex: 2 }]}>Étape</Text>
                  <Text style={s.stageHeaderCell}>Dist.</Text>
                  <Text style={s.stageHeaderCell}>Alt.</Text>
                  <Text style={s.stageHeaderCell}>D+</Text>
                  <Text style={s.stageHeaderCell}>Heure</Text>
                </View>
                {day.stages.map((row, ri) => <StageTableRow key={ri} row={row} />)}
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
                {saved && myNotes.trim().length > 0 && <Text style={s.savedLabel}>Sauvegardé ✓</Text>}
              </View>
              <TextInput
                style={s.myNotesInput}
                multiline
                value={myNotes}
                onChangeText={handleNotesChange}
                placeholder={"Pensées, idées, rappels sur ce trek…\n\nEx: partir tôt le J1, prévoir ravito Sare…"}
                placeholderTextColor={`${C.ink}55`}
                textAlignVertical="top"
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </Animated.View>
    </Modal>
  );
}

export default function DashboardScreen() {
  injectFonts();
  const { trekNotes, setTrekNote, activeTrekId, setActiveTrekId, trekDates, setTrekDate, stagesDone } = useGpx();
  const [selectedTrek, setSelectedTrek] = useState<Trek | null>(null);
  const [checkPct, setCheckPct] = useState(0);
  const [isOnline, setIsOnline] = useState(true);

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem(CHECKED_KEY).then(raw => {
        setCheckPct(computePct(raw ? JSON.parse(raw) : {}));
      });
      if (Platform.OS === 'web') setIsOnline(navigator.onLine);
    }, [])
  );

  const activeTrek = TREKS.find(t => t.id === activeTrekId);

  const depDate = activeTrek ? (trekDates[activeTrek.id] ?? '') : '';
  const daysUntilDep = activeTrek && depDate ? daysUntil(depDate) : null;
  // trekDayIdx: 0-based index of current day during trek (null = not in trek)
  const trekDayIdx = (daysUntilDep !== null && daysUntilDep <= 0 && activeTrek && -daysUntilDep < activeTrek.days)
    ? -daysUntilDep : null;

  const allTrekStages = activeTrek
    ? activeTrek.trekDays.flatMap((day, di) =>
        day.stages.map((st, si) => ({ ...st, stageKey: `${activeTrek.id}-j${di}-s${si}` }))
      )
    : [];
  const stageDoneCount = allTrekStages.filter(st => stagesDone[st.stageKey]).length;
  const nextPendingStage = allTrekStages.find(st => !stagesDone[st.stageKey]) ?? null;
  const inTrek = trekDayIdx !== null;
  const preImminent = !inTrek && daysUntilDep !== null && daysUntilDep > 0 && daysUntilDep <= 7;

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
          {[
            { val: `${TREKS.length}`, lbl: 'Treks planifiés', accent: true },
            { val: activeTrek ? activeTrek.distance : '—', lbl: activeTrek ? `${activeTrek.name.split(' ')[0]}` : 'Trek actif' },
            { val: activeTrek ? daysUntil(trekDates[activeTrek.id] ?? '') !== null ? `${daysUntil(trekDates[activeTrek.id])!}j` : `${activeTrek.days}J` : '—', lbl: activeTrek && daysUntil(trekDates[activeTrek.id] ?? '') !== null ? 'Avant départ' : 'Durée' },
            { val: `${checkPct}%`, lbl: 'Sac préparé' },
          ].map((stat, i) => (
            <View key={i} style={[s.statCard, stat.accent && s.statCardAccent]}>
              <Text style={[s.statVal, stat.accent && { color: C.paper }]}>{stat.val}</Text>
              <Text style={[s.statLbl, stat.accent && { color: C.paper }]}>{stat.lbl}</Text>
            </View>
          ))}
        </View>

        {/* Situation card — in trek or imminent */}
        {activeTrek && inTrek && (
          <View style={[s.situCard, { borderLeftColor: activeTrek.color }]}>
            <View style={s.situHeader}>
              <Text style={s.situLabel}>🏃 En trek</Text>
              <Text style={s.situDay}>Jour {trekDayIdx! + 1} / {activeTrek.days}</Text>
            </View>
            <Text style={s.situTrekName}>{activeTrek.name}</Text>
            <View style={s.situProgressRow}>
              <View style={s.situBar}>
                <View style={[s.situBarFill, {
                  width: `${allTrekStages.length > 0 ? (stageDoneCount / allTrekStages.length) * 100 : 0}%` as any,
                  backgroundColor: activeTrek.color,
                }]} />
              </View>
              <Text style={s.situProgressText}>{stageDoneCount}/{allTrekStages.length} étapes</Text>
            </View>
            {nextPendingStage && (
              <View style={s.situNextRow}>
                <Text style={s.situNextLabel}>Prochain</Text>
                <Text style={s.situNextName}>{nextPendingStage.name}</Text>
                <Text style={s.situNextMeta}>{nextPendingStage.dist} · {nextPendingStage.time}</Text>
              </View>
            )}
            {stageDoneCount === allTrekStages.length && allTrekStages.length > 0 && (
              <Text style={s.situComplete}>✓ Toutes les étapes terminées !</Text>
            )}
          </View>
        )}
        {activeTrek && preImminent && (
          <View style={[s.situCard, { borderLeftColor: activeTrek.color }]}>
            <View style={s.situHeader}>
              <Text style={s.situLabel}>⏰ Départ imminent</Text>
              <Text style={s.situDay}>dans {daysUntilDep}j</Text>
            </View>
            <Text style={s.situTrekName}>{activeTrek.name}</Text>
            <Text style={s.situMeta}>{activeTrek.distance} · {activeTrek.dp} · {activeTrek.days} jours · {activeTrek.maxAlt}</Text>
          </View>
        )}

        <Text style={s.sectionTitle}>Mes treks</Text>

        {TREKS.map(trek => {
          const diff = DIFF_INFO[trek.difficulty];
          const isActive = trek.id === activeTrekId;
          const countdown = daysUntil(trekDates[trek.id] ?? '');
          return (
            <TouchableOpacity
              key={trek.id}
              style={[s.trekCard, isActive && s.trekCardActive]}
              onPress={() => setSelectedTrek(trek)}
              activeOpacity={0.85}
            >
              {/* Active ribbon */}
              {isActive && (
                <View style={s.activeRibbon}>
                  <Text style={s.activeRibbonText}>▶ ACTIF</Text>
                </View>
              )}

              <View style={s.trekHero}>
                <ElevationProfile path={trek.cardElevPath} color={trek.color} height={80} />
              </View>
              <View style={s.trekInfo}>
                <View style={s.trekNameRow}>
                  <Text style={s.trekName}>{trek.name}</Text>
                  {trekNotes[trek.id]?.trim() ? (
                    <View style={s.notesDot}><Text style={s.notesDotText}>✏</Text></View>
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
                  {countdown !== null && (
                    <View style={[s.tag, { backgroundColor: countdown <= 7 ? C.accent : C.paper3, borderWidth: 1, borderColor: C.line }]}>
                      <Text style={[s.tagText, { color: countdown <= 7 ? C.paper : C.ink }]}>
                        {countdown <= 0 ? "Aujourd'hui" : `dans ${countdown}j`}
                      </Text>
                    </View>
                  )}
                </View>
                <View style={s.trekStats}>
                  {[
                    { val: trek.distance, lbl: 'Distance' },
                    { val: trek.dp,       lbl: 'D+' },
                    { val: trek.region,   lbl: 'Région' },
                    { val: trek.maxAlt,   lbl: 'Max alt.' },
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
          isActive={selectedTrek.id === activeTrekId}
          onActivate={() => setActiveTrekId(selectedTrek.id === activeTrekId ? null : selectedTrek.id)}
          departureDate={trekDates[selectedTrek.id] ?? ''}
          onDateChange={(d) => setTrekDate(selectedTrek.id, d)}
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
  statCard: { flex: 1, minWidth: '45%', backgroundColor: C.paper2, borderWidth: 1, borderColor: C.line, borderRadius: 10, padding: 14, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, elevation: 2 },
  statCardAccent: { backgroundColor: C.accent, borderColor: C.accent },
  statVal: { fontFamily: FF.display, fontSize: 28, fontWeight: '700', color: C.ink, lineHeight: 32 },
  statLbl: { fontFamily: FF.mono, fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', color: C.inkMuted, marginTop: 4 },

  situCard: { backgroundColor: C.paper2, borderRadius: 10, borderWidth: 1, borderColor: C.line, borderLeftWidth: 4, padding: 14, marginBottom: 14 },
  situHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  situLabel: { fontFamily: FF.mono, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: C.inkMuted },
  situDay: { fontFamily: FF.mono, fontSize: 11, color: C.ink, fontWeight: '600' },
  situTrekName: { fontFamily: FF.display, fontSize: 14, fontWeight: '600', color: C.ink, letterSpacing: -0.3, marginBottom: 8 },
  situProgressRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  situBar: { flex: 1, height: 5, backgroundColor: C.line, borderRadius: 3, overflow: 'hidden' },
  situBarFill: { height: 5, borderRadius: 3 },
  situProgressText: { fontFamily: FF.mono, fontSize: 10, color: C.inkMuted },
  situNextRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.paper3, borderRadius: 6, padding: 8, borderWidth: 1, borderColor: C.line2 },
  situNextLabel: { fontFamily: FF.mono, fontSize: 9, letterSpacing: 0.8, textTransform: 'uppercase', color: C.inkMuted },
  situNextName: { fontFamily: FF.mono, fontSize: 11, fontWeight: '600', color: C.ink, flex: 1 },
  situNextMeta: { fontFamily: FF.mono, fontSize: 10, color: C.blue },
  situComplete: { fontFamily: FF.mono, fontSize: 11, color: C.green, fontWeight: '600', textAlign: 'center', paddingTop: 4 },
  situMeta: { fontFamily: FF.mono, fontSize: 10, color: C.inkMuted },

  sectionTitle: { fontFamily: FF.display, fontSize: 18, fontWeight: '600', color: C.ink, letterSpacing: -0.5, marginBottom: 14 },

  trekCard: { backgroundColor: C.paper2, borderWidth: 1, borderColor: C.line, borderRadius: 10, marginBottom: 12, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, elevation: 2 },
  trekCardActive: { borderWidth: 2, borderColor: C.accent },
  activeRibbon: { position: 'absolute', top: 10, right: 10, zIndex: 10, backgroundColor: C.accent, borderRadius: 4, paddingHorizontal: 7, paddingVertical: 3 },
  activeRibbonText: { fontFamily: FF.mono, fontSize: 8, color: C.paper, fontWeight: '700', letterSpacing: 0.8 },

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
  statBoxLbl: { fontFamily: FF.mono, fontSize: 10, color: C.inkMuted, letterSpacing: 0.5, textTransform: 'uppercase', marginTop: 1 },

  // Detail modal
  handleArea: { alignItems: 'center', paddingVertical: 10, backgroundColor: C.paper },
  handleBar: { width: 36, height: 4, backgroundColor: C.line, borderRadius: 2 },

  detailContainer: { flex: 1, backgroundColor: C.paper },
  detailHeader: { backgroundColor: C.ink, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { padding: 4 },
  backBtnText: { color: C.paper, fontSize: 22, lineHeight: 26 },
  detailTitle: { fontFamily: FF.display, fontSize: 17, fontWeight: '600', color: C.paper, flex: 1, letterSpacing: -0.3 },
  activateBtn: { borderRadius: 6, borderWidth: 1, borderColor: 'rgba(244,240,232,0.4)', paddingHorizontal: 10, paddingVertical: 5 },
  activateBtnActive: { backgroundColor: C.accent, borderColor: C.accent },
  activateBtnText: { fontFamily: FF.mono, fontSize: 9, color: 'rgba(244,240,232,0.8)', letterSpacing: 0.8, textTransform: 'uppercase' },

  detailScroll: { flex: 1 },

  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.paper2, borderRadius: 8, padding: 12, marginBottom: 14, borderWidth: 1, borderColor: C.line },
  dateLabel: { fontFamily: FF.mono, fontSize: 12, color: C.ink, fontWeight: '500' },
  countdownBadge: { backgroundColor: C.paper3, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: C.line },
  countdownSoon: { backgroundColor: 'rgba(200,80,42,0.12)', borderColor: C.accent },
  countdownNow: { backgroundColor: C.accent },
  countdownText: { fontFamily: FF.mono, fontSize: 10, color: C.ink, fontWeight: '600' },

  elevContainer: { backgroundColor: C.paper3, borderRadius: 8, padding: 10, borderWidth: 1, borderColor: C.line, marginBottom: 16, overflow: 'hidden' },
  elevTitle: { fontFamily: FF.mono, fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', color: C.inkMuted, marginBottom: 6 },

  dayHeader: { backgroundColor: C.ink2, borderRadius: 6, paddingHorizontal: 12, paddingVertical: 8, marginTop: 14, marginBottom: 4 },
  dayHeaderText: { fontFamily: FF.mono, fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', color: C.paper },

  stageHeaderRow: { flexDirection: 'row', paddingHorizontal: 4, paddingBottom: 4, borderBottomWidth: 1, borderBottomColor: C.line },
  stageHeaderCell: { flex: 1, fontFamily: FF.mono, fontSize: 10, letterSpacing: 0.8, textTransform: 'uppercase', color: C.inkMuted },

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
  infoSub: { fontFamily: FF.mono, fontSize: 10, color: C.inkMuted, marginTop: 1 },

  myNotesSection: { marginTop: 14, borderRadius: 10, borderWidth: 1.5, borderColor: C.accent2, backgroundColor: 'rgba(232,160,48,0.06)', overflow: 'hidden' },
  myNotesHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingTop: 10, paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: 'rgba(232,160,48,0.2)' },
  myNotesTitle: { fontFamily: FF.mono, fontSize: 10, letterSpacing: 0.8, textTransform: 'uppercase', color: C.accent2, fontWeight: '500' },
  savedLabel: { fontFamily: FF.mono, fontSize: 9, color: C.green, letterSpacing: 0.5 },
  myNotesInput: { fontFamily: FF.mono, fontSize: 12, color: C.ink, padding: 12, minHeight: 120, lineHeight: 20 },
});
