import React, { useCallback, useMemo, useState } from 'react';
import {
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { ETAPES } from '../data/etapes';
import { REFUGES } from '../data/refuges';
import { BIVOUACS } from '../data/bivouacs';
import {
  useTrek,
  buildTrekPlan,
  TrekJour,
  TrekHebergement,
  HebergType,
} from '../context/TrekContext';
import type { Etape } from '../data/etapes';
import type { Refuge } from '../data/refuges';
import type { Bivouac } from '../data/bivouacs';

// ─── Constants ────────────────────────────────────────────────────────────────

const COLORS = {
  primary: '#264653',
  teal: '#2A9D8F',
  red: '#E63946',
  light: '#F1FAEE',
  gold: '#E9C46A',
  orange: '#F4A261',
  muted: '#A8DADC',
  white: '#fff',
  cardBg: '#fff',
  textMain: '#264653',
  textSub: '#6B7280',
  textFaint: '#9CA3AF',
  borderLight: '#E5E7EB',
};

const DIFFICULTE_COLOR: Record<string, string> = {
  facile: '#2A9D8F',
  moyen: '#E9C46A',
  difficile: '#F4A261',
  tres_difficile: '#E63946',
};

const DIFFICULTE_LABEL: Record<string, string> = {
  facile: 'Facile',
  moyen: 'Moyen',
  difficile: 'Difficile',
  tres_difficile: 'Très difficile',
};

const HEBERGEMENT_ICON: Record<string, string> = {
  refuge: '🏔',
  gite: '🏡',
  camping: '⛺',
  village: '🏘',
  bivouac: '🌙',
  libre: '🌙',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  } catch {
    return iso;
  }
}

