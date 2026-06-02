import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GpxTrack } from '../utils/gpxParser';
import { Itineraire } from '../utils/itineraireParser';

const KEY_GPX     = 'gpx_track_v2';
const KEY_IT      = 'itineraire_v1';
const KEY_CODE    = 'sync_code_v1';
const KEY_NOTES   = 'trek_notes_v1';
const KEY_ACTIVE  = 'active_trek_v1';
const KEY_DATES   = 'trek_dates_v1';
const KEY_STAGES  = 'stages_done_v1';
const KEY_JOURNAL = 'journal_v1';

// ─── Supabase sync ────────────────────────────────────────────────────────────
// create table rando_sync (
//   code text primary key,
//   gpx_track jsonb, itineraire jsonb, trek_notes jsonb,
//   active_trek text, trek_dates jsonb,
//   updated_at timestamptz default now()
// );
// alter table rando_sync enable row level security;
// create policy "anon_all" on rando_sync for all using (true) with check (true);
// -- Migrations if table already exists:
// alter table rando_sync add column if not exists trek_notes jsonb;
// alter table rando_sync add column if not exists active_trek text;
// alter table rando_sync add column if not exists trek_dates jsonb;

const SB_URL = 'https://zodywxrnyaiviuahxuvw.supabase.co';
const SB_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvZHl3eHJueWFpdml1YWh4dXZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5MDUzMzMsImV4cCI6MjA5NTQ4MTMzM30.ZiqmEIg1Xfq70qTwiIw3N58LAoP540J3Bo8inCqUCuk';
const TABLE = `${SB_URL}/rest/v1/rando_sync`;
const SB_H = {
  apikey: SB_KEY,
  Authorization: `Bearer ${SB_KEY}`,
  'Content-Type': 'application/json',
};

type Notes = Record<string, string>;
type Dates = Record<string, string>;
export type SyncStatus = 'idle' | 'syncing' | 'ok' | 'error';

export interface JournalEntry {
  id: string;       // `${trekId}-${date}`
  trekId: string;
  date: string;     // YYYY-MM-DD
  text: string;
  meteo: string;    // weather emoji
  humeur: string;   // mood emoji
}

// Code fixe — app personnelle, pas de génération aléatoire par appareil
const DEFAULT_CODE = 'KEVD0R';

async function sbPush(code: string, gpx: GpxTrack | null, it: Itineraire | null, notes: Notes, active: string | null, dates: Dates): Promise<boolean> {
  const opts = (body: object) => ({
    method: 'POST' as const,
    headers: { ...SB_H, Prefer: 'resolution=merge-duplicates' },
    body: JSON.stringify(body),
  });
  const url = `${TABLE}?on_conflict=code`;
  const ts = new Date().toISOString();
  try {
    const full = { code, gpx_track: gpx, itineraire: it, trek_notes: notes, active_trek: active, trek_dates: dates, updated_at: ts };
    let res = await fetch(url, opts(full));
    if (!res.ok && res.status === 400) {
      // active_trek/trek_dates columns not yet migrated — retry without them
      res = await fetch(url, opts({ code, gpx_track: gpx, itineraire: it, trek_notes: notes, updated_at: ts }));
    }
    if (!res.ok && res.status === 400) {
      // trek_notes column not yet migrated either
      res = await fetch(url, opts({ code, gpx_track: gpx, itineraire: it, updated_at: ts }));
    }
    return res.ok;
  } catch {
    return false;
  }
}

async function sbPull(code: string): Promise<{ gpx_track: GpxTrack | null; itineraire: Itineraire | null; trek_notes: Notes | null; active_trek: string | null; trek_dates: Dates | null } | null> {
  try {
    const res = await fetch(`${TABLE}?code=eq.${code}&select=gpx_track,itineraire,trek_notes,active_trek,trek_dates`, { headers: SB_H });
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
  syncStatus: 'idle',
  isInitializing: true,
});

