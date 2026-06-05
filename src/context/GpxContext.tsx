import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GpxTrack } from '../utils/gpxParser';
import { Itineraire } from '../utils/itineraireParser';

const KEY_GPX      = 'gpx_track_v2';
const KEY_IT       = 'itineraire_v1';
const KEY_CODE     = 'sync_code_v1';
const KEY_NOTES    = 'trek_notes_v1';
const KEY_ACTIVE   = 'active_trek_v1';
const KEY_DATES    = 'trek_dates_v1';
const KEY_STAGES   = 'stages_done_v1';
const KEY_JOURNAL  = 'journal_v1';
const KEY_CHECKED  = 'rando_checked_v1';
const KEY_CUSTOM   = 'rando_custom_items_v1';

// ─── Supabase sync ────────────────────────────────────────────────────────────
// create table rando_sync (
//   code text primary key,
//   gpx_track jsonb, itineraire jsonb, trek_notes jsonb,
//   active_trek text, trek_dates jsonb,
//   updated_at timestamptz default now()
// );
// alter table rando_sync enable row level security;
// create policy "anon_all" on rando_sync for all using (true) with check (true);
// -- Migrations:
// alter table rando_sync add column if not exists trek_notes jsonb;
// alter table rando_sync add column if not exists active_trek text;
// alter table rando_sync add column if not exists trek_dates jsonb;
// alter table rando_sync add column if not exists checklist_checked jsonb;
// alter table rando_sync add column if not exists checklist_custom jsonb;

const SB_URL = 'https://zodywxrnyaiviuahxuvw.supabase.co';
const SB_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvZHl3eHJueWFpdml1YWh4dXZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5MDUzMzMsImV4cCI6MjA5NTQ4MTMzM30.ZiqmEIg1Xfq70qTwiIw3N58LAoP540J3Bo8inCqUCuk';
const TABLE = `${SB_URL}/rest/v1/rando_sync`;
const SB_H = {
  apikey: SB_KEY,
  Authorization: `Bearer ${SB_KEY}`,
  'Content-Type': 'application/json',
};

type Notes   = Record<string, string>;
type Dates   = Record<string, string>;
type Checked = Record<string, boolean>;
export type CustomItem = { id: string; name: string; who: import('../data/checklist').WhoType; vital: boolean; weight?: number; note?: string; sectionKey: string };
export type SyncStatus = 'idle' | 'syncing' | 'ok' | 'error';

export interface JournalEntry {
  id: string;       // `${trekId}-${date}`
  trekId: string;
  date: string;     // YYYY-MM-DD
  text: string;
  meteo: string;
  humeur: string;
}

const DEFAULT_CODE = 'KEVD0R';

interface SbPayload {
  gpx_track: GpxTrack | null;
  itineraire: Itineraire | null;
  trek_notes: Notes;
  active_trek: string | null;
  trek_dates: Dates;
  checklist_checked: Checked;
  checklist_custom: CustomItem[];
}

async function sbPush(code: string, payload: SbPayload): Promise<boolean> {
  const opts = (body: object) => ({
    method: 'POST' as const,
    headers: { ...SB_H, Prefer: 'resolution=merge-duplicates' },
    body: JSON.stringify(body),
  });
  const url = `${TABLE}?on_conflict=code`;
  const ts  = new Date().toISOString();
  try {
    // Try full payload first; fall back progressively if columns not migrated
    let res = await fetch(url, opts({ code, ...payload, updated_at: ts }));
    if (!res.ok && res.status === 400) {
      const { checklist_checked, checklist_custom, ...rest } = payload;
      res = await fetch(url, opts({ code, ...rest, updated_at: ts }));
    }
    if (!res.ok && res.status === 400) {
      res = await fetch(url, opts({ code, gpx_track: payload.gpx_track, itineraire: payload.itineraire, trek_notes: payload.trek_notes, updated_at: ts }));
    }
    if (!res.ok && res.status === 400) {
      res = await fetch(url, opts({ code, gpx_track: payload.gpx_track, itineraire: payload.itineraire, updated_at: ts }));
    }
    return res.ok;
  } catch {
    return false;
  }
}

async function sbPull(code: string): Promise<(Partial<SbPayload> & { active_trek?: string | null; trek_notes?: Notes | null; trek_dates?: Dates | null }) | null> {
  try {
    const res = await fetch(
      `${TABLE}?code=eq.${code}&select=gpx_track,itineraire,trek_notes,active_trek,trek_dates,checklist_checked,checklist_custom`,
      { headers: SB_H }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) return data[0];
  } catch {}
  return null;
}

