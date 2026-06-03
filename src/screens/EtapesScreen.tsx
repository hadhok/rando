import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ETAPES, TOTAL_KM, TOTAL_DENIVELE, Etape } from '../data/etapes';
import { ETAPES_BIDARRAY_SARE, TOTAL_KM_BS, TOTAL_DENIVELE_BS } from '../data/etapes_bidarray_sare';
import { useGpx } from '../context/GpxContext';
import { GpxWaypoint, GpxBadge, GpxTrack } from '../utils/gpxParser';
import { BadgeType, Itineraire, ItDay, ItWaypoint, parseItineraire } from '../utils/itineraireParser';

// ─── GR10 helpers ─────────────────────────────────────────────────────────────

const DIFFICULTE_COLOR: Record<string, string> = {
  facile: '#2A9D8F', moyen: '#E9C46A', difficile: '#F4A261', tres_difficile: '#E63946',
};
const DIFFICULTE_LABEL: Record<string, string> = {
  facile: 'Facile', moyen: 'Moyen', difficile: 'Difficile', tres_difficile: 'Très difficile',
};

function ElevationBar({ pos, neg }: { pos: number; neg: number }) {
  const max = Math.max(pos, neg, 1);
  return (
    <View style={s.elevBar}>
      <View style={s.elevRow}>
        <Text style={s.elevLabel}>▲ {pos}m</Text>
        <View style={[s.elevFill, s.elevPos, { width: `${(pos / max) * 100}%` as any }]} />
      </View>
      <View style={s.elevRow}>
        <Text style={s.elevLabel}>▼ {neg}m</Text>
        <View style={[s.elevFill, s.elevNeg, { width: `${(neg / max) * 100}%` as any }]} />
      </View>
    </View>
  );
}

function EtapeCard({ etape, onPress }: { etape: Etape; onPress: () => void }) {
  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.8}>
      <View style={s.cardHeader}>
        <View style={s.numBadge}><Text style={s.numText}>{etape.numero}</Text></View>
        <View style={s.cardInfo}>
          <Text style={s.cardNom}>{etape.nom}</Text>
          <Text style={s.cardSub}>{etape.distance} km · {etape.dureeEstimee}h</Text>
        </View>
        <View style={[s.diffBadge, { backgroundColor: DIFFICULTE_COLOR[etape.difficulte] }]}>
          <Text style={s.diffText}>{DIFFICULTE_LABEL[etape.difficulte]}</Text>
        </View>
      </View>
      <ElevationBar pos={etape.denivelePos} neg={etape.deniveleNeg} />
    </TouchableOpacity>
  );
}

function InfoSection({ icon, title, content }: { icon: string; title: string; content: string }) {
  return (
    <View style={s.infoSection}>
      <View style={s.infoSectionHeader}>
        <Text style={s.infoSectionIcon}>{icon}</Text>
        <Text style={s.infoSectionTitle}>{title}</Text>
      </View>
      <Text style={s.infoSectionContent}>{content}</Text>
    </View>
  );
}

