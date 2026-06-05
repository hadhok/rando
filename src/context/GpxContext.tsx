import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GpxTrack } from '../utils/gpxParser';
import { Itineraire } from '../utils/itineraireParser';

const KEY_GPX      = 'gpx_track_v2';
const KEY_IT       = 'itineraire_v1';
const KEY_NOTES    = 'trek_notes_v1';
const KEY_ACTIVE   = 'active_trek_v1';
const KEY_DATES    = 'trek_dates_v1';
const KEY_STAGES   = 'stages_done_v1';
const KEY_JOURNAL  = 'journal_v1';
const KEY_CHECKED  = 'rando_checked_v3';
const KEY_CUSTOM   = 'rando_custom_items_v3';

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

type Notes      = Record<string, string>;
type Dates      = Record<string, string>;
type AllChecked = Record<string, Record<string, boolean>>;
type AllCustom  = Record<string, CustomItem[]>;
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
  checklist_checked: AllChecked;
  checklist_custom: AllCustom;
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
  // Checklist — scoped to active trek
  activeChecked: Record<string, boolean>;
  toggleChecked: (id: string) => void;
  resetChecked: () => void;
  activeCustomItems: CustomItem[];
  addCustomItem: (item: CustomItem) => void;
  deleteCustomItem: (id: string) => void;
  syncStatus: SyncStatus;
  isInitializing: boolean;
}