// ─── Bbox ─────────────────────────────────────────────────────────────────────

export interface TraceBbox { minLat: number; maxLat: number; minLng: number; maxLng: number; }

export function isNearTrace(lat: number, lng: number, bbox: TraceBbox): boolean {
  const BUF = 0.09;
  return lat >= bbox.minLat - BUF && lat <= bbox.maxLat + BUF && lng >= bbox.minLng - BUF && lng <= bbox.maxLng + BUF;
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface GpxContextValue {
  gpxTrack: GpxTrack | null;
  setGpxTrack: (track: GpxTrack | null) => void;
  itineraire: Itineraire | null;
  setItineraire: (it: Itineraire | null) => void;
  traceBbox: TraceBbox | null;
  syncCode: string;
  joinSyncCode: (code: string) => Promise<void>;
  trekNotes: Notes;
  setTrekNote: (trekId: string, text: string) => void;
  activeTrekId: string | null;
  setActiveTrekId: (id: string | null) => void;
  trekDates: Dates;
  setTrekDate: (trekId: string, date: string) => void;
  stagesDone: Record<string, boolean>;
  setStagesDone: (key: string, done: boolean) => void;
  journalEntries: Record<string, JournalEntry>;
  setJournalEntry: (entry: JournalEntry) => void;
  deleteJournalEntry: (id: string) => void;
  // Checklist (synced)
  checklistChecked: Checked;
  toggleChecked: (id: string) => void;
  resetChecked: () => void;
  customItems: CustomItem[];
  addCustomItem: (item: CustomItem) => void;
  deleteCustomItem: (id: string) => void;
  syncStatus: SyncStatus;
  isInitializing: boolean;
}

const GpxContext = createContext<GpxContextValue>({
  gpxTrack: null, setGpxTrack: () => {},
  itineraire: null, setItineraire: () => {},
  traceBbox: null,
  syncCode: '', joinSyncCode: async () => {},
  trekNotes: {}, setTrekNote: () => {},
  activeTrekId: null, setActiveTrekId: () => {},
  trekDates: {}, setTrekDate: () => {},
  stagesDone: {}, setStagesDone: () => {},
  journalEntries: {}, setJournalEntry: () => {}, deleteJournalEntry: () => {},
  checklistChecked: {}, toggleChecked: () => {}, resetChecked: () => {},
  customItems: [], addCustomItem: () => {}, deleteCustomItem: () => {},
  syncStatus: 'idle',
  isInitializing: true,
});

export function GpxProvider({ children }: { children: React.ReactNode }) {
  const [gpxTrack, setGpxTrackState]               = useState<GpxTrack | null>(null);
  const [itineraire, setItineraireState]           = useState<Itineraire | null>(null);
  const [trekNotes, setTrekNotesState]             = useState<Notes>({});
  const [activeTrekId, setActiveTrekIdState]       = useState<string | null>(null);
  const [trekDates, setTrekDatesState]             = useState<Dates>({});
  const [stagesDone, setStagesDoneState]           = useState<Record<string, boolean>>({});
  const [journalEntries, setJournalEntriesState]   = useState<Record<string, JournalEntry>>({});
  const [checklistChecked, setChecklistChecked]    = useState<Checked>({});
  const [customItems, setCustomItemsState]         = useState<CustomItem[]>([]);
  const [syncCode, setSyncCode]                    = useState('');
  const [syncStatus, setSyncStatus]                = useState<SyncStatus>('idle');
  const [isInitializing, setIsInitializing]        = useState(true);

  const syncCodeRef = useRef('');
  const stateRef = useRef({
    gpx: null as GpxTrack | null,
    it: null as Itineraire | null,
    notes: {} as Notes,
    active: null as string | null,
    dates: {} as Dates,
    checked: {} as Checked,
    custom: [] as CustomItem[],
  });

  const push = useCallback(async (partial?: Partial<SbPayload>) => {
    if (!syncCodeRef.current) return;
    setSyncStatus('syncing');
    const payload: SbPayload = {
      gpx_track:          stateRef.current.gpx,
      itineraire:         stateRef.current.it,
      trek_notes:         stateRef.current.notes,
      active_trek:        stateRef.current.active,
      trek_dates:         stateRef.current.dates,
      checklist_checked:  stateRef.current.checked,
      checklist_custom:   stateRef.current.custom,
      ...partial,
    };
    const ok = await sbPush(syncCodeRef.current, payload);
    setSyncStatus(ok ? 'ok' : 'error');
  }, []);

  useEffect(() => {
    (AsyncStorage as any).getMany([KEY_GPX, KEY_IT, KEY_CODE, KEY_NOTES, KEY_ACTIVE, KEY_DATES, KEY_STAGES, KEY_JOURNAL, KEY_CHECKED, KEY_CUSTOM]).then(
      async (values: Record<string, string | null>) => {
        let localGpx: GpxTrack | null = null;
        let localIt: Itineraire | null = null;
        let localNotes: Notes = {};
        let localActive: string | null = null;
        let localDates: Dates = {};
        let localChecked: Checked = {};
        let localCustom: CustomItem[] = [];
        try { if (values[KEY_GPX])     localGpx     = JSON.parse(values[KEY_GPX]!);     } catch {}
        try { if (values[KEY_IT])      localIt      = JSON.parse(values[KEY_IT]!);      } catch {}
        try { if (values[KEY_NOTES])   localNotes   = JSON.parse(values[KEY_NOTES]!);   } catch {}
        try { if (values[KEY_ACTIVE])  localActive  = values[KEY_ACTIVE]!;              } catch {}
        try { if (values[KEY_DATES])   localDates   = JSON.parse(values[KEY_DATES]!);   } catch {}
        try { if (values[KEY_STAGES])  setStagesDoneState(JSON.parse(values[KEY_STAGES]!));  } catch {}
        try { if (values[KEY_JOURNAL]) setJournalEntriesState(JSON.parse(values[KEY_JOURNAL]!)); } catch {}
        try { if (values[KEY_CHECKED]) localChecked = JSON.parse(values[KEY_CHECKED]!); } catch {}
        try { if (values[KEY_CUSTOM])  localCustom  = JSON.parse(values[KEY_CUSTOM]!);  } catch {}

        if (localGpx)    { stateRef.current.gpx     = localGpx;    setGpxTrackState(localGpx); }
        if (localIt)     { stateRef.current.it      = localIt;     setItineraireState(localIt); }
        if (localActive) { stateRef.current.active  = localActive; setActiveTrekIdState(localActive); }
        if (Object.keys(localDates).length > 0)   { stateRef.current.dates   = localDates;   setTrekDatesState(localDates); }
        if (Object.keys(localNotes).length > 0)   { stateRef.current.notes   = localNotes;   setTrekNotesState(localNotes); }
        if (Object.keys(localChecked).length > 0) { stateRef.current.checked = localChecked; setChecklistChecked(localChecked); }
        if (localCustom.length > 0)               { stateRef.current.custom  = localCustom;  setCustomItemsState(localCustom); }

        const code = values[KEY_CODE] || DEFAULT_CODE;
        if (!values[KEY_CODE]) await AsyncStorage.setItem(KEY_CODE, code);
        syncCodeRef.current = code;
        setSyncCode(code);

        const remote = await sbPull(code);
        if (remote) {
          if (remote.gpx_track)  { stateRef.current.gpx    = remote.gpx_track;  setGpxTrackState(remote.gpx_track);   AsyncStorage.setItem(KEY_GPX, JSON.stringify(remote.gpx_track)); }
          if (remote.itineraire) { stateRef.current.it     = remote.itineraire; setItineraireState(remote.itineraire); AsyncStorage.setItem(KEY_IT, JSON.stringify(remote.itineraire)); }
          if (remote.active_trek) { stateRef.current.active = remote.active_trek; setActiveTrekIdState(remote.active_trek); AsyncStorage.setItem(KEY_ACTIVE, remote.active_trek); }
          const rNotes = remote.trek_notes ?? {};
          if (Object.keys(rNotes).length > 0) { stateRef.current.notes = rNotes; setTrekNotesState(rNotes); AsyncStorage.setItem(KEY_NOTES, JSON.stringify(rNotes)); }
          const rDates = remote.trek_dates ?? {};
          if (Object.keys(rDates).length > 0) { stateRef.current.dates = rDates; setTrekDatesState(rDates); AsyncStorage.setItem(KEY_DATES, JSON.stringify(rDates)); }
          const rChecked = (remote.checklist_checked ?? {}) as Checked;
          if (Object.keys(rChecked).length > 0) { stateRef.current.checked = rChecked; setChecklistChecked(rChecked); AsyncStorage.setItem(KEY_CHECKED, JSON.stringify(rChecked)); }
          const rCustom = (remote.checklist_custom ?? []) as CustomItem[];
          if (rCustom.length > 0) { stateRef.current.custom = rCustom; setCustomItemsState(rCustom); AsyncStorage.setItem(KEY_CUSTOM, JSON.stringify(rCustom)); }

          const needsPush =
            (localGpx && !remote.gpx_track) ||
            (localIt && !remote.itineraire) ||
            (localActive && !remote.active_trek) ||
            (Object.keys(localNotes).length > 0 && Object.keys(rNotes).length === 0) ||
            (Object.keys(localDates).length > 0 && Object.keys(rDates).length === 0) ||
            (Object.keys(localChecked).length > 0 && Object.keys(rChecked).length === 0) ||
            (localCustom.length > 0 && rCustom.length === 0);
          if (needsPush) push();
        } else if (localGpx || localIt || localActive || Object.keys(localNotes).length > 0 || Object.keys(localDates).length > 0 || Object.keys(localChecked).length > 0 || localCustom.length > 0) {
          push();
        }
        setIsInitializing(false);
      }
    );
  }, []);

  const setGpxTrack = useCallback((track: GpxTrack | null) => {
    stateRef.current.gpx = track;
    setGpxTrackState(track);
    track ? AsyncStorage.setItem(KEY_GPX, JSON.stringify(track)) : AsyncStorage.removeItem(KEY_GPX);
    push();
  }, [push]);

  const setItineraire = useCallback((it: Itineraire | null) => {
    stateRef.current.it = it;
    setItineraireState(it);
    it ? AsyncStorage.setItem(KEY_IT, JSON.stringify(it)) : AsyncStorage.removeItem(KEY_IT);
    push();
  }, [push]);

  const setTrekNote = useCallback((trekId: string, text: string) => {
    const next: Notes = { ...stateRef.current.notes };
    text.trim() ? (next[trekId] = text) : delete next[trekId];
    stateRef.current.notes = next;
    setTrekNotesState(next);
    Object.keys(next).length > 0 ? AsyncStorage.setItem(KEY_NOTES, JSON.stringify(next)) : AsyncStorage.removeItem(KEY_NOTES);
    push();
  }, [push]);

  const setActiveTrekId = useCallback((id: string | null) => {
    stateRef.current.active = id;
    setActiveTrekIdState(id);
    id ? AsyncStorage.setItem(KEY_ACTIVE, id) : AsyncStorage.removeItem(KEY_ACTIVE);
    push();
  }, [push]);

  const setTrekDate = useCallback((trekId: string, date: string) => {
    const next: Dates = { ...stateRef.current.dates };
    date ? (next[trekId] = date) : delete next[trekId];
    stateRef.current.dates = next;
    setTrekDatesState(next);
    Object.keys(next).length > 0 ? AsyncStorage.setItem(KEY_DATES, JSON.stringify(next)) : AsyncStorage.removeItem(KEY_DATES);
    push();
  }, [push]);

  const setStagesDone = useCallback((key: string, done: boolean) => {
    setStagesDoneState(prev => {
      const next = { ...prev };
      done ? (next[key] = true) : delete next[key];
      Object.keys(next).length > 0 ? AsyncStorage.setItem(KEY_STAGES, JSON.stringify(next)) : AsyncStorage.removeItem(KEY_STAGES);
      return next;
    });
  }, []);

  const setJournalEntry = useCallback((entry: JournalEntry) => {
    setJournalEntriesState(prev => {
      const next = { ...prev, [entry.id]: entry };
      AsyncStorage.setItem(KEY_JOURNAL, JSON.stringify(next));
      return next;
    });
  }, []);

  const deleteJournalEntry = useCallback((id: string) => {
    setJournalEntriesState(prev => {
      const next = { ...prev };
      delete next[id];
      Object.keys(next).length > 0 ? AsyncStorage.setItem(KEY_JOURNAL, JSON.stringify(next)) : AsyncStorage.removeItem(KEY_JOURNAL);
      return next;
    });
  }, []);

  // ── Checklist (synced) ──────────────────────────────────────────────────────

  const toggleChecked = useCallback((id: string) => {
    setChecklistChecked(prev => {
      const next = { ...prev, [id]: !prev[id] };
      stateRef.current.checked = next;
      AsyncStorage.setItem(KEY_CHECKED, JSON.stringify(next));
      push({ checklist_checked: next });
      return next;
    });
  }, [push]);

  const resetChecked = useCallback(() => {
    stateRef.current.checked = {};
    setChecklistChecked({});
    AsyncStorage.removeItem(KEY_CHECKED);
    push({ checklist_checked: {} });
  }, [push]);

  const addCustomItem = useCallback((item: CustomItem) => {
    setCustomItemsState(prev => {
      const next = [...prev, item];
      stateRef.current.custom = next;
      AsyncStorage.setItem(KEY_CUSTOM, JSON.stringify(next));
      push({ checklist_custom: next });
      return next;
    });
  }, [push]);

  const deleteCustomItem = useCallback((id: string) => {
    setCustomItemsState(prev => {
      const next = prev.filter(i => i.id !== id);
      stateRef.current.custom = next;
      AsyncStorage.setItem(KEY_CUSTOM, JSON.stringify(next));
      push({ checklist_custom: next });
      // Also remove from checked
      const newChecked = { ...stateRef.current.checked };
      delete newChecked[id];
      stateRef.current.checked = newChecked;
      setChecklistChecked(newChecked);
      AsyncStorage.setItem(KEY_CHECKED, JSON.stringify(newChecked));
      return next;
    });
  }, [push]);

  const joinSyncCode = useCallback(async (code: string) => {
    const normalized = code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    syncCodeRef.current = normalized;
    setSyncCode(normalized);
    await AsyncStorage.setItem(KEY_CODE, normalized);
    const remote = await sbPull(normalized);
    if (remote) {
      if (remote.gpx_track)   { stateRef.current.gpx    = remote.gpx_track;  setGpxTrackState(remote.gpx_track);   await AsyncStorage.setItem(KEY_GPX, JSON.stringify(remote.gpx_track)); }
      if (remote.itineraire)  { stateRef.current.it     = remote.itineraire; setItineraireState(remote.itineraire); await AsyncStorage.setItem(KEY_IT, JSON.stringify(remote.itineraire)); }
      if (remote.active_trek) { stateRef.current.active = remote.active_trek; setActiveTrekIdState(remote.active_trek); await AsyncStorage.setItem(KEY_ACTIVE, remote.active_trek); }
      const rNotes = remote.trek_notes ?? {};
      if (Object.keys(rNotes).length > 0) { stateRef.current.notes = rNotes; setTrekNotesState(rNotes); await AsyncStorage.setItem(KEY_NOTES, JSON.stringify(rNotes)); }
      const rDates = remote.trek_dates ?? {};
      if (Object.keys(rDates).length > 0) { stateRef.current.dates = rDates; setTrekDatesState(rDates); await AsyncStorage.setItem(KEY_DATES, JSON.stringify(rDates)); }
      const rChecked = (remote.checklist_checked ?? {}) as Checked;
      if (Object.keys(rChecked).length > 0) { stateRef.current.checked = rChecked; setChecklistChecked(rChecked); await AsyncStorage.setItem(KEY_CHECKED, JSON.stringify(rChecked)); }
      const rCustom = (remote.checklist_custom ?? []) as CustomItem[];
      if (rCustom.length > 0) { stateRef.current.custom = rCustom; setCustomItemsState(rCustom); await AsyncStorage.setItem(KEY_CUSTOM, JSON.stringify(rCustom)); }
      setSyncStatus('ok');
    }
  }, []);

  const traceBbox = useMemo<TraceBbox | null>(() => {
    const pts = gpxTrack?.points;
    if (!pts || pts.length === 0) return null;
    let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
    for (const [lat, lng] of pts) {
      if (lat < minLat) minLat = lat; if (lat > maxLat) maxLat = lat;
      if (lng < minLng) minLng = lng; if (lng > maxLng) maxLng = lng;
    }
    return { minLat, maxLat, minLng, maxLng };
  }, [gpxTrack]);

  return (
    <GpxContext.Provider value={{
      gpxTrack, setGpxTrack, itineraire, setItineraire, traceBbox,
      syncCode, joinSyncCode,
      trekNotes, setTrekNote,
      activeTrekId, setActiveTrekId,
      trekDates, setTrekDate,
      stagesDone, setStagesDone,
      journalEntries, setJournalEntry, deleteJournalEntry,
      checklistChecked, toggleChecked, resetChecked,
      customItems, addCustomItem, deleteCustomItem,
      syncStatus, isInitializing,
    }}>
      {children}
    </GpxContext.Provider>
  );
}

export function useGpx() { return useContext(GpxContext); }
