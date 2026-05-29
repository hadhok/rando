import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { C, FF, notebookBg } from '../theme';
import { useGpx, JournalEntry } from '../context/GpxContext';
import { TREKS } from '../data/treks';
import { StageRow } from '../data/treks';

// ─── Types ────────────────────────────────────────────────────────────────────

type FlatStage = StageRow & {
  key: string;
  dayIdx: number;
  stageIdx: number;
  dayTitle: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseKm(dist: string): number {
  return parseFloat(dist.replace('km', '').replace('~', '')) || 0;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function fmtDate(iso: string): string {
  const d = new Date(iso + 'T12:00:00');
  return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
}

function dayNumber(departureDate: string | undefined, entryDate: string): string {
  if (!departureDate) return '';
  const diff = Math.round((new Date(entryDate).getTime() - new Date(departureDate).getTime()) / 86400000);
  return diff >= 0 ? `J${diff + 1}` : '';
}

// ─── Constants ────────────────────────────────────────────────────────────────

const METEO_OPTS = ['☀️', '🌤', '⛅', '🌧', '⛈'];
const HUMEUR_OPTS = ['😁', '😊', '😐', '😓', '🥵'];

const BADGE_ICONS: Record<string, string> = {
  water: '💧', biv: '⛺', village: '🏘', refuge: '🏠',
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function JournalScreen() {
  const {
    activeTrekId, trekDates,
    stagesDone, setStagesDone,
    journalEntries, setJournalEntry, deleteJournalEntry,
  } = useGpx();

  const activeTrek = activeTrekId ? TREKS.find(t => t.id === activeTrekId) : null;
  const departureDate = activeTrekId ? trekDates[activeTrekId] : undefined;

  const [openDays, setOpenDays]         = useState<Record<string, boolean>>({});
  const [showForm, setShowForm]         = useState(false);
  const [editingId, setEditingId]       = useState<string | null>(null);
  const [formDate, setFormDate]         = useState(today());
  const [formText, setFormText]         = useState('');
  const [formMeteo, setFormMeteo]       = useState(METEO_OPTS[0]);
  const [formHumeur, setFormHumeur]     = useState(HUMEUR_OPTS[1]);
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);

  // Open current day by default on focus
  useFocusEffect(useCallback(() => {
    if (!activeTrek) return;
    const todayIso = today();
    const dayIdx = departureDate
      ? Math.max(0, Math.min(activeTrek.trekDays.length - 1,
          Math.round((new Date(todayIso).getTime() - new Date(departureDate).getTime()) / 86400000)
        ))
      : 0;
    setOpenDays(prev => ({ ...prev, [`d${dayIdx}`]: true }));
  }, [activeTrek, departureDate]));

  // ── Progression data ──────────────────────────────────────────────────────

  const allStages: FlatStage[] = activeTrek
    ? activeTrek.trekDays.flatMap((day, di) =>
        day.stages.map((stage, si) => ({
          ...stage,
          key: `${activeTrekId!}-j${di}-s${si}`,
          dayIdx: di,
          stageIdx: si,
          dayTitle: day.title,
        }))
      )
    : [];

  const lastDoneIdx = allStages.reduceRight(
    (acc, s, i) => (acc === -1 && stagesDone[s.key] ? i : acc), -1
  );
  const doneCount  = allStages.filter(s => stagesDone[s.key]).length;
  const doneKm     = lastDoneIdx >= 0 ? parseKm(allStages[lastDoneIdx].dist) : 0;
  const totalKm    = allStages.length > 0 ? parseKm(allStages[allStages.length - 1].dist) : 0;
  const pct        = totalKm > 0 ? Math.round((doneKm / totalKm) * 100) : 0;
  const nextStage  = lastDoneIdx < allStages.length - 1 ? allStages[lastDoneIdx + 1] : null;
  const allDone    = allStages.length > 0 && doneCount === allStages.length;

  // ── Journal data ──────────────────────────────────────────────────────────

  const sortedEntries = Object.values(journalEntries)
    .filter(e => e.trekId === activeTrekId)
    .sort((a, b) => b.date.localeCompare(a.date));

  // ── Form helpers ──────────────────────────────────────────────────────────

  const openNewForm = () => {
    setEditingId(null);
    setFormDate(today());
    setFormText('');
    setFormMeteo(METEO_OPTS[0]);
    setFormHumeur(HUMEUR_OPTS[1]);
    setShowForm(true);
  };

  const openEditForm = (entry: JournalEntry) => {
    setEditingId(entry.id);
    setFormDate(entry.date);
    setFormText(entry.text);
    setFormMeteo(entry.meteo);
    setFormHumeur(entry.humeur);
    setExpandedEntry(null);
    setShowForm(true);
  };

  const saveEntry = () => {
    if (!activeTrekId) return;
    const id = `${activeTrekId}-${formDate}`;
    setJournalEntry({ id, trekId: activeTrekId, date: formDate, text: formText.trim(), meteo: formMeteo, humeur: formHumeur });
    setShowForm(false);
  };

  const confirmDelete = (id: string) => {
    Alert.alert('Supprimer cette entrée ?', '', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => { deleteJournalEntry(id); setExpandedEntry(null); } },
    ]);
  };

  const resetProgress = () => {
    Alert.alert('Réinitialiser la progression ?', 'Toutes les étapes seront décochées.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Réinitialiser', style: 'destructive', onPress: () => {
          allStages.forEach(s => { if (stagesDone[s.key]) setStagesDone(s.key, false); });
        },
      },
    ]);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  if (!activeTrek) {
    return (
      <View style={[s.root, notebookBg as any]}>
        <ScrollView contentContainerStyle={s.scroll}>
          <Text style={s.pageTitle}>Journal</Text>
          <View style={s.emptyState}>
            <Text style={s.emptyIcon}>⛰</Text>
            <Text style={s.emptyTitle}>Aucun trek actif</Text>
            <Text style={s.emptyText}>Sélectionnez un trek dans l'onglet Treks pour accéder au tracker et au journal.</Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[s.root, notebookBg as any]}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

        {/* Trek banner */}
        <View style={[s.trekBanner, { borderLeftColor: activeTrek.color }]}>
          <View style={[s.trekDot, { backgroundColor: activeTrek.color }]} />
          <View style={{ flex: 1 }}>
            <Text style={s.trekBannerLabel}>Trek actif</Text>
            <Text style={s.trekBannerName}>{activeTrek.name}</Text>
          </View>
          {departureDate && (
            <Text style={s.trekBannerDate}>{fmtDate(departureDate)}</Text>
          )}
        </View>

        {/* ── PROGRESSION ── */}
        <View style={s.sectionHeaderRow}>
          <Text style={s.sectionTitle}>Progression</Text>
          {doneCount > 0 && (
            <TouchableOpacity onPress={resetProgress} style={s.resetBtn}>
              <Text style={s.resetBtnText}>↺ Réinit.</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Stats */}
        <View style={s.progressCard}>
          <View style={s.progressBar}>
            <View style={[s.progressFill, { width: `${pct}%` as any, backgroundColor: activeTrek.color }]} />
          </View>
          <View style={s.progressStats}>
            <Text style={s.progressPct}>
              {allDone ? '✓ Trek terminé !' : `${doneKm.toFixed(1)} km / ${totalKm} km`}
            </Text>
            <Text style={s.progressCount}>{doneCount} / {allStages.length} étapes</Text>
          </View>
          {nextStage && !allDone && (
            <View style={s.nextStageRow}>
              <Text style={s.nextStageLabel}>Prochaine étape</Text>
              <Text style={s.nextStageName}>{nextStage.name}</Text>
              <Text style={s.nextStageMeta}>{nextStage.dist} · prévu {nextStage.time}</Text>
            </View>
          )}
        </View>

        {/* Day accordions */}
        {activeTrek.trekDays.map((day, di) => {
          const key = `d${di}`;
          const isOpen = !!openDays[key];
          const dayStages = allStages.filter(s => s.dayIdx === di);
          const dayDone = dayStages.filter(s => stagesDone[s.key]).length;
          const allDayDone = dayDone === dayStages.length;
          return (
            <View key={key} style={s.dayCard}>
              <TouchableOpacity
                style={s.dayHeader}
                onPress={() => setOpenDays(prev => ({ ...prev, [key]: !prev[key] }))}
                activeOpacity={0.75}
              >
                <View style={[s.dayDot, allDayDone && { backgroundColor: activeTrek.color }]} />
                <Text style={s.dayTitle} numberOfLines={1}>{day.title}</Text>
                <Text style={s.dayCount}>{dayDone}/{dayStages.length}</Text>
                <Text style={s.chevron}>{isOpen ? '▾' : '▸'}</Text>
              </TouchableOpacity>

              {isOpen && (
                <View style={s.dayBody}>
                  {dayStages.map((stage, si) => {
                    const isDone = !!stagesDone[stage.key];
                    return (
                      <TouchableOpacity
                        key={stage.key}
                        style={[s.stageRow, si === dayStages.length - 1 && { borderBottomWidth: 0 }]}
                        onPress={() => setStagesDone(stage.key, !isDone)}
                        activeOpacity={0.7}
                      >
                        <View style={[s.stageCheck, isDone && { backgroundColor: activeTrek.color, borderColor: activeTrek.color }]}>
                          {isDone && <Text style={s.checkmark}>✓</Text>}
                        </View>
                        <View style={s.stageBody}>
                          <View style={s.stageNameRow}>
                            <Text style={[s.stageName, isDone && s.stageDone]}>{stage.name}</Text>
                            {(stage.badges ?? []).map(b => (
                              <Text key={b} style={s.stageBadge}>{BADGE_ICONS[b] ?? ''}</Text>
                            ))}
                          </View>
                          <Text style={s.stageMeta}>{stage.dist} · alt. {stage.alt} · {stage.time}</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          );
        })}

        {/* ── JOURNAL ── */}
        <View style={[s.sectionHeaderRow, { marginTop: 18 }]}>
          <Text style={s.sectionTitle}>Journal</Text>
          {!showForm && (
            <TouchableOpacity style={[s.addBtn, { backgroundColor: activeTrek.color }]} onPress={openNewForm}>
              <Text style={s.addBtnText}>+ Entrée</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Form */}
        {showForm && (
          <View style={s.formCard}>
            <Text style={s.formTitle}>{editingId ? 'Modifier l\'entrée' : 'Nouvelle entrée'}</Text>

            {/* Date */}
            <View style={s.formRow}>
              <Text style={s.formLabel}>Date</Text>
              <TextInput
                value={formDate}
                onChangeText={setFormDate}
                style={s.formDateInput}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={`${C.ink}55`}
                keyboardType="numeric"
                maxLength={10}
              />
              {departureDate && formDate >= departureDate && (
                <View style={[s.dayPill, { backgroundColor: activeTrek.color }]}>
                  <Text style={s.dayPillText}>{dayNumber(departureDate, formDate)}</Text>
                </View>
              )}
            </View>

            {/* Météo */}
            <View style={s.formRow}>
              <Text style={s.formLabel}>Météo</Text>
              <View style={s.emojiRow}>
                {METEO_OPTS.map(e => (
                  <TouchableOpacity
                    key={e} style={[s.emojiBtn, formMeteo === e && s.emojiBtnActive]}
                    onPress={() => setFormMeteo(e)}
                  >
                    <Text style={s.emojiText}>{e}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Humeur */}
            <View style={s.formRow}>
              <Text style={s.formLabel}>Humeur</Text>
              <View style={s.emojiRow}>
                {HUMEUR_OPTS.map(e => (
                  <TouchableOpacity
                    key={e} style={[s.emojiBtn, formHumeur === e && s.emojiBtnActive]}
                    onPress={() => setFormHumeur(e)}
                  >
                    <Text style={s.emojiText}>{e}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Text */}
            <TextInput
              value={formText}
              onChangeText={setFormText}
              style={s.formTextarea}
              placeholder="Notes du jour, souvenirs, anecdotes…"
              placeholderTextColor={`${C.ink}55`}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            {/* Actions */}
            <View style={s.formActions}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setShowForm(false)}>
                <Text style={s.cancelBtnText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.saveBtn, { backgroundColor: activeTrek.color }]}
                onPress={saveEntry}
              >
                <Text style={s.saveBtnText}>Sauvegarder</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Entries list */}
        {sortedEntries.length === 0 && !showForm && (
          <View style={s.emptyJournal}>
            <Text style={s.emptyJournalText}>Aucune entrée encore. Appuyez sur "+ Entrée" pour commencer.</Text>
          </View>
        )}

        {sortedEntries.map(entry => {
          const isExpanded = expandedEntry === entry.id;
          const dn = dayNumber(departureDate, entry.date);
          return (
            <TouchableOpacity
              key={entry.id}
              style={s.entryCard}
              onPress={() => setExpandedEntry(isExpanded ? null : entry.id)}
              activeOpacity={0.8}
            >
              <View style={s.entryHeader}>
                <View style={s.entryMeta}>
                  {dn ? <View style={[s.dayPill, { backgroundColor: activeTrek.color, marginRight: 6 }]}><Text style={s.dayPillText}>{dn}</Text></View> : null}
                  <Text style={s.entryDate}>{fmtDate(entry.date)}</Text>
                </View>
                <View style={s.entryEmojis}>
                  <Text style={s.entryEmoji}>{entry.meteo}</Text>
                  <Text style={s.entryEmoji}>{entry.humeur}</Text>
                </View>
              </View>

              {entry.text ? (
                <Text style={s.entryPreview} numberOfLines={isExpanded ? undefined : 2}>
                  {entry.text}
                </Text>
              ) : null}

              {isExpanded && (
                <View style={s.entryActions}>
                  <TouchableOpacity style={s.entryEditBtn} onPress={() => openEditForm(entry)}>
                    <Text style={s.entryEditBtnText}>✎ Modifier</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.entryDeleteBtn} onPress={() => confirmDelete(entry.id)}>
                    <Text style={s.entryDeleteBtnText}>✕ Supprimer</Text>
                  </TouchableOpacity>
                </View>
              )}
            </TouchableOpacity>
          );
        })}

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.paper },
  scroll: { padding: 16, paddingBottom: 40 },

  pageTitle: { fontFamily: FF.display, fontSize: 18, fontWeight: '600', color: C.ink, letterSpacing: -0.5, marginBottom: 14 },

  trekBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: C.paper2, borderRadius: 8, borderWidth: 1, borderColor: C.line,
    borderLeftWidth: 4, padding: 10, marginBottom: 14,
  },
  trekDot: { width: 8, height: 8, borderRadius: 4 },
  trekBannerLabel: { fontFamily: FF.mono, fontSize: 8, letterSpacing: 1.2, textTransform: 'uppercase', color: C.ink, opacity: 0.4 },
  trekBannerName: { fontFamily: FF.display, fontSize: 13, fontWeight: '600', color: C.ink, letterSpacing: -0.3 },
  trekBannerDate: { fontFamily: FF.mono, fontSize: 9, color: C.blue, letterSpacing: 0.3 },

  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  sectionTitle: { fontFamily: FF.display, fontSize: 16, fontWeight: '600', color: C.ink, letterSpacing: -0.4 },
  resetBtn: { borderRadius: 6, borderWidth: 1, borderColor: C.line, paddingHorizontal: 8, paddingVertical: 5, backgroundColor: C.paper3 },
  resetBtnText: { fontFamily: FF.mono, fontSize: 9, color: C.ink, opacity: 0.5 },

  progressCard: { backgroundColor: C.paper2, borderRadius: 10, borderWidth: 1, borderColor: C.line, padding: 14, marginBottom: 12 },
  progressBar: { height: 6, backgroundColor: C.line, borderRadius: 3, overflow: 'hidden', marginBottom: 8 },
  progressFill: { height: 6, borderRadius: 3 },
  progressStats: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressPct: { fontFamily: FF.mono, fontSize: 11, color: C.ink, fontWeight: '500' },
  progressCount: { fontFamily: FF.mono, fontSize: 9, color: C.ink, opacity: 0.45 },
  nextStageRow: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: C.line2 },
  nextStageLabel: { fontFamily: FF.mono, fontSize: 8, letterSpacing: 1, textTransform: 'uppercase', color: C.ink, opacity: 0.4, marginBottom: 2 },
  nextStageName: { fontFamily: FF.display, fontSize: 13, fontWeight: '600', color: C.ink, letterSpacing: -0.3 },
  nextStageMeta: { fontFamily: FF.mono, fontSize: 10, color: C.ink, opacity: 0.5, marginTop: 2 },

  dayCard: { backgroundColor: C.paper2, borderRadius: 10, borderWidth: 1, borderColor: C.line, marginBottom: 8, overflow: 'hidden' },
  dayHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 },
  dayDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.line, flexShrink: 0 },
  dayTitle: { fontFamily: FF.mono, fontSize: 11, fontWeight: '500', color: C.ink, flex: 1 },
  dayCount: { fontFamily: FF.mono, fontSize: 9, color: C.ink, opacity: 0.4 },
  chevron: { fontFamily: FF.mono, fontSize: 12, color: C.ink, opacity: 0.45 },
  dayBody: { borderTopWidth: 1, borderTopColor: C.line, paddingHorizontal: 12 },

  stageRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.line2 },
  stageCheck: { width: 20, height: 20, borderRadius: 4, borderWidth: 1.5, borderColor: C.line, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 },
  checkmark: { color: '#fff', fontSize: 10, fontWeight: '700' },
  stageBody: { flex: 1 },
  stageNameRow: { flexDirection: 'row', alignItems: 'center', gap: 5, flexWrap: 'wrap' },
  stageName: { fontFamily: FF.mono, fontSize: 12, fontWeight: '500', color: C.ink },
  stageDone: { opacity: 0.4 },
  stageBadge: { fontSize: 11 },
  stageMeta: { fontFamily: FF.mono, fontSize: 9, color: C.ink, opacity: 0.45, marginTop: 2 },

  addBtn: { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7 },
  addBtnText: { fontFamily: FF.mono, fontSize: 10, color: '#fff', letterSpacing: 0.3 },

  formCard: { backgroundColor: C.paper2, borderRadius: 10, borderWidth: 1, borderColor: C.line, padding: 14, marginBottom: 14 },
  formTitle: { fontFamily: FF.display, fontSize: 14, fontWeight: '600', color: C.ink, marginBottom: 12, letterSpacing: -0.3 },
  formRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  formLabel: { fontFamily: FF.mono, fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', color: C.ink, opacity: 0.5, width: 52 },
  formDateInput: { fontFamily: FF.mono, fontSize: 12, color: C.ink, borderWidth: 1, borderColor: C.line, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: C.paper3, minWidth: 110 },
  emojiRow: { flexDirection: 'row', gap: 6, flex: 1 },
  emojiBtn: { width: 36, height: 36, borderRadius: 8, borderWidth: 1.5, borderColor: C.line, alignItems: 'center', justifyContent: 'center', backgroundColor: C.paper3 },
  emojiBtnActive: { borderColor: C.accent, backgroundColor: 'rgba(200,80,42,0.08)' },
  emojiText: { fontSize: 18 },
  dayPill: { borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2, flexShrink: 0 },
  dayPillText: { fontFamily: FF.mono, fontSize: 9, color: '#fff', fontWeight: '600' },
  formTextarea: { fontFamily: FF.mono, fontSize: 12, color: C.ink, borderWidth: 1, borderColor: C.line, borderRadius: 8, padding: 10, backgroundColor: C.paper3, minHeight: 90, marginBottom: 12, lineHeight: 18 },
  formActions: { flexDirection: 'row', gap: 8, justifyContent: 'flex-end' },
  cancelBtn: { borderRadius: 8, borderWidth: 1, borderColor: C.line, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: C.paper3 },
  cancelBtnText: { fontFamily: FF.mono, fontSize: 10, color: C.ink, opacity: 0.6 },
  saveBtn: { borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  saveBtnText: { fontFamily: FF.mono, fontSize: 10, color: '#fff', letterSpacing: 0.3 },

  emptyJournal: { backgroundColor: C.paper3, borderRadius: 8, borderWidth: 1, borderColor: C.line, padding: 14, alignItems: 'center', marginBottom: 10 },
  emptyJournalText: { fontFamily: FF.mono, fontSize: 10, color: C.ink, opacity: 0.45, textAlign: 'center', lineHeight: 16 },

  entryCard: { backgroundColor: C.paper2, borderRadius: 10, borderWidth: 1, borderColor: C.line, padding: 12, marginBottom: 8 },
  entryHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  entryMeta: { flexDirection: 'row', alignItems: 'center' },
  entryDate: { fontFamily: FF.mono, fontSize: 10, color: C.ink, opacity: 0.55 },
  entryEmojis: { flexDirection: 'row', gap: 4 },
  entryEmoji: { fontSize: 16 },
  entryPreview: { fontFamily: FF.mono, fontSize: 11, color: C.ink, opacity: 0.7, lineHeight: 16 },
  entryActions: { flexDirection: 'row', gap: 8, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: C.line2 },
  entryEditBtn: { flex: 1, borderRadius: 6, borderWidth: 1, borderColor: C.blue, paddingVertical: 7, alignItems: 'center' },
  entryEditBtnText: { fontFamily: FF.mono, fontSize: 10, color: C.blue },
  entryDeleteBtn: { flex: 1, borderRadius: 6, borderWidth: 1, borderColor: C.accent, paddingVertical: 7, alignItems: 'center' },
  entryDeleteBtnText: { fontFamily: FF.mono, fontSize: 10, color: C.accent },

  emptyState: { alignItems: 'center', paddingVertical: 50 },
  emptyIcon: { fontSize: 36, marginBottom: 10 },
  emptyTitle: { fontFamily: FF.display, fontSize: 16, fontWeight: '600', color: C.ink, marginBottom: 6 },
  emptyText: { fontFamily: FF.mono, fontSize: 11, color: C.ink, opacity: 0.45, textAlign: 'center', lineHeight: 16, maxWidth: 260 },
});