function parseFrDate(ddmmyyyy: string): string | null {
  const parts = ddmmyyyy.trim().split('/');
  if (parts.length !== 3) return null;
  const [dd, mm, yyyy] = parts;
  if (!dd || !mm || !yyyy || yyyy.length !== 4) return null;
  const d = parseInt(dd, 10);
  const m = parseInt(mm, 10);
  const y = parseInt(yyyy, 10);
  if (isNaN(d) || isNaN(m) || isNaN(y)) return null;
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  const iso = `${yyyy}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  return iso;
}

function isoToFr(iso: string): string {
  if (!iso) return '';
  const parts = iso.split('-');
  if (parts.length !== 3) return iso;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function etapeForId(id: number): Etape | undefined {
  return ETAPES.find((e) => e.id === id);
}

function computePlanStats(jours: TrekJour[]): { totalKm: number; totalDp: number } {
  let totalKm = 0;
  let totalDp = 0;
  for (const jour of jours) {
    const etape = etapeForId(jour.etapeId);
    if (etape) {
      totalKm += etape.distance;
      totalDp += etape.denivelePos;
    }
  }
  return { totalKm, totalDp };
}

// ─── StageRangePicker ─────────────────────────────────────────────────────────

interface StagePickerProps {
  label: string;
  idx: number;
  onDecrement: () => void;
  onIncrement: () => void;
  min: number;
  max: number;
}

function StagePicker({ label, idx, onDecrement, onIncrement, min, max }: StagePickerProps) {
  const etape = ETAPES[idx];
  return (
    <View style={w.pickerContainer}>
      <Text style={w.pickerLabel}>{label}</Text>
      <View style={w.pickerRow}>
        <TouchableOpacity
          style={[w.arrowBtn, idx <= min && w.arrowBtnDisabled]}
          onPress={onDecrement}
          disabled={idx <= min}
          activeOpacity={0.7}
        >
          <Text style={[w.arrowBtnText, idx <= min && w.arrowBtnTextDisabled]}>‹</Text>
        </TouchableOpacity>
        <View style={w.pickerValueBox}>
          <Text style={w.pickerNumero}>Étape {etape?.numero ?? idx + 1}</Text>
        </View>
        <TouchableOpacity
          style={[w.arrowBtn, idx >= max && w.arrowBtnDisabled]}
          onPress={onIncrement}
          disabled={idx >= max}
          activeOpacity={0.7}
        >
          <Text style={[w.arrowBtnText, idx >= max && w.arrowBtnTextDisabled]}>›</Text>
        </TouchableOpacity>
      </View>
      {etape && (
        <Text style={w.pickerEtapeName} numberOfLines={1}>
          {etape.depart}
        </Text>
      )}
    </View>
  );
}

// ─── Plan Wizard Modal ────────────────────────────────────────────────────────

interface WizardModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (fromIdx: number, toIdx: number, dateDebut: string) => void;
  initialFromIdx?: number;
  initialToIdx?: number;
  initialDate?: string;
}

function WizardModal({
  visible,
  onClose,
  onConfirm,
  initialFromIdx = 0,
  initialToIdx = 9,
  initialDate = '',
}: WizardModalProps) {
  const [step, setStep] = useState(0);
  const [fromIdx, setFromIdx] = useState(initialFromIdx);
  const [toIdx, setToIdx] = useState(initialToIdx);
  const [dateText, setDateText] = useState(initialDate ? isoToFr(initialDate) : '');
  const [dateError, setDateError] = useState('');

  const safeFrom = Math.min(fromIdx, toIdx);
  const safeTo = Math.max(fromIdx, toIdx);
  const nbEtapes = safeTo - safeFrom + 1;
  const stagesSlice = ETAPES.slice(safeFrom, safeTo + 1);
  const totalKm = stagesSlice.reduce((s, e) => s + e.distance, 0);
  const totalDp = stagesSlice.reduce((s, e) => s + e.denivelePos, 0);

  const handleNext = useCallback(() => {
    if (step === 0) {
      setStep(1);
    } else {
      const iso = parseFrDate(dateText);
      if (!iso) {
        setDateError('Format invalide — utilisez JJ/MM/AAAA');
        return;
      }
      setDateError('');
      onConfirm(safeFrom, safeTo, iso);
    }
  }, [step, dateText, safeFrom, safeTo, onConfirm]);

  const handleBack = useCallback(() => {
    if (step === 1) setStep(0);
    else onClose();
  }, [step, onClose]);

  const handleClose = useCallback(() => {
    setStep(0);
    setDateText('');
    setDateError('');
    onClose();
  }, [onClose]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={w.safe}>
        {/* Header */}
        <View style={w.header}>
          <Text style={w.headerTitle}>Planifier mon trek</Text>
          <TouchableOpacity onPress={handleClose} style={w.closeBtn}>
            <Text style={w.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Step indicator */}
        <View style={w.stepRow}>
          {[0, 1].map((i) => (
            <View key={i} style={w.stepItem}>
              <View style={[w.stepDot, i <= step && w.stepDotActive]}>
                <Text style={[w.stepDotText, i <= step && w.stepDotTextActive]}>
                  {i + 1}
                </Text>
              </View>
              <Text style={[w.stepLabel, i === step && w.stepLabelActive]}>
                {i === 0 ? 'Parcours' : 'Date'}
              </Text>
            </View>
          ))}
          <View style={w.stepLine} />
        </View>

        <ScrollView contentContainerStyle={w.content} showsVerticalScrollIndicator={false}>
          {step === 0 ? (
            /* ── Step 1: Route selection ── */
            <View style={w.card}>
              <Text style={w.cardTitle}>Choix du parcours</Text>
              <Text style={w.cardSubtitle}>
                Sélectionnez la première et la dernière étape de votre trek.
              </Text>

              <View style={w.pickersRow}>
                <StagePicker
                  label="Départ"
                  idx={fromIdx}
                  onDecrement={() => setFromIdx((v) => Math.max(0, v - 1))}
                  onIncrement={() =>
                    setFromIdx((v) => Math.min(toIdx - 1, v + 1))
                  }
                  min={0}
                  max={toIdx - 1}
                />
                <View style={w.pickerSeparator}>
                  <Text style={w.pickerArrow}>→</Text>
                </View>
                <StagePicker
                  label="Arrivée"
                  idx={toIdx}
                  onDecrement={() =>
                    setToIdx((v) => Math.max(fromIdx + 1, v - 1))
                  }
                  onIncrement={() =>
                    setToIdx((v) => Math.min(ETAPES.length - 1, v + 1))
                  }
                  min={fromIdx + 1}
                  max={ETAPES.length - 1}
                />
              </View>

              {/* Computed stats */}
              <View style={w.statsRow}>
                <View style={w.statChip}>
                  <Text style={w.statChipVal}>{nbEtapes}</Text>
                  <Text style={w.statChipLbl}>étapes</Text>
                </View>
                <View style={w.statChip}>
                  <Text style={w.statChipVal}>{totalKm.toFixed(0)} km</Text>
                  <Text style={w.statChipLbl}>distance</Text>
                </View>
                <View style={w.statChip}>
                  <Text style={[w.statChipVal, { color: COLORS.teal }]}>
                    +{totalDp.toLocaleString('fr')} m
                  </Text>
                  <Text style={w.statChipLbl}>dénivelé +</Text>
                </View>
              </View>

              <View style={w.routePreview}>
                <View style={w.routePoint}>
                  <View style={[w.routeDot, { backgroundColor: COLORS.teal }]} />
                  <Text style={w.routeText}>{ETAPES[safeFrom]?.depart}</Text>
                </View>
                <View style={w.routeLine} />
                <View style={w.routePoint}>
                  <View style={[w.routeDot, { backgroundColor: COLORS.red }]} />
                  <Text style={w.routeText}>{ETAPES[safeTo]?.arrivee}</Text>
                </View>
              </View>
            </View>
          ) : (
            /* ── Step 2: Date selection ── */
            <View style={w.card}>
              <Text style={w.cardTitle}>Date de départ</Text>
              <Text style={w.cardSubtitle}>
                Quand commencez-vous votre aventure ?
              </Text>

              <View style={w.dateField}>
                <Text style={w.dateLabel}>Date de départ</Text>
                <TextInput
                  style={[w.dateInput, !!dateError && w.dateInputError]}
                  value={dateText}
                  onChangeText={(t) => {
                    setDateText(t);
                    if (dateError) setDateError('');
                  }}
                  placeholder="JJ/MM/AAAA"
                  placeholderTextColor={COLORS.textFaint}
                  keyboardType="numeric"
                  maxLength={10}
                  autoFocus
                />
                {!!dateError && <Text style={w.dateErrorText}>{dateError}</Text>}
              </View>

              {/* Summary of chosen plan */}
              <View style={w.summaryBox}>
                <Text style={w.summaryTitle}>Récapitulatif</Text>
                <Text style={w.summaryLine}>
                  {nbEtapes} étapes · {totalKm.toFixed(0)} km · +{totalDp.toLocaleString('fr')} m D+
                </Text>
                <Text style={w.summaryRoute}>
                  {ETAPES[safeFrom]?.depart} → {ETAPES[safeTo]?.arrivee}
                </Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Footer buttons */}
        <View style={w.footer}>
          <TouchableOpacity style={w.backBtn} onPress={handleBack}>
            <Text style={w.backBtnText}>{step === 0 ? 'Annuler' : '← Précédent'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={w.nextBtn} onPress={handleNext}>
            <Text style={w.nextBtnText}>
              {step === 0 ? 'Suivant →' : 'Créer mon trek ✓'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

// ─── DayDetailModal ───────────────────────────────────────────────────────────

interface DayDetailModalProps {
  jour: TrekJour;
  jourIndex: number;
  onClose: () => void;
  onSave: (updates: Partial<TrekJour>) => void;
}

function DayDetailModal({ jour, jourIndex, onClose, onSave }: DayDetailModalProps) {
  const etape = etapeForId(jour.etapeId);
  const [hebergement, setHebergement] = useState<TrekHebergement>({ ...jour.hebergement });
  const [notes, setNotes] = useState(jour.notes);

  const etapeRefuges: Refuge[] = useMemo(
    () => REFUGES.filter((r) => r.etapeId === jour.etapeId),
    [jour.etapeId],
  );
  const etapeBivouacs: Bivouac[] = useMemo(
    () => BIVOUACS.filter((b) => b.etapeId === jour.etapeId),
    [jour.etapeId],
  );

  const selectRefuge = useCallback(
    (refuge: Refuge) => {
      setHebergement((prev) => {
        const same = prev.type === refuge.type && prev.id === refuge.id;
        if (same) {
          return { type: null, id: null, nom: 'Hébergement à définir', confirmed: false };
        }
        return {
          type: refuge.type as HebergType,
          id: refuge.id,
          nom: refuge.nom,
          confirmed: prev.confirmed,
        };
      });
    },
    [],
  );

  const selectBivouac = useCallback(
    (biv: Bivouac) => {
      setHebergement((prev) => {
        const same = prev.type === 'bivouac' && prev.id === biv.id;
        if (same) {
          return { type: null, id: null, nom: 'Hébergement à définir', confirmed: false };
        }
        return {
          type: 'bivouac',
          id: biv.id,
          nom: biv.nom,
          confirmed: prev.confirmed,
        };
      });
    },
    [],
  );

  const selectLibre = useCallback(() => {
    setHebergement((prev) => {
      if (prev.type === 'libre') {
        return { type: null, id: null, nom: 'Hébergement à définir', confirmed: false };
      }
      return { type: 'libre', id: null, nom: 'Bivouac libre', confirmed: false };
    });
  }, []);

  const handleSave = useCallback(() => {
    onSave({ hebergement, notes });
    onClose();
  }, [hebergement, notes, onSave, onClose]);

  if (!etape) return null;

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={dm.safe}>
        {/* Header */}
        <View style={dm.header}>
          <View>
            <Text style={dm.headerDay}>Jour {jourIndex + 1}</Text>
            <Text style={dm.headerDate}>{formatDate(jour.date)}</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={dm.closeBtn}>
            <Text style={dm.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={dm.content} showsVerticalScrollIndicator={false}>
          {/* Stage section */}
          <View style={dm.section}>
            <Text style={dm.sectionTitle}>Étape {etape.numero}</Text>
            <View style={dm.etapeCard}>
              <Text style={dm.etapeNom}>{etape.nom}</Text>
              <View style={dm.etapeRoute}>
                <View style={[dm.routeDot, { backgroundColor: COLORS.teal }]} />
                <Text style={dm.routeText}>{etape.depart}</Text>
                <Text style={dm.routeArrow}> → </Text>
                <View style={[dm.routeDot, { backgroundColor: COLORS.red }]} />
                <Text style={dm.routeText}>{etape.arrivee}</Text>
              </View>
              <View style={dm.statsRow}>
                <View style={dm.statItem}>
                  <Text style={dm.statValue}>{etape.distance} km</Text>
                  <Text style={dm.statLabel}>distance</Text>
                </View>
                <View style={dm.statDivider} />
                <View style={dm.statItem}>
                  <Text style={[dm.statValue, { color: COLORS.teal }]}>+{etape.denivelePos} m</Text>
                  <Text style={dm.statLabel}>dénivelé +</Text>
                </View>
                <View style={dm.statDivider} />
                <View style={dm.statItem}>
                  <Text style={[dm.statValue, { color: COLORS.red }]}>-{etape.deniveleNeg} m</Text>
                  <Text style={dm.statLabel}>dénivelé -</Text>
                </View>
                <View style={dm.statDivider} />
                <View style={dm.statItem}>
                  <Text style={dm.statValue}>{etape.dureeEstimee}h</Text>
                  <Text style={dm.statLabel}>durée</Text>
                </View>
              </View>
              <View
                style={[
                  dm.diffBadge,
                  { backgroundColor: DIFFICULTE_COLOR[etape.difficulte] },
                ]}
              >
                <Text style={dm.diffText}>{DIFFICULTE_LABEL[etape.difficulte]}</Text>
              </View>
            </View>
          </View>

          {/* Accommodation section */}
          <View style={dm.section}>
            <Text style={dm.sectionTitle}>Hébergement du soir</Text>

            {etapeRefuges.length === 0 && etapeBivouacs.length === 0 && (
              <Text style={dm.noHebergTxt}>
                Aucun hébergement référencé pour cette étape.
              </Text>
            )}

            {etapeRefuges.length > 0 && (
              <View style={dm.chipGroup}>
                {etapeRefuges.map((r) => {
                  const selected = hebergement.type === r.type && hebergement.id === r.id;
                  return (
                    <TouchableOpacity
                      key={r.id}
                      style={[dm.chip, selected && dm.chipSelected]}
                      onPress={() => selectRefuge(r)}
                      activeOpacity={0.75}
                    >
                      <Text style={dm.chipIcon}>{HEBERGEMENT_ICON[r.type] ?? '🏠'}</Text>
                      <View style={dm.chipInfo}>
                        <Text
                          style={[dm.chipName, selected && dm.chipNameSelected]}
                          numberOfLines={1}
                        >
                          {r.nom}
                        </Text>
                        <Text style={dm.chipMeta}>
                          {r.altitude} m · {r.prixNuit}€/nuit
                        </Text>
                      </View>
                      {selected && <Text style={dm.chipCheck}>✓</Text>}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {etapeBivouacs.length > 0 && (
              <View style={dm.chipGroup}>
                {etapeBivouacs.map((b) => {
                  const selected = hebergement.type === 'bivouac' && hebergement.id === b.id;
                  return (
                    <TouchableOpacity
                      key={b.id}
                      style={[dm.chip, selected && dm.chipSelected]}
                      onPress={() => selectBivouac(b)}
                      activeOpacity={0.75}
                    >
                      <Text style={dm.chipIcon}>🌙</Text>
                      <View style={dm.chipInfo}>
                        <Text
                          style={[dm.chipName, selected && dm.chipNameSelected]}
                          numberOfLines={1}
                        >
                          {b.nom}
                        </Text>
                        <Text style={dm.chipMeta}>{b.altitude} m · bivouac</Text>
                      </View>
                      {selected && <Text style={dm.chipCheck}>✓</Text>}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Bivouac libre */}
            <TouchableOpacity
              style={[dm.chip, hebergement.type === 'libre' && dm.chipSelected]}
              onPress={selectLibre}
              activeOpacity={0.75}
            >
              <Text style={dm.chipIcon}>🌙</Text>
              <View style={dm.chipInfo}>
                <Text
                  style={[dm.chipName, hebergement.type === 'libre' && dm.chipNameSelected]}
                >
                  Bivouac libre
                </Text>
                <Text style={dm.chipMeta}>emplacement au choix</Text>
              </View>
              {hebergement.type === 'libre' && <Text style={dm.chipCheck}>✓</Text>}
            </TouchableOpacity>

            {/* Confirmed checkbox */}
            {hebergement.type !== null && (
              <TouchableOpacity
                style={dm.confirmRow}
                onPress={() =>
                  setHebergement((prev) => ({ ...prev, confirmed: !prev.confirmed }))
                }
                activeOpacity={0.7}
              >
                <View style={[dm.checkbox, hebergement.confirmed && dm.checkboxChecked]}>
                  {hebergement.confirmed && <Text style={dm.checkmark}>✓</Text>}
                </View>
                <Text style={dm.confirmLabel}>Réservation confirmée</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Notes section */}
          <View style={dm.section}>
            <Text style={dm.sectionTitle}>Notes personnelles</Text>
            <TextInput
              style={dm.notesInput}
              value={notes}
              onChangeText={setNotes}
              placeholder="Ajoutez vos notes, rappels, contacts…"
              placeholderTextColor={COLORS.textFaint}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </ScrollView>

        {/* Save button */}
        <View style={dm.saveBar}>
          <TouchableOpacity style={dm.saveBtn} onPress={handleSave} activeOpacity={0.85}>
            <Text style={dm.saveBtnText}>Enregistrer</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

// ─── DayCard ──────────────────────────────────────────────────────────────────

interface DayCardProps {
  jour: TrekJour;
  index: number;
  onPress: () => void;
}

function DayCard({ jour, index, onPress }: DayCardProps) {
  const etape = etapeForId(jour.etapeId);
  if (!etape) return null;

  const barColor = DIFFICULTE_COLOR[etape.difficulte] ?? COLORS.teal;
  const hasHebergt = jour.hebergement.type !== null;

  return (
    <TouchableOpacity style={dc.card} onPress={onPress} activeOpacity={0.82}>
      {/* Colored left bar */}
      <View style={[dc.bar, { backgroundColor: barColor }]} />

      <View style={dc.body}>
        {/* Top row: day badge + stage info */}
        <View style={dc.topRow}>
          <View style={dc.dayBadge}>
            <Text style={dc.dayBadgeNum}>{index + 1}</Text>
          </View>
          <View style={dc.stageInfo}>
            <Text style={dc.stageName} numberOfLines={1}>
              {etape.nom}
            </Text>
            <Text style={dc.stageRoute} numberOfLines={1}>
              {etape.depart} → {etape.arrivee}
            </Text>
          </View>
          <View style={dc.dateBox}>
            <Text style={dc.dateText}>{formatDate(jour.date)}</Text>
          </View>
        </View>

        {/* Stats row */}
        <View style={dc.statsRow}>
          <Text style={dc.statItem}>📏 {etape.distance} km</Text>
          <Text style={dc.statItem}>
            <Text style={{ color: COLORS.teal }}>▲</Text> {etape.denivelePos} m
          </Text>
          <Text style={dc.statItem}>⏱ {etape.dureeEstimee}h</Text>
          <View style={[dc.diffPill, { backgroundColor: barColor + '22' }]}>
            <Text style={[dc.diffPillText, { color: barColor }]}>
              {DIFFICULTE_LABEL[etape.difficulte]}
            </Text>
          </View>
        </View>

        {/* Accommodation badge */}
        <View style={dc.hebergRow}>
          {hasHebergt ? (
            <View style={dc.hebergBadge}>
              <Text style={dc.hebergIcon}>
                {HEBERGEMENT_ICON[jour.hebergement.type!] ?? '🏠'}
              </Text>
              <Text style={dc.hebergName} numberOfLines={1}>
                {jour.hebergement.nom}
              </Text>
              {jour.hebergement.confirmed && (
                <View style={dc.confirmedDot} />
              )}
            </View>
          ) : (
            <View style={dc.hebergUndefined}>
              <Text style={dc.hebergUndefinedText}>Hébergement à définir</Text>
            </View>
          )}
          <Text style={dc.chevron}>›</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ onPlan }: { onPlan: () => void }) {
  return (
    <View style={es.container}>
      <View style={es.artContainer}>
        <Text style={es.mountainBig}>🏔</Text>
        <Text style={es.mountainLeft}>⛰</Text>
        <Text style={es.mountainRight}>⛰</Text>
        <Text style={es.cloudLeft}>☁</Text>
        <Text style={es.cloudRight}>☁</Text>
      </View>
      <Text style={es.title}>Prêt pour l'aventure ?</Text>
      <Text style={es.subtitle}>
        Planifiez votre trek étape par étape, choisissez vos hébergements et suivez votre
        progression sur le GR10.
      </Text>
      <TouchableOpacity style={es.ctaButton} onPress={onPlan} activeOpacity={0.85}>
        <Text style={es.ctaButtonText}>Planifier mon trek</Text>
      </TouchableOpacity>
      <View style={es.infoRow}>
        <View style={es.infoChip}>
          <Text style={es.infoChipText}>🗓 {ETAPES.length} étapes</Text>
        </View>
        <View style={es.infoChip}>
          <Text style={es.infoChipText}>
            📏 ~{ETAPES.reduce((s, e) => s + e.distance, 0).toFixed(0)} km
          </Text>
        </View>
        <View style={es.infoChip}>
          <Text style={es.infoChipText}>🌊 → 🏖</Text>
        </View>
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function TrekScreen() {
  const { trekPlan, setTrekPlan, updateJour } = useTrek();
  const [wizardVisible, setWizardVisible] = useState(false);
  const [detailJour, setDetailJour] = useState<{ jour: TrekJour; idx: number } | null>(null);

  const stats = useMemo(() => {
    if (!trekPlan) return { totalKm: 0, totalDp: 0 };
    return computePlanStats(trekPlan.jours);
  }, [trekPlan]);

  const handleCreatePlan = useCallback(
    (fromIdx: number, toIdx: number, dateDebut: string) => {
      const plan = buildTrekPlan(fromIdx, toIdx, dateDebut);
      setTrekPlan(plan);
      setWizardVisible(false);
    },
    [setTrekPlan],
  );

  const handleOpenWizard = useCallback(() => {
    setWizardVisible(true);
  }, []);

  const handleSaveJour = useCallback(
    (etapeId: number, updates: Partial<TrekJour>) => {
      updateJour(etapeId, updates);
    },
    [updateJour],
  );

  // Find initial wizard indices from current plan
  const wizardInitialFrom = useMemo(() => {
    if (!trekPlan || trekPlan.jours.length === 0) return 0;
    const firstId = trekPlan.jours[0].etapeId;
    const idx = ETAPES.findIndex((e) => e.id === firstId);
    return idx >= 0 ? idx : 0;
  }, [trekPlan]);

  const wizardInitialTo = useMemo(() => {
    if (!trekPlan || trekPlan.jours.length === 0) return Math.min(9, ETAPES.length - 1);
    const lastId = trekPlan.jours[trekPlan.jours.length - 1].etapeId;
    const idx = ETAPES.findIndex((e) => e.id === lastId);
    return idx >= 0 ? idx : Math.min(9, ETAPES.length - 1);
  }, [trekPlan]);

  return (
    <SafeAreaView style={s.container}>
      {/* ── Header ── */}
      <View style={s.header}>
        <View style={s.headerRow}>
          <View style={s.headerLeft}>
            <Text style={s.headerTitle}>Mon Trek GR10</Text>
            {trekPlan ? (
              <Text style={s.headerSub} numberOfLines={1}>
                {trekPlan.nom}
              </Text>
            ) : (
              <Text style={s.headerSub}>Hendaye → Banyuls · Pyrénées</Text>
            )}
          </View>
          {trekPlan && (
            <TouchableOpacity style={s.editBtn} onPress={handleOpenWizard} activeOpacity={0.8}>
              <Text style={s.editBtnText}>✎ Modifier</Text>
            </TouchableOpacity>
          )}
        </View>

        {trekPlan && (
          <View style={s.statsBar}>
            <View style={s.statBarItem}>
              <Text style={s.statBarVal}>{trekPlan.jours.length}</Text>
              <Text style={s.statBarLbl}>jours</Text>
            </View>
            <View style={s.statBarDivider} />
            <View style={s.statBarItem}>
              <Text style={s.statBarVal}>{stats.totalKm.toFixed(0)} km</Text>
              <Text style={s.statBarLbl}>distance</Text>
            </View>
            <View style={s.statBarDivider} />
            <View style={s.statBarItem}>
              <Text style={[s.statBarVal, { color: COLORS.muted }]}>
                +{stats.totalDp.toLocaleString('fr')} m
              </Text>
              <Text style={s.statBarLbl}>dénivelé</Text>
            </View>
          </View>
        )}
      </View>

      {/* ── Content ── */}
      {!trekPlan ? (
        <EmptyState onPlan={handleOpenWizard} />
      ) : (
        <ScrollView
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
        >
          {trekPlan.jours.map((jour, idx) => (
            <DayCard
              key={jour.etapeId}
              jour={jour}
              index={idx}
              onPress={() => setDetailJour({ jour, idx })}
            />
          ))}
          <TouchableOpacity
            style={s.resetBtn}
            onPress={() => setTrekPlan(null)}
            activeOpacity={0.7}
          >
            <Text style={s.resetBtnText}>Supprimer ce plan</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* ── Wizard ── */}
      <WizardModal
        visible={wizardVisible}
        onClose={() => setWizardVisible(false)}
        onConfirm={handleCreatePlan}
        initialFromIdx={wizardInitialFrom}
        initialToIdx={wizardInitialTo}
        initialDate={trekPlan?.dateDebut ?? ''}
      />

      {/* ── Day Detail Modal ── */}
      {detailJour && (
        <DayDetailModal
          jour={detailJour.jour}
          jourIndex={detailJour.idx}
          onClose={() => setDetailJour(null)}
          onSave={(updates) => handleSaveJour(detailJour.jour.etapeId, updates)}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Styles: Main screen ──────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.light,
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    gap: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  headerLeft: {
    flex: 1,
    gap: 4,
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerSub: {
    color: COLORS.muted,
    fontSize: 13,
  },
  editBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginTop: 2,
  },
  editBtnText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '600',
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  statBarItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statBarVal: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
  statBarLbl: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statBarDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginVertical: 4,
  },
  list: {
    padding: 16,
    gap: 12,
    paddingBottom: 32,
  },
  resetBtn: {
    alignSelf: 'center',
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  resetBtnText: {
    color: COLORS.textFaint,
    fontSize: 13,
    textDecorationLine: 'underline',
  },
});

// ─── Styles: Empty state ──────────────────────────────────────────────────────

const es = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 16,
    backgroundColor: COLORS.light,
  },
  artContainer: {
    height: 100,
    width: 160,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  mountainBig: {
    fontSize: 72,
    position: 'absolute',
    bottom: 0,
    alignSelf: 'center',
  },
  mountainLeft: {
    fontSize: 40,
    position: 'absolute',
    bottom: 0,
    left: 0,
    opacity: 0.6,
  },
  mountainRight: {
    fontSize: 40,
    position: 'absolute',
    bottom: 0,
    right: 0,
    opacity: 0.6,
  },
  cloudLeft: {
    fontSize: 22,
    position: 'absolute',
    top: 0,
    left: 8,
    opacity: 0.5,
  },
  cloudRight: {
    fontSize: 18,
    position: 'absolute',
    top: 4,
    right: 4,
    opacity: 0.4,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.primary,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textSub,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 300,
  },
  ctaButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    marginTop: 8,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  ctaButtonText: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  infoChip: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  infoChipText: {
    fontSize: 12,
    color: COLORS.textSub,
    fontWeight: '500',
  },
});

// ─── Styles: DayCard ──────────────────────────────────────────────────────────

const dc = StyleSheet.create({
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  bar: {
    width: 5,
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
  },
  body: {
    flex: 1,
    padding: 14,
    gap: 10,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  dayBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayBadgeNum: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700',
  },
  stageInfo: {
    flex: 1,
    gap: 3,
  },
  stageName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textMain,
    lineHeight: 18,
  },
  stageRoute: {
    fontSize: 12,
    color: COLORS.textSub,
  },
  dateBox: {
    alignItems: 'flex-end',
  },
  dateText: {
    fontSize: 11,
    color: COLORS.textFaint,
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  statItem: {
    fontSize: 12,
    color: COLORS.textSub,
    fontWeight: '500',
  },
  diffPill: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginLeft: 'auto' as any,
  },
  diffPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  hebergRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    paddingTop: 10,
  },
  hebergBadge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  hebergIcon: {
    fontSize: 14,
  },
  hebergName: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textMain,
    fontWeight: '500',
  },
  confirmedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.teal,
  },
  hebergUndefined: {
    flex: 1,
  },
  hebergUndefinedText: {
    fontSize: 13,
    color: '#F4A261',
    fontWeight: '500',
    fontStyle: 'italic',
  },
  chevron: {
    fontSize: 18,
    color: COLORS.textFaint,
    marginLeft: 8,
  },
});

// ─── Styles: Wizard ───────────────────────────────────────────────────────────

const w = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.light,
  },
  header: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  closeBtnText: {
    color: COLORS.muted,
    fontSize: 18,
    fontWeight: '600',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 20,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    gap: 0,
  },
  stepLine: {
    position: 'absolute',
    left: 60,
    right: 60,
    top: 30,
    height: 2,
    backgroundColor: COLORS.borderLight,
    zIndex: 0,
  },
  stepItem: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    zIndex: 1,
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.borderLight,
  },
  stepDotActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  stepDotText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textFaint,
  },
  stepDotTextActive: {
    color: COLORS.white,
  },
  stepLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textFaint,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  stepLabelActive: {
    color: COLORS.primary,
  },
  content: {
    padding: 20,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    gap: 20,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
  },
  cardSubtitle: {
    fontSize: 14,
    color: COLORS.textSub,
    lineHeight: 20,
    marginTop: -12,
  },
  pickersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pickerContainer: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  pickerLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textFaint,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  arrowBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowBtnDisabled: {
    backgroundColor: COLORS.borderLight,
  },
  arrowBtnText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 22,
  },
  arrowBtnTextDisabled: {
    color: COLORS.textFaint,
  },
  pickerValueBox: {
    minWidth: 50,
    alignItems: 'center',
  },
  pickerNumero: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primary,
  },
  pickerEtapeName: {
    fontSize: 12,
    color: COLORS.textSub,
    textAlign: 'center',
    maxWidth: 100,
  },
  pickerSeparator: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    paddingTop: 16,
  },
  pickerArrow: {
    fontSize: 18,
    color: COLORS.textFaint,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statChip: {
    flex: 1,
    backgroundColor: COLORS.light,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    gap: 2,
  },
  statChipVal: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primary,
  },
  statChipLbl: {
    fontSize: 10,
    color: COLORS.textFaint,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  routePreview: {
    backgroundColor: COLORS.light,
    borderRadius: 10,
    padding: 14,
    gap: 8,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  routeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  routeText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  routeLine: {
    width: 2,
    height: 16,
    backgroundColor: COLORS.borderLight,
    marginLeft: 4,
  },
  dateField: {
    gap: 8,
  },
  dateLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMain,
  },
  dateInput: {
    backgroundColor: COLORS.light,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.textMain,
    fontWeight: '500',
  },
  dateInputError: {
    borderColor: COLORS.red,
  },
  dateErrorText: {
    fontSize: 12,
    color: COLORS.red,
    fontWeight: '500',
  },
  summaryBox: {
    backgroundColor: COLORS.light,
    borderRadius: 10,
    padding: 14,
    gap: 6,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  summaryTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textFaint,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryLine: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  summaryRoute: {
    fontSize: 13,
    color: COLORS.textSub,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  backBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: COLORS.light,
    alignItems: 'center',
  },
  backBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textSub,
  },
  nextBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  nextBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.white,
  },
});

// ─── Styles: DayDetailModal ───────────────────────────────────────────────────

const dm = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.light,
  },
  header: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  headerDay: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  headerDate: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  closeBtn: {
    padding: 4,
    marginTop: 2,
  },
  closeBtnText: {
    color: COLORS.muted,
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    padding: 16,
    gap: 16,
    paddingBottom: 24,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textFaint,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    paddingLeft: 2,
  },
  etapeCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  etapeNom: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.primary,
    lineHeight: 22,
  },
  etapeRoute: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'wrap',
  },
  routeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  routeText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMain,
  },
  routeArrow: {
    fontSize: 13,
    color: COLORS.textFaint,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 10,
    color: COLORS.textFaint,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: COLORS.borderLight,
  },
  diffBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  diffText: {
    fontSize: 12,
    color: COLORS.white,
    fontWeight: '700',
  },
  noHebergTxt: {
    fontSize: 13,
    color: COLORS.textFaint,
    fontStyle: 'italic',
    paddingLeft: 2,
  },
  chipGroup: {
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
    gap: 10,
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  chipSelected: {
    borderColor: COLORS.teal,
    backgroundColor: '#F0FBF9',
  },
  chipIcon: {
    fontSize: 20,
  },
  chipInfo: {
    flex: 1,
    gap: 2,
  },
  chipName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textMain,
  },
  chipNameSelected: {
    color: COLORS.teal,
  },
  chipMeta: {
    fontSize: 11,
    color: COLORS.textFaint,
  },
  chipCheck: {
    fontSize: 16,
    color: COLORS.teal,
    fontWeight: '700',
  },
  confirmRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
    paddingLeft: 4,
    marginTop: 4,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: COLORS.teal,
    borderColor: COLORS.teal,
  },
  checkmark: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700',
  },
  confirmLabel: {
    fontSize: 14,
    color: COLORS.textMain,
    fontWeight: '500',
  },
  notesInput: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
    padding: 14,
    fontSize: 14,
    color: COLORS.textMain,
    minHeight: 100,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  saveBar: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  saveBtn: {
    backgroundColor: COLORS.teal,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    shadowColor: COLORS.teal,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  saveBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
