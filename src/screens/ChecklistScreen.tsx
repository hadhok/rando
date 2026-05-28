import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { C, FF, notebookBg } from '../theme';
import { CHECKLIST_DATA, WhoType } from '../data/checklist';

const CHECKED_KEY = 'rando_checked_v1';

type Filter = 'all' | WhoType;

const WHO_STYLE: Record<WhoType, { bg: string; tc: string; label: string }> = {
  papa:   { bg: C.ink,    tc: C.paper,  label: 'papa' },
  fille:  { bg: '#be185d', tc: '#fff',  label: 'fille' },
  shared: { bg: C.blue,   tc: '#fff',   label: '×2' },
};

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all',    label: 'Tout' },
  { key: 'papa',   label: 'Papa' },
  { key: 'fille',  label: 'Fille' },
  { key: 'shared', label: 'Partagé' },
];

export default function ChecklistScreen() {
  const [filter, setFilter] = useState<Filter>('all');
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem(CHECKED_KEY).then(raw => {
        setChecked(raw ? JSON.parse(raw) : {});
      });
    }, [])
  );

  const toggle = useCallback((id: string) => {
    setChecked(prev => {
      const next = { ...prev, [id]: !prev[id] };
      AsyncStorage.setItem(CHECKED_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  let total = 0, done = 0;
  CHECKLIST_DATA.forEach(sec =>
    sec.items.forEach(item => {
      if (filter === 'all' || item.who === filter) {
        total++;
        if (checked[item.id]) done++;
      }
    })
  );
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <View style={[s.root, notebookBg as any]}>
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.sectionTitle}>Checklist sac</Text>

        {/* Filter buttons */}
        <View style={s.filterRow}>
          {FILTERS.map(f => (
            <TouchableOpacity
              key={f.key}
              style={[s.filterBtn, filter === f.key && s.filterBtnActive]}
              onPress={() => setFilter(f.key)}
            >
              <Text style={[s.filterBtnText, filter === f.key && s.filterBtnTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Progress */}
        <View style={s.progressBar}>
          <View style={[s.progressFill, { width: `${pct}%` as any }]} />
        </View>
        <Text style={s.progressText}>{done} / {total} articles cochés</Text>

        {/* Sections */}
        {CHECKLIST_DATA.map(sec => {
          const items = sec.items.filter(i => filter === 'all' || i.who === filter);
          if (items.length === 0) return null;
          return (
            <View key={sec.section} style={s.section}>
              <View style={s.sectionHeader}>
                <Text style={s.sectionHeaderText}>{sec.section}</Text>
                <View style={s.sectionLine} />
              </View>
              {items.map((item, idx) => {
                const isDone = !!checked[item.id];
                const who = WHO_STYLE[item.who];
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[s.item, isDone && s.itemDone, idx === items.length - 1 && { borderBottomWidth: 0 }]}
                    onPress={() => toggle(item.id)}
                    activeOpacity={0.7}
                  >
                    <View style={[s.checkbox, isDone && s.checkboxDone]}>
                      {isDone && <Text style={s.checkmark}>✓</Text>}
                    </View>
                    <View style={s.itemBody}>
                      <View style={s.itemNameRow}>
                        <Text style={[s.itemName, isDone && s.itemNameDone]}>{item.name}</Text>
                        <View style={[s.whoBadge, { backgroundColor: who.bg }]}>
                          <Text style={[s.whoText, { color: who.tc }]}>{who.label}</Text>
                        </View>
                        {item.vital && <View style={s.vitalDot} />}
                      </View>
                      {item.note ? <Text style={s.itemNote}>{item.note}</Text> : null}
                    </View>
                  </TouchableOpacity>
                );
              })}
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

  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  filterBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: C.paper3,
    borderWidth: 1, borderColor: C.line, alignItems: 'center',
  },
  filterBtnActive: { backgroundColor: C.ink, borderColor: C.ink },
  filterBtnText: { fontFamily: FF.mono, fontSize: 10, color: C.ink, letterSpacing: 0.5, textTransform: 'uppercase' },
  filterBtnTextActive: { color: C.paper },

  progressBar: { height: 4, backgroundColor: C.line, borderRadius: 2, marginBottom: 6, overflow: 'hidden' },
  progressFill: { height: 4, backgroundColor: C.green, borderRadius: 2 },
  progressText: { fontFamily: FF.mono, fontSize: 10, color: C.ink, opacity: 0.5, textAlign: 'center', marginBottom: 16 },

  section: { marginBottom: 14 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  sectionHeaderText: { fontFamily: FF.mono, fontSize: 9, letterSpacing: 1.2, textTransform: 'uppercase', color: C.ink, opacity: 0.5 },
  sectionLine: { flex: 1, height: 1, backgroundColor: C.line },

  item: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: C.line2,
  },
  itemDone: { opacity: 0.45 },
  checkbox: {
    width: 20, height: 20, borderRadius: 4, borderWidth: 1.5, borderColor: C.line,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1,
  },
  checkboxDone: { backgroundColor: C.green, borderColor: C.green },
  checkmark: { color: '#fff', fontSize: 11, fontWeight: '700' },

  itemBody: { flex: 1 },
  itemNameRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4 },
  itemName: { fontFamily: FF.mono, fontSize: 12, fontWeight: '500', color: C.ink },
  itemNameDone: {},
  whoBadge: { borderRadius: 10, paddingHorizontal: 5, paddingVertical: 1 },
  whoText: { fontFamily: FF.mono, fontSize: 9, letterSpacing: 0.3 },
  vitalDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: C.accent },
  itemNote: { fontFamily: FF.mono, fontSize: 10, color: C.ink, opacity: 0.5, marginTop: 2 },
});
