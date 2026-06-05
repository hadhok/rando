import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GpxTrack } from '../utils/gpxParser';
import { Itineraire } from '../utils/itineraireParser';

// ─── AsyncStorage keys ────────────────────────────────────────────────────────
const KEY_ACTIVE     = 'active_trek_v1';
const KEY_STAGES     = 'stages_done_v1';
const KEY_JOURNAL    = 'journal_v1';
const KEY_TREK_ROWS  = 'trek_rows_v1';

// ─── Supabase sync ────────────────────────────────────────────────────────────
// Per-trek schema (one row per trek_id):
// create table rando_sync (
//   code text primary key,
//   gpx_track jsonb,
//   itineraire jsonb,
//   trek_note text default '',
//   trek_date text default '',
//   checklist_checked jsonb default '{}',
//   checklist_custom jsonb default '[]',
//   active_trek text,           -- only used on the '__settings__' row
//   updated_at timestamptz default now()
// );
// alter table rando_sync enable row level security;
// create policy "anon_all" on rando_sync for all using (true) with check (true);
//
// -- Migration: see /scripts/migrate_per_trek.sql

const SB_URL = 'https://zodywxrnyaiviuahxuvw.supabase.co';
const SB_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvZHl3eHJueWFpdml1YWh4dXZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5MDUzMzMsImV4cCI6MjA5NTQ4MTMzM30.ZiqmEIg1Xfq70qTwiIw3N58LAoP540J3Bo8inCqUCuk';
const TABLE = `${SB_URL}/rest/v1/rando_sync`;
const SB_H = {
  apikey: SB_KEY,
  Authorization: `Bearer ${SB_KEY}`,
  'Content-Type': 'application/json',
};

// ─── Types ────────────────────────────────────────────────────────────────────

export type CustomItem = {
  id: string;
  name: string;
  who: import('../data/checklist').WhoType;
  vital: boolean;
  weight?: number;
  note?: string;
  sectionKey: string;
};
export type SyncStatus = 'idle' | 'syncing' | 'ok' | 'error';

export interface JournalEntry {
  id: string;       // `${trekId}-${date}`
  trekId: string;
  date: string;     // YYYY-MM-DD
  text: string;
  meteo: string;
  humeur: string;
}

/** Per-trek data stored in one Supabase row (code = trek_id). */
interface TrekRow {
  gpx_track: GpxTrack | null;
  itineraire: Itineraire | null;
  trek_note: string;
  trek_date: string;
  checklist_checked: Record<string, boolean>;
  checklist_custom: CustomItem[];
}

const defaultTrekRow = (): TrekRow => ({
  gpx_track: null,
  itineraire: null,
  trek_note: '',
  trek_date: '',
  checklist_checked: {},
  checklist_custom: [],
});

// ─── Supabase helpers ─────────────────────────────────────────────────────────

