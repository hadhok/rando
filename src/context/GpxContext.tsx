import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GpxTrack } from '../utils/gpxParser';
import { Itineraire } from '../utils/itineraireParser';

const KEY_GPX   = 'gpx_track_v2';
const KEY_IT    = 'itineraire_v1';
const KEY_CODE  = 'sync_code_v1';
const KEY_NOTES = 'trek_notes_v1';

// ─── Supabase sync (raw fetch — no SDK dependency) ────────────────────────────
// Table SQL (run once in Supabase dashboard):
//   create table rando_sync (
//     code text primary key,
//     gpx_track jsonb, itineraire jsonb, trek_notes jsonb,
//     updated_at timestamptz default now()
//   );
//   alter table rando_sync enable row level security;
//   create policy "anon_all" on rando_sync for all using (true) with check (true);
//
// If the table already exists, add the column:
//   alter table rando_sync add column if not exists trek_notes jsonb;

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

function generateCode(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

async function sbPush(
  code: string,
  gpx: GpxTrack | null,
  it: Itineraire | null,
  notes: Notes
) {
  try {
    await fetch(`${TABLE}?on_conflict=code`, {
      method: 'POST',
      headers: { ...SB_H, Prefer: 'resolution=merge-duplicates' },
      body: JSON.stringify({
        code,
        gpx_track: gpx,
        itineraire: it,
        trek_notes: notes,
        updated_at: new Date().toISOString(),
      }),
    });
  } catch {}
}

async function sbPull(
  code: string
): Promise<{ gpx_track: GpxTrack | null; itineraire: Itineraire | null; trek_notes: Notes | null } | null> {
  try {
    const res = await fetch(
      `${TABLE}?code=eq.${code}&select=gpx_track,itineraire,trek_notes`,
      { headers: SB_H }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) return data[0];
  } catch {}
  return null;
}

// ─── Bbox & filter ────────────────────────────────────────────────────────────

export interface TraceBbox {
  minLat: number; maxLat: number; minLng: number; maxLng: number;
}

/** Returns true if (lat, lng) falls within bbox + ~10 km buffer */
export function isNearTrace(lat: number, lng: number, bbox: TraceBbox): boolean {
  const BUF = 0.09;
  return (
    lat >= bbox.minLat - BUF && lat <= bbox.maxLat + BUF &&
    lng >= bbox.minLng - BUF && lng <= bbox.maxLng + BUF
  );
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
}

const GpxContext = createContext<GpxContextValue>({
  gpxTrack: null,
  setGpxTrack: () => {},
  itineraire: null,
  setItineraire: () => {},
  traceBbox: null,
  syncCode: '',
  joinSyncCode: async () => {},
  trekNotes: {},
  setTrekNote: () => {},
});

export function GpxProvider({ children }: { children: React.ReactNode }) {
  const [gpxTrack, setGpxTrackState]     = useState<GpxTrack | null>(null);
  const [itineraire, setItineraireState] = useState<Itineraire | null>(null);
  const [trekNotes, setTrekNotesState]   = useState<Notes>({});
  const [syncCode, setSyncCode]          = useState('');

  const syncCodeRef = useRef('');
  const stateRef    = useRef({
    gpx:   null as GpxTrack | null,
    it:    null as Itineraire | null,
    notes: {} as Notes,
  });

  useEffect(() => {
    (AsyncStorage as any).getMany([KEY_GPX, KEY_IT, KEY_CODE, KEY_NOTES]).then(
      async (values: Record<string, string | null>) => {
        const gpxStr   = values[KEY_GPX]   ?? null;
        const itStr    = values[KEY_IT]    ?? null;
        const codeStr  = values[KEY_CODE]  ?? null;
        const notesStr = values[KEY_NOTES] ?? null;

        let localGpx: GpxTrack | null = null;
        let localIt: Itineraire | null = null;
        let localNotes: Notes = {};
        if (gpxStr)   { try { localGpx   = JSON.parse(gpxStr);   } catch {} }
        if (itStr)    { try { localIt    = JSON.parse(itStr);    } catch {} }
        if (notesStr) { try { localNotes = JSON.parse(notesStr); } catch {} }

        if (localGpx)  { stateRef.current.gpx   = localGpx;   setGpxTrackState(localGpx); }
        if (localIt)   { stateRef.current.it    = localIt;    setItineraireState(localIt); }
        if (Object.keys(localNotes).length > 0) {
          stateRef.current.notes = localNotes;
          setTrekNotesState(localNotes);
        }

        let code = codeStr ?? '';
        if (!code) {
          code = generateCode();
          await AsyncStorage.setItem(KEY_CODE, code);
        }
        syncCodeRef.current = code;
        setSyncCode(code);

        const remote = await sbPull(code);
        if (remote) {
          const rGpx   = remote.gpx_track;
          const rIt    = remote.itineraire;
          const rNotes = remote.trek_notes ?? {};
          if (rGpx) {
            stateRef.current.gpx = rGpx;
            setGpxTrackState(rGpx);
            AsyncStorage.setItem(KEY_GPX, JSON.stringify(rGpx));
          }
          if (rIt) {
            stateRef.current.it = rIt;
            setItineraireState(rIt);
            AsyncStorage.setItem(KEY_IT, JSON.stringify(rIt));
          }
          if (Object.keys(rNotes).length > 0) {
            stateRef.current.notes = rNotes;
            setTrekNotesState(rNotes);
            AsyncStorage.setItem(KEY_NOTES, JSON.stringify(rNotes));
          }
          if (!rGpx && !rIt && (localGpx || localIt || Object.keys(localNotes).length > 0)) {
            sbPush(code, localGpx, localIt, localNotes);
          }
        } else if (localGpx || localIt || Object.keys(localNotes).length > 0) {
          sbPush(code, localGpx, localIt, localNotes);
        }
      }
    );
  }, []);

  const setGpxTrack = useCallback((track: GpxTrack | null) => {
    stateRef.current.gpx = track;
    setGpxTrackState(track);
    track
      ? AsyncStorage.setItem(KEY_GPX, JSON.stringify(track))
      : AsyncStorage.removeItem(KEY_GPX);
    if (syncCodeRef.current)
      sbPush(syncCodeRef.current, track, stateRef.current.it, stateRef.current.notes);
  }, []);

  const setItineraire = useCallback((it: Itineraire | null) => {
    stateRef.current.it = it;
    setItineraireState(it);
    it
      ? AsyncStorage.setItem(KEY_IT, JSON.stringify(it))
      : AsyncStorage.removeItem(KEY_IT);
    if (syncCodeRef.current)
      sbPush(syncCodeRef.current, stateRef.current.gpx, it, stateRef.current.notes);
  }, []);

  const setTrekNote = useCallback((trekId: string, text: string) => {
    const next: Notes = { ...stateRef.current.notes };
    if (text.trim()) {
      next[trekId] = text;
    } else {
      delete next[trekId];
    }
    stateRef.current.notes = next;
    setTrekNotesState(next);
    Object.keys(next).length > 0
      ? AsyncStorage.setItem(KEY_NOTES, JSON.stringify(next))
      : AsyncStorage.removeItem(KEY_NOTES);
    if (syncCodeRef.current)
      sbPush(syncCodeRef.current, stateRef.current.gpx, stateRef.current.it, next);
  }, []);

  const joinSyncCode = useCallback(async (code: string) => {
    const normalized = code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    syncCodeRef.current = normalized;
    setSyncCode(normalized);
    await AsyncStorage.setItem(KEY_CODE, normalized);

    const remote = await sbPull(normalized);
    if (remote) {
      if (remote.gpx_track) {
        stateRef.current.gpx = remote.gpx_track;
        setGpxTrackState(remote.gpx_track);
        await AsyncStorage.setItem(KEY_GPX, JSON.stringify(remote.gpx_track));
      }
      if (remote.itineraire) {
        stateRef.current.it = remote.itineraire;
        setItineraireState(remote.itineraire);
        await AsyncStorage.setItem(KEY_IT, JSON.stringify(remote.itineraire));
      }
      const rNotes = remote.trek_notes ?? {};
      if (Object.keys(rNotes).length > 0) {
        stateRef.current.notes = rNotes;
        setTrekNotesState(rNotes);
        await AsyncStorage.setItem(KEY_NOTES, JSON.stringify(rNotes));
      }
    }
  }, []);

  const traceBbox = useMemo<TraceBbox | null>(() => {
    const pts = gpxTrack?.points;
    if (!pts || pts.length === 0) return null;
    let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
    for (const [lat, lng] of pts) {
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
    }
    return { minLat, maxLat, minLng, maxLng };
  }, [gpxTrack]);

  return (
    <GpxContext.Provider value={{
      gpxTrack, setGpxTrack,
      itineraire, setItineraire,
      traceBbox,
      syncCode, joinSyncCode,
      trekNotes, setTrekNote,
    }}>
      {children}
    </GpxContext.Provider>
  );
}

export function useGpx() {
  return useContext(GpxContext);
}