function EtapeDetail({ etape, onClose }: { etape: Etape; onClose: () => void }) {
  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={s.modal}>
        <View style={s.modalHeader}>
          <Text style={s.modalTitle}>Étape {etape.numero}</Text>
          <TouchableOpacity onPress={onClose} style={s.closeBtn}>
            <Text style={s.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={s.modalContent}>
          <Text style={s.modalNom}>{etape.nom}</Text>
          <View style={[s.diffBadgeLarge, { backgroundColor: DIFFICULTE_COLOR[etape.difficulte] }]}>
            <Text style={s.diffTextLarge}>{DIFFICULTE_LABEL[etape.difficulte]}</Text>
          </View>
          <View style={s.statsGrid}>
            <StatBox label="Distance"    value={`${etape.distance} km`}      icon="📏" />
            <StatBox label="Durée"       value={`${etape.dureeEstimee}h`}    icon="⏱" />
            <StatBox label="Dénivelé +"  value={`+${etape.denivelePos} m`}   icon="▲" />
            <StatBox label="Dénivelé -"  value={`-${etape.deniveleNeg} m`}   icon="▼" />
          </View>
          <View style={s.itineraireBox}>
            <View style={s.itineraireRow}>
              <View style={[s.dot, { backgroundColor: '#2A9D8F' }]} />
              <Text style={s.itineraireText}>{etape.depart}</Text>
            </View>
            <View style={s.itineraireLineFill} />
            <View style={s.itineraireRow}>
              <View style={[s.dot, { backgroundColor: '#E63946' }]} />
              <Text style={s.itineraireText}>{etape.arrivee}</Text>
            </View>
          </View>
          <Text style={s.sectionTitle}>Description</Text>
          <Text style={s.description}>{etape.description}</Text>
          <InfoSection icon="🗺" title="Itinéraire & terrain"   content={etape.itineraire} />
          <InfoSection icon="🛒" title="Ravitaillement"          content={etape.ravitaillement} />
          <InfoSection icon="💧" title="Points d'eau"            content={etape.eau} />
          <InfoSection icon="🏠" title="Hébergement à l'arrivée" content={etape.hebergement} />
          <View style={s.retourBox}>
            <View style={s.retourHeader}>
              <Text style={s.retourIcon}>🚆</Text>
              <Text style={s.retourTitle}>Retour à Hendaye</Text>
            </View>
            <Text style={s.retourContent}>{etape.retourHendaye}</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function StatBox({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <View style={s.statBox}>
      <Text style={s.statIcon}>{icon}</Text>
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

// ─── GPX computed view ────────────────────────────────────────────────────────

const GPX_BADGE: Record<GpxBadge, { label: string; bg: string; color: string }> = {
  eau:     { label: '💧 eau',     bg: '#DBEAFE', color: '#1E40AF' },
  bivouac: { label: '🏕 bivouac', bg: '#FEF3C7', color: '#92400E' },
  refuge:  { label: '🏠 refuge',  bg: '#EDE9FE', color: '#5B21B6' },
  parking: { label: '🅿️ départ',  bg: '#F3F4F6', color: '#6B7280' },
  sommet:  { label: '⛰ col',     bg: '#D1FAE5', color: '#065F46' },
};

const DEPART_H = 9;
function fmtArrival(h: number) {
  const tot = Math.round(DEPART_H * 60 + h * 60);
  return `${String(Math.floor(tot / 60)).padStart(2, '0')}h${String(tot % 60).padStart(2, '0')}`;
}
function fmtDur(h: number) {
  const m = Math.round(h * 60);
  if (m === 0) return '—';
  const hh = Math.floor(m / 60);
  const mm = m % 60;
  if (hh === 0) return `${mm}min`;
  return mm === 0 ? `${hh}h` : `${hh}h${String(mm).padStart(2, '0')}`;
}

function GpxWayptRow({ wpt, isFirst, isLast }: { wpt: GpxWaypoint; isFirst: boolean; isLast: boolean }) {
  return (
    <View style={[gpx.row, isLast && gpx.rowLast]}>
      <View style={gpx.timelineCol}>
        <View style={[gpx.dot, isFirst ? gpx.dotStart : isLast ? gpx.dotEnd : gpx.dotMid]} />
        {!isLast && <View style={gpx.line} />}
      </View>
      <View style={gpx.rowContent}>
        <View style={gpx.rowTop}>
          <Text style={[gpx.name, (isFirst || isLast) && gpx.nameBold]} numberOfLines={2}>
            {wpt.name}
          </Text>
          <Text style={[gpx.time, isFirst && gpx.timeDepart]}>
            {isFirst ? `dep. ${fmtArrival(0)}` : fmtArrival(wpt.cumTimeH)}
          </Text>
        </View>
        {wpt.badges.length > 0 && (
          <View style={gpx.badges}>
            {wpt.badges.map((b) => (
              <View key={b} style={[gpx.badge, { backgroundColor: GPX_BADGE[b].bg }]}>
                <Text style={[gpx.badgeTxt, { color: GPX_BADGE[b].color }]}>{GPX_BADGE[b].label}</Text>
              </View>
            ))}
          </View>
        )}
        <View style={gpx.stats}>
          {!isFirst && <Text style={gpx.statTxt}><Text style={gpx.statLbl}>dist </Text>{wpt.distCumKm.toFixed(1)} km</Text>}
          {wpt.ele != null && <Text style={gpx.statTxt}><Text style={gpx.statLbl}>alt </Text>{Math.round(wpt.ele)} m</Text>}
          {!isFirst && <>
            <Text style={[gpx.statTxt, gpx.dp]}>▲{Math.round(wpt.dpCumM)} m</Text>
            <Text style={[gpx.statTxt, gpx.dm]}>▼{Math.round(wpt.dmCumM)} m</Text>
            <Text style={gpx.statTxt}><Text style={gpx.statLbl}>seg </Text>+{fmtDur(wpt.segTimeH)}</Text>
            <Text style={gpx.statTxt}><Text style={gpx.statLbl}>cum </Text>{fmtDur(wpt.cumTimeH)}</Text>
          </>}
        </View>
      </View>
    </View>
  );
}

function GpxItinerary({ track }: { track: GpxTrack }) {
  const waypoints = track.waypoints ?? [];
  const hasWaypoints = waypoints.length > 0;
  const last = hasWaypoints ? waypoints[waypoints.length - 1] : null;
  return (
    <ScrollView contentContainerStyle={gpx.container} showsVerticalScrollIndicator={false}>
      <View style={gpx.header}>
        <Text style={gpx.headerTitle}>{track.name}</Text>
        {last && (
          <View style={gpx.headerStats}>
            <View style={gpx.chip}><Text style={gpx.chipVal}>{last.distCumKm.toFixed(1)} km</Text><Text style={gpx.chipLbl}>distance</Text></View>
            <View style={gpx.chip}><Text style={[gpx.chipVal, { color: '#0F6E56' }]}>+{Math.round(last.dpCumM)} m</Text><Text style={gpx.chipLbl}>dénivelé +</Text></View>
            <View style={gpx.chip}><Text style={[gpx.chipVal, { color: '#993C1D' }]}>-{Math.round(last.dmCumM)} m</Text><Text style={gpx.chipLbl}>dénivelé -</Text></View>
            <View style={gpx.chip}><Text style={gpx.chipVal}>{fmtDur(last.cumTimeH)}</Text><Text style={gpx.chipLbl}>durée</Text></View>
          </View>
        )}
        <Text style={gpx.naismith}>Naismith · 4 km/h plat · +300 m/h montée · -500 m/h descente · départ 09h00</Text>
      </View>
      {hasWaypoints ? (
        <View style={gpx.list}>
          {waypoints.map((wpt, i) => (
            <GpxWayptRow key={i} wpt={wpt} isFirst={i === 0} isLast={i === waypoints.length - 1} />
          ))}
        </View>
      ) : (
        <View style={gpx.emptyBox}>
          <Text style={gpx.emptyIcon}>📍</Text>
          <Text style={gpx.emptyTitle}>Pas d'étapes dans ce fichier</Text>
          <Text style={gpx.emptySub}>Ce GPX contient uniquement le tracé.{'\n'}Ajoutez des waypoints dans votre application GPS.</Text>
          {track.points.length > 0 && <Text style={gpx.emptyPts}>{track.points.length} points de trace importés</Text>}
        </View>
      )}
    </ScrollView>
  );
}

// ─── HTML itinerary view ──────────────────────────────────────────────────────

const IT_BADGE: Record<BadgeType, { label: string; bg: string; color: string }> = {
  dep:  { label: 'départ',          bg: '#F3F4F6', color: '#6B7280' },
  fin:  { label: 'arrivée',         bg: '#FEE2E2', color: '#991B1B' },
  eau:  { label: '💧 eau',          bg: '#DBEAFE', color: '#1E40AF' },
  biv:  { label: '🏕 bivouac',      bg: '#FEF3C7', color: '#92400E' },
  ref:  { label: '🏠 refuge',       bg: '#EDE9FE', color: '#5B21B6' },
  parc: { label: '🌿 Parc National', bg: '#D1FAE5', color: '#065F46' },
  star: { label: '⭐ pause repas',  bg: '#FEF3C7', color: '#92400E' },
  stop: { label: '🚫 interdit',     bg: '#FEE2E2', color: '#991B1B' },
};

const ROW_BG: Record<string, string> = {
  lac:    '#F0FDF4',
  biv:    '#FFFBEB',
  star:   '#EFF6FF',
  jstart: '#EFF6FF',
};

function ItWayptRow({ wpt, isFirst, isLast }: { wpt: ItWaypoint; isFirst: boolean; isLast: boolean }) {
  const bg = ROW_BG[wpt.rowClass] ?? '#fff';
  const isDep = wpt.badges.includes('dep');
  const isFin = wpt.badges.includes('fin') || isLast;
  return (
    <View style={[it.row, isLast && it.rowLast, { backgroundColor: bg }]}>
      <View style={it.timelineCol}>
        <View style={[it.dot, isDep ? it.dotStart : isFin ? it.dotEnd : it.dotMid]} />
        {!isLast && <View style={it.line} />}
      </View>
      <View style={it.rowContent}>
        <View style={it.rowTop}>
          <Text style={[it.name, (isDep || isFin) && it.nameBold]} numberOfLines={2}>{wpt.name}</Text>
          <Text style={[it.heure, isDep && it.heureDepart, isFin && it.heureFin]}>{wpt.heure}</Text>
        </View>
        {wpt.badges.length > 0 && (
          <View style={it.badges}>
            {wpt.badges.map((b) => (
              <View key={b} style={[it.badge, { backgroundColor: IT_BADGE[b].bg }]}>
                <Text style={[it.badgeTxt, { color: IT_BADGE[b].color }]}>{IT_BADGE[b].label}</Text>
              </View>
            ))}
          </View>
        )}
        {!isDep && (
          <View style={it.stats}>
            {wpt.distCum !== '0 km' && <Text style={it.statTxt}><Text style={it.statLbl}>dist </Text>{wpt.distCum}</Text>}
            {wpt.alt && <Text style={it.statTxt}><Text style={it.statLbl}>alt </Text>{wpt.alt}</Text>}
            {wpt.dp !== '—' && <Text style={[it.statTxt, it.dp]}>▲{wpt.dp}</Text>}
            {wpt.dm !== '—' && <Text style={[it.statTxt, it.dm]}>▼{wpt.dm}</Text>}
            {wpt.segTime !== '—' && <Text style={it.statTxt}><Text style={it.statLbl}>seg </Text>{wpt.segTime}</Text>}
            {wpt.cumTime !== '—' && <Text style={it.statTxt}><Text style={it.statLbl}>cum </Text>{wpt.cumTime}</Text>}
          </View>
        )}
        {isDep && wpt.alt && <Text style={it.depAlt}>Alt. {wpt.alt}</Text>}
      </View>
    </View>
  );
}

function ItDaySection({ day }: { day: ItDay }) {
  return (
    <View style={it.daySection}>
      <View style={it.dayHeader}>
        <Text style={it.dayLabel}>{day.label}</Text>
      </View>
      {day.waypoints.map((wpt, i) => (
        <ItWayptRow
          key={i}
          wpt={wpt}
          isFirst={i === 0}
          isLast={i === day.waypoints.length - 1}
        />
      ))}
    </View>
  );
}

function HtmlItineraireView({ itin }: { itin: Itineraire }) {
  return (
    <ScrollView contentContainerStyle={it.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={it.header}>
        <Text style={it.headerTitle}>{itin.title}</Text>
        {itin.subtitle ? <Text style={it.headerSub}>{itin.subtitle}</Text> : null}
      </View>

      {/* Warnings */}
      {itin.warnings.length > 0 && (
        <View style={it.warnBox}>
          {itin.warnings.map((w, i) => (
            <Text key={i} style={it.warnLine}>{w}</Text>
          ))}
        </View>
      )}

      {/* Days */}
      {itin.days.map((day, i) => (
        <ItDaySection key={i} day={day} />
      ))}

      {/* Notes */}
      {itin.notes ? (
        <View style={it.notesBox}>
          <Text style={it.notesText}>{itin.notes}</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

// ─── Import hook ──────────────────────────────────────────────────────────────

function useHtmlImporter(onContent: (content: string) => void) {
  const inputRef = useRef<any>(null);
  const onContentRef = useRef(onContent);
  onContentRef.current = onContent;

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.html,text/html';
    input.style.display = 'none';
    const handler = (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const content = ev.target?.result as string;
        if (content) onContentRef.current(content);
      };
      reader.readAsText(file);
      (e.target as HTMLInputElement).value = '';
    };
    input.addEventListener('change', handler);
    document.body.appendChild(input);
    inputRef.current = input;
    return () => {
      input.removeEventListener('change', handler);
      if (document.body.contains(input)) document.body.removeChild(input);
    };
  }, []); // runs once only — latest callback accessed via ref

  const trigger = () => {
    if (Platform.OS === 'web') {
      inputRef.current?.click();
      return;
    }
    // Native: HTML import available on web only
    Alert.alert(
      'Import HTML',
      "L'import de fichiers HTML est disponible uniquement depuis l'application web."
    );
  };

  return trigger;
}

// ─── Main screen ──────────────────────────────────────────────────────────────

type TabId = 'gr10' | 'bidarray-sare' | 'gpx' | 'html';

export default function EtapesScreen() {
  const [selected, setSelected] = useState<Etape | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('gr10');
  const { gpxTrack, itineraire, setItineraire } = useGpx();

  const hasGpxTab = !!gpxTrack;
  const hasHtmlTab = !!itineraire;

  // Auto-switch to new content when imported
  useEffect(() => {
    if (itineraire) { setActiveTab('html'); return; }
    if (gpxTrack) { setActiveTab('gpx'); return; }
    setActiveTab('gr10');
  }, [gpxTrack, itineraire]);

  const handleHtmlContent = (content: string) => {
    const parsed = parseItineraire(content);
    if (parsed) {
      setItineraire(parsed);
    } else {
      Alert.alert('Erreur', 'Fichier HTML non reconnu.\nUtilisez un fichier généré au format itinéraire.');
    }
  };

  const triggerHtmlImport = useHtmlImporter(handleHtmlContent);

  // Short title for tab (first segment before ' —' or ' ·')
  const htmlTabTitle = itineraire
    ? itineraire.title.split(/\s[—·]/)[0].trim().slice(0, 22)
    : '';

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={s.headerTitle}>GR10 · Pyrénées</Text>
            <Text style={s.headerSub}>
              Hendaye → Banyuls-sur-Mer · ~{Math.round(TOTAL_KM)} km · D+ {TOTAL_DENIVELE.toLocaleString('fr')} m
            </Text>
          </View>
          <TouchableOpacity style={s.importBtn} onPress={triggerHtmlImport}>
            <Text style={s.importBtnTxt}>📋</Text>
            <Text style={s.importBtnLabel}>Importer</Text>
          </TouchableOpacity>
        </View>
        <View style={s.headerNote}>
          <Text style={s.headerNoteText}>⚠️ 10 étapes affichées (Hendaye → Lescun)</Text>
        </View>
      </View>

      {/* Tab switcher */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabRowOuter} contentContainerStyle={s.tabRow}>
          <TouchableOpacity
            style={[s.tab, activeTab === 'gr10' && s.tabActive]}
            onPress={() => setActiveTab('gr10')}
          >
            <Text style={[s.tabTxt, activeTab === 'gr10' && s.tabTxtActive]}>GR10</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.tab, activeTab === 'bidarray-sare' && s.tabActiveTrek]}
            onPress={() => setActiveTab('bidarray-sare')}
          >
            <Text style={[s.tabTxt, activeTab === 'bidarray-sare' && s.tabTxtTrek]} numberOfLines={1}>
              🥾 Bidarray–Sare
            </Text>
          </TouchableOpacity>

          {hasGpxTab && (
            <TouchableOpacity
              style={[s.tab, activeTab === 'gpx' && s.tabActiveGpx]}
              onPress={() => setActiveTab('gpx')}
            >
              <Text style={[s.tabTxt, activeTab === 'gpx' && s.tabTxtGpx]} numberOfLines={1}>
                🟣 {gpxTrack!.name.slice(0, 18)}
              </Text>
            </TouchableOpacity>
          )}

          {hasHtmlTab && (
            <TouchableOpacity
              style={[s.tab, activeTab === 'html' && s.tabActiveHtml]}
              onPress={() => setActiveTab('html')}
            >
              <Text style={[s.tabTxt, activeTab === 'html' && s.tabTxtHtml]} numberOfLines={1}>
                📋 {htmlTabTitle}
              </Text>
            </TouchableOpacity>
          )}

          {/* Clear button for active imported tab */}
          {(activeTab === 'gpx' || activeTab === 'html') && (
            <TouchableOpacity
              style={s.tabClear}
              onPress={() => {
                if (activeTab === 'html') setItineraire(null);
                // GPX cleared from MapScreen
              }}
            >
              {activeTab === 'html' && <Text style={s.tabClearTxt}>✕</Text>}
            </TouchableOpacity>
          )}
        </ScrollView>

      {/* Content */}
      {activeTab === 'html' && itineraire ? (
        <HtmlItineraireView itin={itineraire} />
      ) : activeTab === 'gpx' && gpxTrack ? (
        <GpxItinerary track={gpxTrack} />
      ) : activeTab === 'bidarray-sare' ? (
        <FlatList
          data={ETAPES_BIDARRAY_SARE}
          keyExtractor={(item) => String(item.id)}
          ListHeaderComponent={
            <View style={s.trekHeader}>
              <Text style={s.trekHeaderTitle}>Bidarray → Sare · 2 jours</Text>
              <Text style={s.trekHeaderSub}>
                {TOTAL_KM_BS} km · D+ {TOTAL_DENIVELE_BS.toLocaleString('fr')} m · via Crêtes d'Iparla & Ainhoa
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <EtapeCard etape={item} onPress={() => setSelected(item)} />
          )}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <FlatList
          data={ETAPES}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <EtapeCard etape={item} onPress={() => setSelected(item)} />
          )}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      {selected && <EtapeDetail etape={selected} onClose={() => setSelected(null)} />}
    </SafeAreaView>
  );
}

// ─── Styles GR10 ──────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1FAEE' },
  header: { backgroundColor: '#264653', padding: 16, paddingBottom: 14 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '700' },
  headerSub: { color: '#A8DADC', fontSize: 13, marginTop: 4 },
  importBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
    gap: 2,
  },
  importBtnTxt: { fontSize: 18 },
  importBtnLabel: { fontSize: 10, color: '#A8DADC', fontWeight: '600' },
  headerNote: { marginTop: 10, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 6, padding: 6 },
  headerNoteText: { color: '#E9C46A', fontSize: 12 },
  tabRowOuter: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 0,
    gap: 4,
    alignItems: 'flex-end',
  },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
    borderRadius: 4,
    maxWidth: 160,
  },
  tabActive:     { borderBottomColor: '#264653', backgroundColor: '#F1FAEE' },
  tabActiveTrek: { borderBottomColor: '#2A9D8F', backgroundColor: '#F0FAF8' },
  tabTxtTrek:   { color: '#2A9D8F' },
  trekHeader: { backgroundColor: '#2A9D8F', margin: 12, borderRadius: 10, padding: 14, gap: 4 },
  trekHeaderTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  trekHeaderSub: { color: 'rgba(255,255,255,0.8)', fontSize: 13 },
  tabActiveGpx:  { borderBottomColor: '#8338EC', backgroundColor: '#F5F0FF' },
  tabActiveHtml: { borderBottomColor: '#D97706', backgroundColor: '#FFFBEB' },
  tabTxt:      { fontSize: 12, fontWeight: '600', color: '#999' },
  tabTxtActive: { color: '#264653' },
  tabTxtGpx:   { color: '#8338EC' },
  tabTxtHtml:  { color: '#D97706' },
  tabClear: { marginLeft: 'auto' as any, paddingHorizontal: 8, paddingVertical: 8, alignSelf: 'center' },
  tabClearTxt: { fontSize: 14, color: '#bbb' },
  list: { padding: 12, gap: 10 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  numBadge: { minWidth: 34, height: 34, borderRadius: 17, backgroundColor: '#264653', alignItems: 'center', justifyContent: 'center', marginRight: 10, paddingHorizontal: 6 },
  numText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  cardInfo: { flex: 1 },
  cardNom: { fontSize: 14, fontWeight: '600', color: '#264653' },
  cardSub: { fontSize: 12, color: '#888', marginTop: 2 },
  diffBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  diffText: { fontSize: 11, color: '#fff', fontWeight: '600' },
  elevBar: { gap: 4 },
  elevRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  elevLabel: { fontSize: 11, color: '#888', width: 60 },
  elevFill: { height: 6, borderRadius: 3 },
  elevPos: { backgroundColor: '#2A9D8F' },
  elevNeg: { backgroundColor: '#E63946' },
  modal: { flex: 1, backgroundColor: '#F1FAEE' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#264653' },
  modalTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  closeBtn: { padding: 4 },
  closeBtnText: { color: '#A8DADC', fontSize: 18 },
  modalContent: { padding: 20, gap: 16 },
  modalNom: { fontSize: 22, fontWeight: '700', color: '#264653' },
  diffBadgeLarge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 14 },
  diffTextLarge: { fontSize: 13, color: '#fff', fontWeight: '700' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statBox: { flex: 1, minWidth: 120, backgroundColor: '#fff', borderRadius: 10, padding: 12, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  statIcon: { fontSize: 20, marginBottom: 4 },
  statValue: { fontSize: 16, fontWeight: '700', color: '#264653' },
  statLabel: { fontSize: 11, color: '#888', marginTop: 2 },
  itineraireBox: { backgroundColor: '#fff', borderRadius: 10, padding: 14, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  itineraireRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  itineraireLineFill: { width: 2, height: 20, backgroundColor: '#ddd', marginLeft: 4, marginVertical: 2 },
  itineraireText: { fontSize: 15, fontWeight: '600', color: '#264653' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#264653' },
  description: { fontSize: 14, color: '#555', lineHeight: 22 },
  infoSection: { backgroundColor: '#fff', borderRadius: 10, padding: 14, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1, gap: 8 },
  infoSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoSectionIcon: { fontSize: 16 },
  infoSectionTitle: { fontSize: 14, fontWeight: '700', color: '#264653' },
  infoSectionContent: { fontSize: 13, color: '#555', lineHeight: 20 },
  retourBox: { backgroundColor: '#EAF4FB', borderLeftWidth: 4, borderLeftColor: '#264653', borderRadius: 10, padding: 14, gap: 8, marginBottom: 8 },
  retourHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  retourIcon: { fontSize: 16 },
  retourTitle: { fontSize: 14, fontWeight: '700', color: '#264653' },
  retourContent: { fontSize: 13, color: '#2c5f70', lineHeight: 20 },
});

// ─── Styles GPX ───────────────────────────────────────────────────────────────

const gpx = StyleSheet.create({
  container: { padding: 12, paddingBottom: 32 },
  header: { backgroundColor: '#F5F0FF', borderRadius: 12, padding: 14, marginBottom: 16, borderLeftWidth: 4, borderLeftColor: '#8338EC', gap: 10 },
  headerTitle: { fontSize: 15, fontWeight: '700', color: '#3d1c7a' },
  headerStats: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, alignItems: 'center', minWidth: 70, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  chipVal: { fontSize: 14, fontWeight: '700', color: '#264653' },
  chipLbl: { fontSize: 10, color: '#888', marginTop: 1 },
  naismith: { fontSize: 11, color: '#7c5cbf', fontStyle: 'italic', lineHeight: 16 },
  list: {},
  row: { flexDirection: 'row', paddingVertical: 4, paddingHorizontal: 4 },
  rowLast: {},
  timelineCol: { width: 24, alignItems: 'center', paddingTop: 4 },
  dot: { width: 12, height: 12, borderRadius: 6, zIndex: 1 },
  dotStart: { backgroundColor: '#2A9D8F', borderWidth: 2, borderColor: '#fff' },
  dotMid:   { backgroundColor: '#8338EC', borderWidth: 2, borderColor: '#fff' },
  dotEnd:   { backgroundColor: '#E63946', borderWidth: 2, borderColor: '#fff' },
  line: { width: 2, flex: 1, backgroundColor: '#ddd', marginTop: 2, minHeight: 40 },
  rowContent: { flex: 1, paddingLeft: 10, paddingBottom: 16, gap: 4 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  name: { flex: 1, fontSize: 13, color: '#264653', lineHeight: 18 },
  nameBold: { fontWeight: '700', fontSize: 14 },
  time: { fontSize: 13, fontWeight: '700', color: '#8338EC', minWidth: 52, textAlign: 'right' },
  timeDepart: { color: '#2A9D8F' },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  badgeTxt: { fontSize: 10, fontWeight: '600' },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 },
  statTxt: { fontSize: 11, color: '#555', backgroundColor: '#F5F5F5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  statLbl: { color: '#999', fontSize: 10 },
  dp: { color: '#0F6E56', backgroundColor: '#F0FDF4' },
  dm: { color: '#993C1D', backgroundColor: '#FFF7F0' },
  emptyBox: { alignItems: 'center', padding: 40, gap: 10 },
  emptyIcon: { fontSize: 40 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#264653', textAlign: 'center' },
  emptySub: { fontSize: 13, color: '#888', textAlign: 'center', lineHeight: 20 },
  emptyPts: { marginTop: 8, fontSize: 12, color: '#8338EC', backgroundColor: '#F5F0FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, fontWeight: '600' },
});

// ─── Styles HTML itinéraire ───────────────────────────────────────────────────

const it = StyleSheet.create({
  container: { padding: 12, paddingBottom: 32, gap: 12 },
  header: { backgroundColor: '#FFFBEB', borderRadius: 12, padding: 14, borderLeftWidth: 4, borderLeftColor: '#D97706', gap: 4 },
  headerTitle: { fontSize: 15, fontWeight: '700', color: '#78350F' },
  headerSub: { fontSize: 12, color: '#92400E', lineHeight: 18 },
  warnBox: { backgroundColor: '#FFFBEB', borderWidth: 1, borderColor: '#FDE68A', borderRadius: 10, padding: 12, gap: 6 },
  warnLine: { fontSize: 12, color: '#92400E', lineHeight: 18 },
  daySection: { backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  dayHeader: { backgroundColor: '#F5F5F3', paddingHorizontal: 14, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#eee' },
  dayLabel: { fontSize: 12, fontWeight: '700', color: '#555', textTransform: 'uppercase', letterSpacing: 0.5 },
  row: { flexDirection: 'row', paddingHorizontal: 10, paddingVertical: 6 },
  rowLast: {},
  timelineCol: { width: 22, alignItems: 'center', paddingTop: 4 },
  dot: { width: 11, height: 11, borderRadius: 6, zIndex: 1 },
  dotStart: { backgroundColor: '#2A9D8F', borderWidth: 2, borderColor: '#fff' },
  dotMid:   { backgroundColor: '#D97706', borderWidth: 2, borderColor: '#fff' },
  dotEnd:   { backgroundColor: '#E63946', borderWidth: 2, borderColor: '#fff' },
  line: { width: 2, flex: 1, backgroundColor: '#E5E7EB', marginTop: 2, minHeight: 36 },
  rowContent: { flex: 1, paddingLeft: 8, paddingBottom: 12, gap: 4 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 },
  name: { flex: 1, fontSize: 13, color: '#264653', lineHeight: 18 },
  nameBold: { fontWeight: '700', fontSize: 14 },
  heure: { fontSize: 13, fontWeight: '700', color: '#D97706', minWidth: 48, textAlign: 'right' },
  heureDepart: { color: '#2A9D8F' },
  heureFin:   { color: '#E63946' },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  badgeTxt: { fontSize: 10, fontWeight: '600' },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 2 },
  statTxt: { fontSize: 11, color: '#555', backgroundColor: '#F5F5F5', paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4 },
  statLbl: { color: '#999', fontSize: 10 },
  dp: { color: '#0F6E56', backgroundColor: '#F0FDF4' },
  dm: { color: '#993C1D', backgroundColor: '#FFF7F0' },
  depAlt: { fontSize: 11, color: '#888' },
  notesBox: { backgroundColor: '#F9FAFB', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#eee' },
  notesText: { fontSize: 11, color: '#888', lineHeight: 18, fontStyle: 'italic' },
});