async function sbPushTrek(trekId: string, row: TrekRow): Promise<boolean> {
  const url = `${TABLE}?on_conflict=code`;
  const ts = new Date().toISOString();
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { ...SB_H, Prefer: 'resolution=merge-duplicates' },
      body: JSON.stringify({
        code: trekId,
        gpx_track: row.gpx_track,
        itineraire: row.itineraire,
        trek_note: row.trek_note,
        trek_date: row.trek_date,
        checklist_checked: row.checklist_checked,
        checklist_custom: row.checklist_custom,
        updated_at: ts,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function sbPushSettings(activeTrek: string | null): Promise<boolean> {
  const url = `${TABLE}?on_conflict=code`;
  const ts = new Date().toISOString();
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { ...SB_H, Prefer: 'resolution=merge-duplicates' },
      body: JSON.stringify({
        code: '__settings__',
        active_trek: activeTrek,
        updated_at: ts,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function sbPullAll(): Promise<{
  trekRows: Record<string, TrekRow>;
  activeTrek: string | null;
} | null> {
  try {
    const res = await fetch(
      `${TABLE}?select=code,gpx_track,itineraire,trek_note,trek_date,checklist_checked,checklist_custom,active_trek`,
      { headers: SB_H }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data)) return null;

    const trekRows: Record<string, TrekRow> = {};
    let activeTrek: string | null = null;

    for (const row of data) {
      if (row.code === '__settings__') {
        activeTrek = row.active_trek ?? null;
        continue;
      }
      // Skip the legacy global row
      if (row.code === 'KEVD0R') continue;
      trekRows[row.code] = {
        gpx_track: row.gpx_track ?? null,
        itineraire: row.itineraire ?? null,
        trek_note: row.trek_note ?? '',
        trek_date: row.trek_date ?? '',
        checklist_checked: row.checklist_checked ?? {},
        checklist_custom: row.checklist_custom ?? [],
      };
    }
    return { trekRows, activeTrek };
  } catch {
    return null;
  }
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
  trekNotes: Record<string, string>;
  setTrekNote: (trekId: string, text: string) => void;
  activeTrekId: string | null;
  setActiveTrekId: (id: string | null) => void;
  trekDates: Record<string, string>;
  setTrekDate: (trekId: string, date: string) => void;
  stagesDone: Record<string, boolean>;
  setStagesDone: (key: string, done: boolean) => void;
  journalEntries: Record<string, JournalEntry>;
  setJournalEntry: (entry: JournalEntry) => void;
  deleteJournalEntry: (id: string) => void;
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
  const [trekRows, setTrekRows]                     = useState<Record<string, TrekRow>>({});
  const [activeTrekId, setActiveTrekIdState]        = useState<string | null>(null);
  const [stagesDone, setStagesDoneState]            = useState<Record<string, boolean>>({});
  const [journalEntries, setJournalEntriesState]    = useState<Record<string, JournalEntry>>({});
  const [syncStatus, setSyncStatus]                 = useState<SyncStatus>('idle');
  const [isInitializing, setIsInitializing]         = useState(true);

  const stateRef = useRef({
    active: null as string | null,
    trekRows: {} as Record<string, TrekRow>,
  });

  // ── Helper: update a single trek row in state + AsyncStorage ────────────────
  const updateTrekRow = useCallback((trekId: string, patch: Partial<TrekRow>) => {
    setTrekRows(prev => {
      const row: TrekRow = { ...(prev[trekId] ?? defaultTrekRow()), ...patch };
      const next = { ...prev, [trekId]: row };
      stateRef.current.trekRows = next;
      AsyncStorage.setItem(KEY_TREK_ROWS, JSON.stringify(next));
      return next;
    });
  }, []);

  const trekKey = useCallback(() => stateRef.current.active ?? '__global__', []);

  // ── Derived backwards-compat values ─────────────────────────────────────────
  const activeTrekRow = trekRows[activeTrekId ?? ''] ?? defaultTrekRow();
  const gpxTrack      = activeTrekRow.gpx_track;
  const itineraire    = activeTrekRow.itineraire;

  const trekNotes: Record<string, string> = Object.fromEntries(
    Object.entries(trekRows)
      .filter(([, r]) => r.trek_note)
      .map(([id, r]) => [id, r.trek_note])
  );
  const trekDates: Record<string, string> = Object.fromEntries(
    Object.entries(trekRows)
      .filter(([, r]) => r.trek_date)
      .map(([id, r]) => [id, r.trek_date])
  );

  const activeChecked    = activeTrekRow.checklist_checked;
  const activeCustomItems = activeTrekRow.checklist_custom;

  // ── traceBbox ────────────────────────────────────────────────────────────────
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

  // ── Init ─────────────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      // 1. Load local data
      let localTrekRows: Record<string, TrekRow> = {};
      let localActive: string | null = null;

      try {
        const [rowsVal, activeVal, stagesVal, journalVal] = await Promise.all([
          AsyncStorage.getItem(KEY_TREK_ROWS),
          AsyncStorage.getItem(KEY_ACTIVE),
          AsyncStorage.getItem(KEY_STAGES),
          AsyncStorage.getItem(KEY_JOURNAL),
        ]);
        if (rowsVal)   localTrekRows = JSON.parse(rowsVal);
        if (activeVal) localActive   = activeVal;
        if (stagesVal) setStagesDoneState(JSON.parse(stagesVal));
        if (journalVal) setJournalEntriesState(JSON.parse(journalVal));
      } catch {}

      if (Object.keys(localTrekRows).length > 0) {
        stateRef.current.trekRows = localTrekRows;
        setTrekRows(localTrekRows);
      }
      if (localActive) {
        stateRef.current.active = localActive;
        setActiveTrekIdState(localActive);
      }

      // 2. Pull from Supabase
      const remote = await sbPullAll();
      if (remote) {
        const { trekRows: remoteTrekRows, activeTrek: remoteActive } = remote;

        // Remote wins: merge remote over local
        const merged: Record<string, TrekRow> = { ...localTrekRows };
        for (const [id, row] of Object.entries(remoteTrekRows)) {
          merged[id] = row;
        }

        if (Object.keys(merged).length > 0) {
          stateRef.current.trekRows = merged;
          setTrekRows(merged);
          AsyncStorage.setItem(KEY_TREK_ROWS, JSON.stringify(merged));
        }

        const finalActive = remoteActive ?? localActive;
        if (finalActive) {
          stateRef.current.active = finalActive;
          setActiveTrekIdState(finalActive);
          AsyncStorage.setItem(KEY_ACTIVE, finalActive);
        }

        // Push back if local had data remote didn't
        const needsPush =
          (localActive && !remoteActive) ||
          Object.keys(localTrekRows).some(id => !remoteTrekRows[id]);
        if (needsPush) {
          setSyncStatus('syncing');
          const results = await Promise.all([
            sbPushSettings(finalActive),
            ...Object.entries(localTrekRows)
              .filter(([id]) => !remoteTrekRows[id])
              .map(([id, row]) => sbPushTrek(id, row)),
          ]);
          setSyncStatus(results.every(Boolean) ? 'ok' : 'error');
        }
      } else if (localActive || Object.keys(localTrekRows).length > 0) {
        // No remote yet — push local
        setSyncStatus('syncing');
        const results = await Promise.all([
          sbPushSettings(localActive),
          ...Object.entries(localTrekRows).map(([id, row]) => sbPushTrek(id, row)),
        ]);
        setSyncStatus(results.every(Boolean) ? 'ok' : 'error');
      }

      setIsInitializing(false);
    })();
  }, []);

  // ── Setters ──────────────────────────────────────────────────────────────────

  const setGpxTrack = useCallback((track: GpxTrack | null) => {
    const tid = stateRef.current.active ?? '__global__';
    // updateTrekRow is async (setState), so compute the new row immediately for push
    const currentRow = stateRef.current.trekRows[tid] ?? defaultTrekRow();
    const newRow: TrekRow = { ...currentRow, gpx_track: track };
    updateTrekRow(tid, { gpx_track: track });
    setSyncStatus('syncing');
    sbPushTrek(tid, newRow).then(ok => setSyncStatus(ok ? 'ok' : 'error'));
  }, [updateTrekRow]);

  const setItineraire = useCallback((it: Itineraire | null) => {
    const tid = stateRef.current.active ?? '__global__';
    const currentRow = stateRef.current.trekRows[tid] ?? defaultTrekRow();
    const newRow: TrekRow = { ...currentRow, itineraire: it };
    updateTrekRow(tid, { itineraire: it });
    setSyncStatus('syncing');
    sbPushTrek(tid, newRow).then(ok => setSyncStatus(ok ? 'ok' : 'error'));
  }, [updateTrekRow]);

  const setTrekNote = useCallback((trekId: string, text: string) => {
    const currentRow = stateRef.current.trekRows[trekId] ?? defaultTrekRow();
    const newRow: TrekRow = { ...currentRow, trek_note: text };
    updateTrekRow(trekId, { trek_note: text });
    setSyncStatus('syncing');
    sbPushTrek(trekId, newRow).then(ok => setSyncStatus(ok ? 'ok' : 'error'));
  }, [updateTrekRow]);

  const setActiveTrekId = useCallback((id: string | null) => {
    stateRef.current.active = id;
    setActiveTrekIdState(id);
    id ? AsyncStorage.setItem(KEY_ACTIVE, id) : AsyncStorage.removeItem(KEY_ACTIVE);
    setSyncStatus('syncing');
    sbPushSettings(id).then(ok => setSyncStatus(ok ? 'ok' : 'error'));
  }, []);

  const setTrekDate = useCallback((trekId: string, date: string) => {
    const currentRow = stateRef.current.trekRows[trekId] ?? defaultTrekRow();
    const newRow: TrekRow = { ...currentRow, trek_date: date };
    updateTrekRow(trekId, { trek_date: date });
    setSyncStatus('syncing');
    sbPushTrek(trekId, newRow).then(ok => setSyncStatus(ok ? 'ok' : 'error'));
  }, [updateTrekRow]);

  const setStagesDone = useCallback((key: string, done: boolean) => {
    setStagesDoneState(prev => {
      const next = { ...prev };
      done ? (next[key] = true) : delete next[key];
      Object.keys(next).length > 0
        ? AsyncStorage.setItem(KEY_STAGES, JSON.stringify(next))
        : AsyncStorage.removeItem(KEY_STAGES);
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
      Object.keys(next).length > 0
        ? AsyncStorage.setItem(KEY_JOURNAL, JSON.stringify(next))
        : AsyncStorage.removeItem(KEY_JOURNAL);
      return next;
    });
  }, []);

  // ── Checklist ────────────────────────────────────────────────────────────────

  const toggleChecked = useCallback((id: string) => {
    const k = trekKey();
    setTrekRows(prev => {
      const row = prev[k] ?? defaultTrekRow();
      const checked = { ...row.checklist_checked, [id]: !row.checklist_checked[id] };
      const newRow: TrekRow = { ...row, checklist_checked: checked };
      const next = { ...prev, [k]: newRow };
      stateRef.current.trekRows = next;
      AsyncStorage.setItem(KEY_TREK_ROWS, JSON.stringify(next));
      setSyncStatus('syncing');
      sbPushTrek(k, newRow).then(ok => setSyncStatus(ok ? 'ok' : 'error'));
      return next;
    });
  }, [trekKey]);

  const resetChecked = useCallback(() => {
    const k = trekKey();
    setTrekRows(prev => {
      const row = prev[k] ?? defaultTrekRow();
      const newRow: TrekRow = { ...row, checklist_checked: {} };
      const next = { ...prev, [k]: newRow };
      stateRef.current.trekRows = next;
      AsyncStorage.setItem(KEY_TREK_ROWS, JSON.stringify(next));
      setSyncStatus('syncing');
      sbPushTrek(k, newRow).then(ok => setSyncStatus(ok ? 'ok' : 'error'));
      return next;
    });
  }, [trekKey]);

  const addCustomItem = useCallback((item: CustomItem) => {
    const k = trekKey();
    setTrekRows(prev => {
      const row = prev[k] ?? defaultTrekRow();
      const custom = [...row.checklist_custom, item];
      const newRow: TrekRow = { ...row, checklist_custom: custom };
      const next = { ...prev, [k]: newRow };
      stateRef.current.trekRows = next;
      AsyncStorage.setItem(KEY_TREK_ROWS, JSON.stringify(next));
      setSyncStatus('syncing');
      sbPushTrek(k, newRow).then(ok => setSyncStatus(ok ? 'ok' : 'error'));
      return next;
    });
  }, [trekKey]);

  const deleteCustomItem = useCallback((id: string) => {
    const k = trekKey();
    setTrekRows(prev => {
      const row = prev[k] ?? defaultTrekRow();
      const custom = row.checklist_custom.filter(i => i.id !== id);
      const checked = { ...row.checklist_checked };
      delete checked[id];
      const newRow: TrekRow = { ...row, checklist_custom: custom, checklist_checked: checked };
      const next = { ...prev, [k]: newRow };
      stateRef.current.trekRows = next;
      AsyncStorage.setItem(KEY_TREK_ROWS, JSON.stringify(next));
      setSyncStatus('syncing');
      sbPushTrek(k, newRow).then(ok => setSyncStatus(ok ? 'ok' : 'error'));
      return next;
    });
  }, [trekKey]);

  return (
    <GpxContext.Provider value={{
      gpxTrack, setGpxTrack,
      itineraire, setItineraire,
      traceBbox,
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