export function GpxProvider({ children }: { children: React.ReactNode }) {
  const [gpxTrack, setGpxTrackState]             = useState<GpxTrack | null>(null);
  const [itineraire, setItineraireState]         = useState<Itineraire | null>(null);
  const [trekNotes, setTrekNotesState]           = useState<Notes>({});
  const [activeTrekId, setActiveTrekIdState]     = useState<string | null>(null);
  const [trekDates, setTrekDatesState]           = useState<Dates>({});
  const [stagesDone, setStagesDoneState]         = useState<Record<string, boolean>>({});
  const [journalEntries, setJournalEntriesState] = useState<Record<string, JournalEntry>>({});
  const [syncCode, setSyncCode]                  = useState('');
  const [syncStatus, setSyncStatus]              = useState<SyncStatus>('idle');
  const [isInitializing, setIsInitializing]      = useState(true);

  const syncCodeRef = useRef('');
  const stateRef    = useRef({ gpx: null as GpxTrack | null, it: null as Itineraire | null, notes: {} as Notes, active: null as string | null, dates: {} as Dates });

  const push = useCallback(async (gpx: GpxTrack | null, it: Itineraire | null, notes: Notes, active: string | null, dates: Dates) => {
    if (!syncCodeRef.current) return;
    setSyncStatus('syncing');
    const ok = await sbPush(syncCodeRef.current, gpx, it, notes, active, dates);
    setSyncStatus(ok ? 'ok' : 'error');
  }, []);

  useEffect(() => {
    (AsyncStorage as any).getMany([KEY_GPX, KEY_IT, KEY_CODE, KEY_NOTES, KEY_ACTIVE, KEY_DATES, KEY_STAGES, KEY_JOURNAL]).then(
      async (values: Record<string, string | null>) => {
        let localGpx: GpxTrack | null = null;
        let localIt: Itineraire | null = null;
        let localNotes: Notes = {};
        let localActive: string | null = null;
        let localDates: Dates = {};
        try { if (values[KEY_GPX])    localGpx    = JSON.parse(values[KEY_GPX]!);    } catch {}
        try { if (values[KEY_IT])     localIt     = JSON.parse(values[KEY_IT]!);     } catch {}
        try { if (values[KEY_NOTES])  localNotes  = JSON.parse(values[KEY_NOTES]!);  } catch {}
        try { if (values[KEY_ACTIVE]) localActive = values[KEY_ACTIVE]!;             } catch {}
        try { if (values[KEY_DATES])  localDates  = JSON.parse(values[KEY_DATES]!);  } catch {}
        try { if (values[KEY_STAGES]) setStagesDoneState(JSON.parse(values[KEY_STAGES]!)); } catch {}
        try { if (values[KEY_JOURNAL]) setJournalEntriesState(JSON.parse(values[KEY_JOURNAL]!)); } catch {}

        if (localGpx)    { stateRef.current.gpx    = localGpx;    setGpxTrackState(localGpx); }
        if (localIt)     { stateRef.current.it     = localIt;     setItineraireState(localIt); }
        if (localActive) { stateRef.current.active = localActive; setActiveTrekIdState(localActive); }
        if (Object.keys(localDates).length > 0)  { stateRef.current.dates = localDates;  setTrekDatesState(localDates); }
        if (Object.keys(localNotes).length > 0)  { stateRef.current.notes = localNotes;  setTrekNotesState(localNotes); }

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
          // Push local data that Supabase is missing (field-by-field check)
          const needsPush = (localGpx && !remote.gpx_track) ||
            (localIt && !remote.itineraire) ||
            (localActive && !remote.active_trek) ||
            (Object.keys(localNotes).length > 0 && Object.keys(rNotes).length === 0) ||
            (Object.keys(localDates).length > 0 && Object.keys(rDates).length === 0);
          if (needsPush) {
            setSyncStatus('syncing');
            sbPush(code, stateRef.current.gpx, stateRef.current.it, stateRef.current.notes, stateRef.current.active, stateRef.current.dates).then(ok => setSyncStatus(ok ? 'ok' : 'error'));
          }
        } else if (localGpx || localIt || localActive || Object.keys(localNotes).length > 0 || Object.keys(localDates).length > 0) {
          setSyncStatus('syncing');
          sbPush(code, localGpx, localIt, localNotes, localActive, localDates).then(ok => setSyncStatus(ok ? 'ok' : 'error'));
        }
        setIsInitializing(false);
      }
    );
  }, []);

  const setGpxTrack = useCallback((track: GpxTrack | null) => {
    stateRef.current.gpx = track;
    setGpxTrackState(track);
    track ? AsyncStorage.setItem(KEY_GPX, JSON.stringify(track)) : AsyncStorage.removeItem(KEY_GPX);
    push(track, stateRef.current.it, stateRef.current.notes, stateRef.current.active, stateRef.current.dates);
  }, [push]);

  const setItineraire = useCallback((it: Itineraire | null) => {
    stateRef.current.it = it;
    setItineraireState(it);
    it ? AsyncStorage.setItem(KEY_IT, JSON.stringify(it)) : AsyncStorage.removeItem(KEY_IT);
    push(stateRef.current.gpx, it, stateRef.current.notes, stateRef.current.active, stateRef.current.dates);
  }, [push]);

  const setTrekNote = useCallback((trekId: string, text: string) => {
    const next: Notes = { ...stateRef.current.notes };
    text.trim() ? (next[trekId] = text) : delete next[trekId];
    stateRef.current.notes = next;
    setTrekNotesState(next);
    Object.keys(next).length > 0 ? AsyncStorage.setItem(KEY_NOTES, JSON.stringify(next)) : AsyncStorage.removeItem(KEY_NOTES);
    push(stateRef.current.gpx, stateRef.current.it, next, stateRef.current.active, stateRef.current.dates);
  }, [push]);

  const setActiveTrekId = useCallback((id: string | null) => {
    stateRef.current.active = id;
    setActiveTrekIdState(id);
    id ? AsyncStorage.setItem(KEY_ACTIVE, id) : AsyncStorage.removeItem(KEY_ACTIVE);
    push(stateRef.current.gpx, stateRef.current.it, stateRef.current.notes, id, stateRef.current.dates);
  }, [push]);

  const setTrekDate = useCallback((trekId: string, date: string) => {
    const next: Dates = { ...stateRef.current.dates };
    date ? (next[trekId] = date) : delete next[trekId];
    stateRef.current.dates = next;
    setTrekDatesState(next);
    Object.keys(next).length > 0 ? AsyncStorage.setItem(KEY_DATES, JSON.stringify(next)) : AsyncStorage.removeItem(KEY_DATES);
    push(stateRef.current.gpx, stateRef.current.it, stateRef.current.notes, stateRef.current.active, next);
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

  const joinSyncCode = useCallback(async (code: string) => {
    const normalized = code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    syncCodeRef.current = normalized;
    setSyncCode(normalized);
    await AsyncStorage.setItem(KEY_CODE, normalized);
    const remote = await sbPull(normalized);
    if (remote) {
      if (remote.gpx_track)  { stateRef.current.gpx    = remote.gpx_track;  setGpxTrackState(remote.gpx_track);   await AsyncStorage.setItem(KEY_GPX, JSON.stringify(remote.gpx_track)); }
      if (remote.itineraire) { stateRef.current.it     = remote.itineraire; setItineraireState(remote.itineraire); await AsyncStorage.setItem(KEY_IT, JSON.stringify(remote.itineraire)); }
      if (remote.active_trek) { stateRef.current.active = remote.active_trek; setActiveTrekIdState(remote.active_trek); await AsyncStorage.setItem(KEY_ACTIVE, remote.active_trek); }
      const rNotes = remote.trek_notes ?? {};
      if (Object.keys(rNotes).length > 0) { stateRef.current.notes = rNotes; setTrekNotesState(rNotes); await AsyncStorage.setItem(KEY_NOTES, JSON.stringify(rNotes)); }
      const rDates = remote.trek_dates ?? {};
      if (Object.keys(rDates).length > 0) { stateRef.current.dates = rDates; setTrekDatesState(rDates); await AsyncStorage.setItem(KEY_DATES, JSON.stringify(rDates)); }
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
      syncStatus, isInitializing,
    }}>
      {children}
    </GpxContext.Provider>
  );
}

export function useGpx() { return useContext(GpxContext); }