const GpxContext = createContext<GpxContextValue>({
  gpxTrack: null, setGpxTrack: () => {},
  itineraire: null, setItineraire: () => {},
  traceBbox: null,
  trekNotes: {}, setTrekNote: () => {},
  activeTrekId: null, setActiveTrekId: () => {},
  trekDates: {}, setTrekDate: () => {},
  stagesDone: {}, setStagesDone: () => {},
  journalEntries: {}, setJournalEntry: () => {}, deleteJournalEntry: () => {},
  activeChecked: {}, toggleChecked: () => {}, resetChecked: () => {},
  activeCustomItems: [], addCustomItem: () => {}, deleteCustomItem: () => {},
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
  const [allChecked, setAllChecked]                = useState<AllChecked>({});
  const [allCustom, setAllCustom]                  = useState<AllCustom>({});
  const [syncStatus, setSyncStatus]                = useState<SyncStatus>('idle');
  const [isInitializing, setIsInitializing]        = useState(true);

  const stateRef = useRef({
    gpx: null as GpxTrack | null,
    it: null as Itineraire | null,
    notes: {} as Notes,
    active: null as string | null,
    dates: {} as Dates,
    allChecked: {} as AllChecked,
    allCustom: {} as AllCustom,
  });

  const trekKey = useCallback(() => stateRef.current.active ?? '__global__', []);

  const push = useCallback(async (partial?: Partial<SbPayload>) => {
    setSyncStatus('syncing');
    const payload: SbPayload = {
      gpx_track:          stateRef.current.gpx,
      itineraire:         stateRef.current.it,
      trek_notes:         stateRef.current.notes,
      active_trek:        stateRef.current.active,
      trek_dates:         stateRef.current.dates,
      checklist_checked:  stateRef.current.allChecked,
      checklist_custom:   stateRef.current.allCustom,
      ...partial,
    };
    const ok = await sbPush(DEFAULT_CODE, payload);
    setSyncStatus(ok ? 'ok' : 'error');
  }, []);

  useEffect(() => {
    (AsyncStorage as any).getMany([KEY_GPX, KEY_IT, KEY_NOTES, KEY_ACTIVE, KEY_DATES, KEY_STAGES, KEY_JOURNAL, KEY_CHECKED, KEY_CUSTOM]).then(
      async (values: Record<string, string | null>) => {
        let localGpx: GpxTrack | null = null;
        let localIt: Itineraire | null = null;
        let localNotes: Notes = {};
        let localActive: string | null = null;
        let localDates: Dates = {};
        let localAllChecked: AllChecked = {};
        let localAllCustom: AllCustom = {};
        try { if (values[KEY_GPX])     localGpx          = JSON.parse(values[KEY_GPX]!);     } catch {}
        try { if (values[KEY_IT])      localIt           = JSON.parse(values[KEY_IT]!);      } catch {}
        try { if (values[KEY_NOTES])   localNotes        = JSON.parse(values[KEY_NOTES]!);   } catch {}
        try { if (values[KEY_ACTIVE])  localActive       = values[KEY_ACTIVE]!;              } catch {}
        try { if (values[KEY_DATES])   localDates        = JSON.parse(values[KEY_DATES]!);   } catch {}
        try { if (values[KEY_STAGES])  setStagesDoneState(JSON.parse(values[KEY_STAGES]!));  } catch {}
        try { if (values[KEY_JOURNAL]) setJournalEntriesState(JSON.parse(values[KEY_JOURNAL]!)); } catch {}
        try { if (values[KEY_CHECKED]) localAllChecked   = JSON.parse(values[KEY_CHECKED]!); } catch {}
        try { if (values[KEY_CUSTOM])  localAllCustom    = JSON.parse(values[KEY_CUSTOM]!);  } catch {}

        if (localGpx)    { stateRef.current.gpx        = localGpx;          setGpxTrackState(localGpx); }
        if (localIt)     { stateRef.current.it         = localIt;           setItineraireState(localIt); }
        if (localActive) { stateRef.current.active     = localActive;       setActiveTrekIdState(localActive); }
        if (Object.keys(localDates).length > 0)      { stateRef.current.dates      = localDates;      setTrekDatesState(localDates); }
        if (Object.keys(localNotes).length > 0)      { stateRef.current.notes      = localNotes;      setTrekNotesState(localNotes); }
        if (Object.keys(localAllChecked).length > 0) { stateRef.current.allChecked = localAllChecked; setAllChecked(localAllChecked); }
        if (Object.keys(localAllCustom).length > 0)  { stateRef.current.allCustom  = localAllCustom;  setAllCustom(localAllCustom); }

        const remote = await sbPull(DEFAULT_CODE);
        if (remote) {
          if (remote.gpx_track)  { stateRef.current.gpx    = remote.gpx_track;  setGpxTrackState(remote.gpx_track);   AsyncStorage.setItem(KEY_GPX, JSON.stringify(remote.gpx_track)); }
          if (remote.itineraire) { stateRef.current.it     = remote.itineraire; setItineraireState(remote.itineraire); AsyncStorage.setItem(KEY_IT, JSON.stringify(remote.itineraire)); }
          if (remote.active_trek) { stateRef.current.active = remote.active_trek; setActiveTrekIdState(remote.active_trek); AsyncStorage.setItem(KEY_ACTIVE, remote.active_trek); }
          const rNotes = remote.trek_notes ?? {};
          if (Object.keys(rNotes).length > 0) { stateRef.current.notes = rNotes; setTrekNotesState(rNotes); AsyncStorage.setItem(KEY_NOTES, JSON.stringify(rNotes)); }
          const rDates = remote.trek_dates ?? {};
          if (Object.keys(rDates).length > 0) { stateRef.current.dates = rDates; setTrekDatesState(rDates); AsyncStorage.setItem(KEY_DATES, JSON.stringify(rDates)); }
          const rAllChecked = (remote.checklist_checked ?? {}) as AllChecked;
          if (Object.keys(rAllChecked).length > 0) { stateRef.current.allChecked = rAllChecked; setAllChecked(rAllChecked); AsyncStorage.setItem(KEY_CHECKED, JSON.stringify(rAllChecked)); }
          const rAllCustom = (remote.checklist_custom ?? {}) as AllCustom;
          if (Object.keys(rAllCustom).length > 0) { stateRef.current.allCustom = rAllCustom; setAllCustom(rAllCustom); AsyncStorage.setItem(KEY_CUSTOM, JSON.stringify(rAllCustom)); }

          const needsPush =
            (localGpx && !remote.gpx_track) ||
            (localIt && !remote.itineraire) ||
            (localActive && !remote.active_trek) ||
            (Object.keys(localNotes).length > 0 && Object.keys(rNotes).length === 0) ||
            (Object.keys(localDates).length > 0 && Object.keys(rDates).length === 0) ||
            (Object.keys(localAllChecked).length > 0 && Object.keys(rAllChecked).length === 0) ||
            (Object.keys(localAllCustom).length > 0 && Object.keys(rAllCustom).length === 0);
          if (needsPush) push();
        } else if (localGpx || localIt || localActive || Object.keys(localNotes).length > 0 || Object.keys(localDates).length > 0 || Object.keys(localAllChecked).length > 0 || Object.keys(localAllCustom).length > 0) {
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

  // ── Checklist (synced, scoped per trek) ────────────────────────────────────

  const toggleChecked = useCallback((id: string) => {
    const k = trekKey();
    setAllChecked(prev => {
      const trekChecked = { ...(prev[k] ?? {}), [id]: !(prev[k] ?? {})[id] };
      const next: AllChecked = { ...prev, [k]: trekChecked };
      stateRef.current.allChecked = next;
      AsyncStorage.setItem(KEY_CHECKED, JSON.stringify(next));
      push({ checklist_checked: next });
      return next;
    });
  }, [push, trekKey]);

  const resetChecked = useCallback(() => {
    const k = trekKey();
    setAllChecked(prev => {
      const next: AllChecked = { ...prev, [k]: {} };
      stateRef.current.allChecked = next;
      AsyncStorage.setItem(KEY_CHECKED, JSON.stringify(next));
      push({ checklist_checked: next });
      return next;
    });
  }, [push, trekKey]);

  const addCustomItem = useCallback((item: CustomItem) => {
    const k = trekKey();
    setAllCustom(prev => {
      const trekCustom = [...(prev[k] ?? []), item];
      const next: AllCustom = { ...prev, [k]: trekCustom };
      stateRef.current.allCustom = next;
      AsyncStorage.setItem(KEY_CUSTOM, JSON.stringify(next));
      push({ checklist_custom: next });
      return next;
    });
  }, [push, trekKey]);

  const deleteCustomItem = useCallback((id: string) => {
    const k = trekKey();
    setAllCustom(prev => {
      const trekCustom = (prev[k] ?? []).filter(i => i.id !== id);
      const next: AllCustom = { ...prev, [k]: trekCustom };
      stateRef.current.allCustom = next;
      AsyncStorage.setItem(KEY_CUSTOM, JSON.stringify(next));
      push({ checklist_custom: next });
      // Also remove from checked
      setAllChecked(prevC => {
        const trekChecked = { ...(prevC[k] ?? {}) };
        delete trekChecked[id];
        const nextC: AllChecked = { ...prevC, [k]: trekChecked };
        stateRef.current.allChecked = nextC;
        AsyncStorage.setItem(KEY_CHECKED, JSON.stringify(nextC));
        return nextC;
      });
      return next;
    });
  }, [push, trekKey]);

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

  const k = activeTrekId ?? '__global__';
  const activeChecked = allChecked[k] ?? {};
  const activeCustomItems = allCustom[k] ?? [];

  return (
    <GpxContext.Provider value={{
      gpxTrack, setGpxTrack, itineraire, setItineraire, traceBbox,
      trekNotes, setTrekNote,
      activeTrekId, setActiveTrekId,
      trekDates, setTrekDate,
      stagesDone, setStagesDone,
      journalEntries, setJournalEntry, deleteJournalEntry,
      activeChecked, toggleChecked, resetChecked,
      activeCustomItems, addCustomItem, deleteCustomItem,
      syncStatus, isInitializing,
    }}>
      {children}
    </GpxContext.Provider>
  );
}

export function useGpx() { return useContext(GpxContext); }
