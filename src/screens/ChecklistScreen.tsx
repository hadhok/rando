import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert,
  Modal, TextInput, KeyboardAvoidingView, Platform, Pressable,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { C, FF, notebookBg } from '../theme';
import { CHECKLIST_DATA, CheckItem, WhoType } from '../data/checklist';

const CHECKED_KEY      = 'rando_checked_v1';
const CUSTOM_ITEMS_KEY = 'rando_custom_items_v1';

interface CustomItem extends CheckItem {
  sectionKey: string;
}

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

// ─── Add-item modal ──────────────────────────────────────────────────────────

interface AddModalProps {
  sectionKey: string;
  onSave: (item: CustomItem) => void;
  onClose: () => void;
}

function AddItemModal({ sectionKey, onSave, onClose }: AddModalProps) {
  const [name, setName]     = useState('');
  const [who, setWho]       = useState<WhoType>('shared');
  const [vital, setVital]   = useState(false);
  const [weight, setWeight] = useState('');

  const save = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const w = parseInt(weight, 10);
    onSave({
      id: `custom_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: trimmed,
      who,
      vital,
      weight: !isNaN(w) && w > 0 ? w : undefined,
      sectionKey,
    });
  };

  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={m.backdrop} onPress={onClose}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <Pressable style={m.sheet} onPress={e => e.stopPropagation()}>
            <Text style={m.sheetTitle}>Nouvel article</Text>
            <Text style={m.sheetSub}>{sectionKey}</Text>

            <Text style={m.label}>Nom *</Text>
            <TextInput
              style={m.input}
              value={name}
              onChangeText={setName}
              placeholder="ex: Couteau, Bâtons…"
              placeholderTextColor={C.inkMuted}
              autoFocus
            />

            <Text style={m.label}>Qui porte</Text>
            <View style={m.whoRow}>
              {(['papa', 'fille', 'shared'] as WhoType[]).map(w => {
                const ws = WHO_STYLE[w];
                const active = who === w;
                return (
                  <TouchableOpacity
                    key={w}
                    style={[m.whoBtn, active && { backgroundColor: ws.bg, borderColor: ws.bg }]}
                    onPress={() => setWho(w)}
                  >
                    <Text style={[m.whoBtnText, active && { color: ws.tc }]}>{ws.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={m.row}>
              <View style={{ flex: 1 }}>
                <Text style={m.label}>Poids (g) — optionnel</Text>
                <TextInput
                  style={m.input}
                  value={weight}
                  onChangeText={setWeight}
                  placeholder="ex: 250"
                  placeholderTextColor={C.inkMuted}
                  keyboardType="numeric"
                />
              </View>
              <View style={{ marginLeft: 12, marginTop: 22 }}>
                <TouchableOpacity
                  style={[m.vitalBtn, vital && m.vitalBtnActive]}
                  onPress={() => setVital(v => !v)}
                >
                  <Text style={[m.vitalBtnText, vital && m.vitalBtnTextActive]}>⚡ Vital</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={m.actions}>
              <TouchableOpacity style={m.cancelBtn} onPress={onClose}>
                <Text style={m.cancelBtnText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[m.saveBtn, !name.trim() && m.saveBtnDisabled]}
                onPress={save}
                disabled={!name.trim()}
              >
                <Text style={m.saveBtnText}>Ajouter</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function ChecklistScreen() {
  const [person, setPerson]           = useState<PersonFilter>('all');
  const [mode, setMode]               = useState<ModeFilter>('normal');
  const [checked, setChecked]         = useState<Record<string, boolean>>({});
  const [customItems, setCustomItems] = useState<CustomItem[]>([]);
  const [addSection, setAddSection]   = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem(CHECKED_KEY).then(raw => setChecked(raw ? JSON.parse(raw) : {}));
      AsyncStorage.getItem(CUSTOM_ITEMS_KEY).then(raw => setCustomItems(raw ? JSON.parse(raw) : []));
    }, [])
  );

  const toggle = useCallback((id: string) => {
    setChecked(prev => {
      const next = { ...prev, [id]: !prev[id] };
      AsyncStorage.setItem(CHECKED_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const handleAddItem = useCallback((item: CustomItem) => {
    setCustomItems(prev => {
      const next = [...prev, item];
      AsyncStorage.setItem(CUSTOM_ITEMS_KEY, JSON.stringify(next));
      return next;
    });
    setAddSection(null);
  }, []);

  const handleDeleteItem = useCallback((id: string, name: string) => {
    Alert.alert(
      'Supprimer cet article ?',
      `"${name}" sera retiré de la liste.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            setCustomItems(prev => {
              const next = prev.filter(i => i.id !== id);
              AsyncStorage.setItem(CUSTOM_ITEMS_KEY, JSON.stringify(next));
              return next;
            });
            setChecked(prev => {
              const next = { ...prev };
              delete next[id];
              AsyncStorage.setItem(CHECKED_KEY, JSON.stringify(next));
              return next;
            });
          },
        },
      ]
    );
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

  // Merge built-in sections with custom items
  const mergedSections = useMemo(() => {
    return CHECKLIST_DATA.map(sec => ({
      ...sec,
      items: [
        ...sec.items,
        ...customItems.filter(ci => ci.sectionKey === sec.section),
      ] as (CheckItem & { _custom?: boolean })[],
    })).map(sec => ({
      ...sec,
      items: sec.items.map(item => ({
        ...item,
        _custom: customItems.some(ci => ci.id === item.id),
      })),
    }));
  }, [customItems]);

  // Filter items
  const filteredSections = mergedSections.map(sec => ({
    ...sec,
    items: sec.items.filter(item => {
      if (person !== 'all' && item.who !== person) return false;
      if (mode === 'vital'   && !item.vital)        return false;
      if (mode === 'packing' && !!checked[item.id]) return false;
      return true;
    }),
  })).filter(sec => sec.items.length > 0 || mode === 'normal');

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

  const weightByPerson = useMemo(() => {
    const w = { papa: 0, fille: 0, shared: 0 };
    mergedSections.forEach(sec => sec.items.forEach(item => {
      if (checked[item.id] && item.weight) w[item.who] += item.weight;
    }));
    return w;
  }, [checked, mergedSections]);
  const totalCheckedW = weightByPerson.papa + weightByPerson.fille + weightByPerson.shared;
  const wColor = totalCheckedW > 10000 ? C.accent : totalCheckedW > 7000 ? C.accent2 : C.green;
  const wLabel = totalCheckedW > 10000 ? 'Lourd' : totalCheckedW > 7000 ? 'Modéré' : 'Léger';

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

        {/* Weight card */}
        {totalCheckedW > 0 && (
          <View style={[s.weightCard, { borderLeftColor: wColor }]}>
            <View style={s.weightHeaderRow}>
              <Text style={s.weightTitle}>🎒 Poids emballé</Text>
              <Text style={[s.weightTotal, { color: wColor }]}>
                {formatWeight(totalCheckedW)} · {wLabel}
              </Text>
            </View>
            <View style={s.weightBarBg}>
              <View style={[s.weightBarFill, {
                width: `${Math.min(100, (totalCheckedW / 15000) * 100)}%` as any,
                backgroundColor: wColor,
              }]} />
            </View>
            <View style={s.weightPersonRow}>
              {weightByPerson.papa > 0 && (
                <View style={s.weightChip}>
                  <Text style={s.weightChipLabel}>papa</Text>
                  <Text style={s.weightChipVal}>{formatWeight(weightByPerson.papa)}</Text>
                </View>
              )}
              {weightByPerson.fille > 0 && (
                <View style={s.weightChip}>
                  <Text style={s.weightChipLabel}>fille</Text>
                  <Text style={s.weightChipVal}>{formatWeight(weightByPerson.fille)}</Text>
                </View>
              )}
              {weightByPerson.shared > 0 && (
                <View style={s.weightChip}>
                  <Text style={s.weightChipLabel}>×2</Text>
                  <Text style={s.weightChipVal}>{formatWeight(weightByPerson.shared)}</Text>
                </View>
              )}
            </View>
          </View>
        )}

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
        {filteredSections.every(s => s.items.length === 0) && (
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
        {CHECKLIST_DATA.map(builtInSec => {
          const merged = mergedSections.find(s => s.section === builtInSec.section)!;
          const filtered = merged.items.filter(item => {
            if (person !== 'all' && item.who !== person) return false;
            if (mode === 'vital'   && !item.vital)        return false;
            if (mode === 'packing' && !!checked[item.id]) return false;
            return true;
          });
          if (filtered.length === 0 && mode !== 'normal') return null;

          return (
            <View key={builtInSec.section} style={s.section}>
              <View style={s.sectionHeader}>
                <Text style={s.sectionHeaderText}>{builtInSec.section}</Text>
                <View style={s.sectionLine} />
                <TouchableOpacity
                  style={s.addBtn}
                  onPress={() => setAddSection(builtInSec.section)}
                >
                  <Text style={s.addBtnText}>+ Ajouter</Text>
                </TouchableOpacity>
              </View>

              {filtered.length === 0 ? (
                <Text style={s.emptySectionText}>Aucun article visible</Text>
              ) : (
                filtered.map((item, idx) => {
                  const isDone = !!checked[item.id];
                  const who = WHO_STYLE[item.who];
                  const isCustom = !!(item as any)._custom;
                  return (
                    <View key={item.id} style={[
                      s.item,
                      isDone && s.itemDone,
                      idx === filtered.length - 1 && { borderBottomWidth: 0 },
                    ]}>
                      <TouchableOpacity
                        style={s.itemTouchable}
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
                            {isCustom && <View style={s.customDot} />}
                          </View>
                          <View style={s.itemMetaRow}>
                            {item.note ? <Text style={s.itemNote}>{item.note}</Text> : <Text />}
                            {item.weight ? <Text style={s.itemWeight}>{formatWeight(item.weight)}</Text> : null}
                          </View>
                        </View>
                      </TouchableOpacity>
                      {isCustom && (
                        <TouchableOpacity
                          style={s.deleteBtn}
                          onPress={() => handleDeleteItem(item.id, item.name)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Text style={s.deleteBtnText}>×</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })
              )}
            </View>
          );
        })}
      </ScrollView>

      {addSection && (
        <AddItemModal
          sectionKey={addSection}
          onSave={handleAddItem}
          onClose={() => setAddSection(null)}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.paper },
  scroll: { padding: 16, paddingBottom: 40 },

  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  sectionTitle: { fontFamily: FF.display, fontSize: 18, fontWeight: '600', color: C.ink, letterSpacing: -0.5 },
  resetBtn: { borderRadius: 8, borderWidth: 1, borderColor: C.line, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: C.paper3 },
  resetBtnText: { fontFamily: FF.mono, fontSize: 10, color: C.inkMuted, letterSpacing: 0.5 },

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
  progressText: { fontFamily: FF.mono, fontSize: 10, color: C.inkMuted },
  weightText: { fontFamily: FF.mono, fontSize: 10, color: C.blue, fontWeight: '500' },

  weightCard: { backgroundColor: C.paper2, borderRadius: 10, borderWidth: 1, borderColor: C.line, borderLeftWidth: 4, padding: 14, marginBottom: 14 },
  weightHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  weightTitle: { fontFamily: FF.mono, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: C.inkMuted },
  weightTotal: { fontFamily: FF.mono, fontSize: 13, fontWeight: '600' },
  weightBarBg: { height: 5, backgroundColor: C.line, borderRadius: 3, overflow: 'hidden', marginBottom: 10 },
  weightBarFill: { height: 5, borderRadius: 3 },
  weightPersonRow: { flexDirection: 'row', gap: 8 },
  weightChip: { backgroundColor: C.paper3, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 5, borderWidth: 1, borderColor: C.line, alignItems: 'center' },
  weightChipLabel: { fontFamily: FF.mono, fontSize: 9, color: C.inkMuted, letterSpacing: 0.5, textTransform: 'uppercase' },
  weightChipVal: { fontFamily: FF.mono, fontSize: 11, color: C.ink, fontWeight: '600', marginTop: 1 },

  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyIcon: { fontSize: 32, marginBottom: 8 },
  emptyText: { fontFamily: FF.mono, fontSize: 13, color: C.inkMuted },
  emptySectionText: { fontFamily: FF.mono, fontSize: 11, color: C.inkMuted, paddingVertical: 8, paddingLeft: 4 },

  section: { marginBottom: 14 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  sectionHeaderText: { fontFamily: FF.mono, fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase', color: C.inkMuted },
  sectionLine: { flex: 1, height: 1, backgroundColor: C.line },
  addBtn: { borderRadius: 6, borderWidth: 1, borderColor: C.line, paddingHorizontal: 7, paddingVertical: 3, backgroundColor: C.paper3 },
  addBtnText: { fontFamily: FF.mono, fontSize: 9, color: C.blue, letterSpacing: 0.3 },

  item: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: C.line2 },
  itemTouchable: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 13 },
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
  customDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: C.blue },

  itemMetaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 },
  itemNote: { fontFamily: FF.mono, fontSize: 10, color: C.inkMuted, flex: 1 },
  itemWeight: { fontFamily: FF.mono, fontSize: 9, color: C.blue, marginLeft: 8 },

  deleteBtn: { paddingHorizontal: 12, paddingVertical: 8 },
  deleteBtnText: { fontSize: 18, color: C.accent, fontWeight: '400', lineHeight: 20 },
});

// ─── Modal styles ─────────────────────────────────────────────────────────────

const m = StyleSheet.create({
  backdrop: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: C.paper,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 24, paddingBottom: 40,
  },
  sheetTitle: { fontFamily: FF.display, fontSize: 17, fontWeight: '600', color: C.ink, marginBottom: 2 },
  sheetSub: { fontFamily: FF.mono, fontSize: 10, color: C.inkMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 20 },

  label: { fontFamily: FF.mono, fontSize: 10, color: C.inkMuted, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 6, marginTop: 14 },
  input: {
    borderWidth: 1, borderColor: C.line, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 10,
    fontFamily: FF.mono, fontSize: 13, color: C.ink,
    backgroundColor: C.paper2,
  },

  whoRow: { flexDirection: 'row', gap: 8 },
  whoBtn: {
    flex: 1, paddingVertical: 9, borderRadius: 8,
    borderWidth: 1.5, borderColor: C.line,
    backgroundColor: C.paper3, alignItems: 'center',
  },
  whoBtnText: { fontFamily: FF.mono, fontSize: 11, color: C.ink, fontWeight: '500' },

  row: { flexDirection: 'row', alignItems: 'flex-end' },
  vitalBtn: {
    borderWidth: 1.5, borderColor: C.line,
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10,
    backgroundColor: C.paper3,
  },
  vitalBtnActive: { backgroundColor: C.accent, borderColor: C.accent },
  vitalBtnText: { fontFamily: FF.mono, fontSize: 11, color: C.ink },
  vitalBtnTextActive: { color: '#fff' },

  actions: { flexDirection: 'row', gap: 10, marginTop: 24 },
  cancelBtn: {
    flex: 1, paddingVertical: 13, borderRadius: 10,
    borderWidth: 1, borderColor: C.line,
    backgroundColor: C.paper3, alignItems: 'center',
  },
  cancelBtnText: { fontFamily: FF.mono, fontSize: 12, color: C.inkMuted },
  saveBtn: {
    flex: 2, paddingVertical: 13, borderRadius: 10,
    backgroundColor: C.ink, alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnText: { fontFamily: FF.mono, fontSize: 12, color: C.paper, fontWeight: '600' },
});
