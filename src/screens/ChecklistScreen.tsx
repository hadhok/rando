import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { C, FF, notebookBg } from '../theme';
import { CHECKLIST_DATA, WhoType } from '../data/checklist';

const CHECKED_KEY = 'rando_checked_v1';

type PersonFilter = 'all' | WhoType;
type ModeFilter   = 'normal' | 'vital' | 'packing';

const WHO_STYLE: Record<WhoType, { bg: string; tc: string; label: string }> = {
  papa:   { bg: C.ink,    tc: C.paper,   label: 'papa' },
  fille:  { bg: '#be185d', tc: '#fff',   label: 'fille' },
  shared: { bg: C.blue,   tc: '#fff',    label: '×2' },
};

function formatWeight(g: number): string {
  return g >= 1000 ? `${(g / 1000).toFixed(1)}kg` : `${g}g`;
}

export default function ChecklistScreen() {
  const [person, setPerson]   = useState<PersonFilter>('all');
  const [mode, setMode]       = useState<ModeFilter>('normal');
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem(CHECKED_KEY).then(raw => setChecked(raw ? JSON.parse(raw) : {}));
    }, [])
  );

  const toggle = useCallback((id: string) => {
    setChecked(prev => {
      const next = { ...prev, [id]: !prev[id] };
      AsyncStorage.setItem(CHECKED_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const handleReset = () => {
    Alert.alert(
      'Réinitialiser le sac ?',
      'Tous les articles seront décochés pour un nouveau départ.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Réinitialiser',
          style: 'destructive',
          onPress: () => {
            setChecked({});
            AsyncStorage.removeItem(CHECKED_KEY);
          },
        },
      ]
    );
  };

  // Filter items
  const filteredSections = CHECKLIST_DATA.map(sec => ({
    ...sec,
    items: sec.items.filter(item => {
      if (person !== 'all' && item.who !== person) return false;
      if (mode === 'vital'   && !item.vital)      return false;
      if (mode === 'packing' && !!checked[item.id]) return false;
      return true;
    }),
  })).filter(sec => sec.items.length > 0);

  // Stats
  let total = 0, done = 0, totalW = 0, doneW = 0;
  filteredSections.forEach(sec =>
    sec.items.forEach(item => {
      total++;
      totalW += item.weight ?? 0;
      if (checked[item.id]) { done++; doneW += item.weight ?? 0; }
    })
  );
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const allDone = total > 0 && done === total;

  const PERSON_FILTERS: { key: PersonFilter; label: string }[] = [
    { key: 'all',    label: 'Tout' },
    { key: 'papa',   label: 'Papa' },
    { key: 'fille',  label: 'Fille' },
    { key: 'shared', label: 'Partagé' },
  ];

  const MODE_FILTERS: { key: ModeFilter; icon: string; label: string }[] = [
    { key: 'normal',  icon: '☐',  label: 'Tous' },
    { key: 'vital',   icon: '⚡', label: 'Vital' },
    { key: 'packing', icon: '📦', label: 'À emballer' },
  ];

  return (
    <View style={[s.root, notebookBg as any]}>
      <ScrollView contentContainerStyle={s.scroll}>
        {/* Title + reset */}
        <View style={s.titleRow}>
          <Text style={s.sectionTitle}>Checklist sac</Text>
          <TouchableOpacity onPress={handleReset} style={s.resetBtn}>
            <Text style={s.resetBtnText}>↺ Réinit.</Text>
          </TouchableOpacity>
        </View>

        {/* Person filter */}
        <View style={s.filterRow}>
          {PERSON_FILTERS.map(f => (
            <TouchableOpacity
              key={f.key}
              style={[s.filterBtn, person === f.key && s.filterBtnActive]}
              onPress={() => setPerson(f.key)}
            >
              <Text style={[s.filterBtnText, person === f.key && s.filterBtnTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Mode filter */}
        <View style={[s.filterRow, { marginTop: 6 }]}>
          {MODE_FILTERS.map(f => (
            <TouchableOpacity
              key={f.key}
              style={[s.modeBtn, mode === f.key && s.modeBtnActive]}
              onPress={() => setMode(f.key)}
            >
              <Text style={[s.modeBtnText, mode === f.key && s.modeBtnTextActive]}>
                {f.icon} {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Progress */}
        <View style={s.progressBar}>
          <View style={[s.progressFill, { width: `${pct}%` as any }]} />
        </View>
        <View style={s.statsRow}>
          <Text style={s.progressText}>
            {allDone ? '✓ Sac complet !' : `${done} / ${total} cochés`}
          </Text>
          {totalW > 0 && (
            <Text style={s.weightText}>
              🎒 {formatWeight(doneW)} / {formatWeight(totalW)}
            </Text>
          )}
        </View>

        {/* Empty state */}
        {filteredSections.length === 0 && (
          <View style={s.emptyState}>
            <Text style={s.emptyIcon}>
              {mode === 'packing' ? '✓' : '☐'}
            </Text>
            <Text style={s.emptyText}>
              {mode === 'packing'
                ? 'Tout est emballé !'
                : 'Aucun article pour ce filtre.'}
            </Text>
          </View>
        )}

        {/* Sections */}
        {filteredSections.map(sec => (
          <View key={sec.section} style={s.section}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionHeaderText}>{sec.section}</Text>
              <View style={s.sectionLine} />
            </View>
            {sec.items.map((item, idx) => {
              const isDone = !!checked[item.id];
              const who = WHO_STYLE[item.who];
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    s.item,
                    isDone && s.itemDone,
                    idx === sec.items.length - 1 && { borderBottomWidth: 0 },
                  ]}
                  onPress={() => toggle(item.id)}
                  activeOpacity={0.7}
                >
                  <View style={[s.checkbox, isDone && s.checkboxDone]}>
                    {isDone && <Text style={s.checkmark}>✓</Text>}
                  </View>
                  <View style={s.itemBody}>
                    <View style={s.itemNameRow}>
                      <Text style={s.itemName}>{item.name}</Text>
                      <View style={[s.whoBadge, { backgroundColor: who.bg }]}>
                        <Text style={[s.whoText, { color: who.tc }]}>{who.label}</Text>
                      </View>
                      {item.vital && <View style={s.vitalDot} />}
                    </View>
                    <View style={s.itemMetaRow}>
                      {item.note ? <Text style={s.itemNote}>{item.note}</Text> : <Text />}
                      {item.weight ? <Text style={s.itemWeight}>{formatWeight(item.weight)}</Text> : null}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.paper },
  scroll: { padding: 16, paddingBottom: 40 },

  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  sectionTitle: { fontFamily: FF.display, fontSize: 18, fontWeight: '600', color: C.ink, letterSpacing: -0.5 },
  resetBtn: { borderRadius: 8, borderWidth: 1, borderColor: C.line, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: C.paper3 },
  resetBtnText: { fontFamily: FF.mono, fontSize: 10, color: C.ink, opacity: 0.6, letterSpacing: 0.5 },

  filterRow: { flexDirection: 'row', gap: 6 },
  filterBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: C.paper3, borderWidth: 1, borderColor: C.line, alignItems: 'center' },
  filterBtnActive: { backgroundColor: C.ink, borderColor: C.ink },
  filterBtnText: { fontFamily: FF.mono, fontSize: 10, color: C.ink, letterSpacing: 0.4, textTransform: 'uppercase' },
  filterBtnTextActive: { color: C.paper },

  modeBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: C.paper3, borderWidth: 1, borderColor: C.line, alignItems: 'center' },
  modeBtnActive: { backgroundColor: C.accent, borderColor: C.accent },
  modeBtnText: { fontFamily: FF.mono, fontSize: 10, color: C.ink, letterSpacing: 0.3 },
  modeBtnTextActive: { color: C.paper },

  progressBar: { height: 5, backgroundColor: C.line, borderRadius: 3, marginTop: 12, marginBottom: 6, overflow: 'hidden' },
  progressFill: { height: 5, backgroundColor: C.green, borderRadius: 3 },

  statsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  progressText: { fontFamily: FF.mono, fontSize: 10, color: C.ink, opacity: 0.5 },
  weightText: { fontFamily: FF.mono, fontSize: 10, color: C.blue, fontWeight: '500' },

  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyIcon: { fontSize: 32, marginBottom: 8 },
  emptyText: { fontFamily: FF.mono, fontSize: 13, color: C.ink, opacity: 0.4 },

  section: { marginBottom: 14 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  sectionHeaderText: { fontFamily: FF.mono, fontSize: 9, letterSpacing: 1.2, textTransform: 'uppercase', color: C.ink, opacity: 0.5 },
  sectionLine: { flex: 1, height: 1, backgroundColor: C.line },

  item: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: C.line2 },
  itemDone: { opacity: 0.45 },
  checkbox: { width: 22, height: 22, borderRadius: 5, borderWidth: 1.5, borderColor: C.line, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 },
  checkboxDone: { backgroundColor: C.green, borderColor: C.green },
  checkmark: { color: '#fff', fontSize: 12, fontWeight: '700' },

  itemBody: { flex: 1 },
  itemNameRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4 },
  itemName: { fontFamily: FF.mono, fontSize: 12, fontWeight: '500', color: C.ink },
  whoBadge: { borderRadius: 10, paddingHorizontal: 5, paddingVertical: 1 },
  whoText: { fontFamily: FF.mono, fontSize: 9, letterSpacing: 0.3 },
  vitalDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: C.accent },

  itemMetaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 },
  itemNote: { fontFamily: FF.mono, fontSize: 10, color: C.ink, opacity: 0.5, flex: 1 },
  itemWeight: { fontFamily: FF.mono, fontSize: 9, color: C.blue, opacity: 0.7, marginLeft: 8 },
});
