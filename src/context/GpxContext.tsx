import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GpxTrack } from '../utils/gpxParser';
import { Itineraire } from '../utils/itineraireParser';

const KEY_GPX  = 'gpx_track_v2';
const KEY_IT   = 'itineraire_v1';
const KEY_CODE = 'sync_code_v1';

// ─── Supabase sync (raw fetch — no SDK dependency) ────────────────────────────
// Table SQL (run once in Supabase dashboard):
//   create table rando_sync (
//     code text primary key,
//     gpx_track jsonb, itineraire jsonb,
//     updated_at timestamptz default now()
//   );
//   alter table rando_sync enable row level security;
//   create policy "anon_all" on rando_sync for all using (true) with check (true);

const SB_URL = 'https://zodywxrnyaiviuahxuvw.supabase.co';
const SB_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvZHl3eHJueWFpdml1YWh4dXZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5MDUzMzMsImV4cCI6MjA5NTQ4MTMzM30.ZiqmEIg1Xfq70qTwiIw3N58LAoP540J3Bo8inCqUCuk';
const TABLE = `${SB_URL}/rest/v1/rando_sync`;
const SB_H = {
  apikey: SB_KEY,
  Authorization: `Bearer ${SB_KEY}`,
  'Content-Type': 'application/json',
};

function generateCode(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

async function sbPush(code: string, gpx: GpxTrack | null, it: Itineraire | null) {
  try {
    await fetch(`${TABLE}?on_conflict=code`, {
      method: 'POST',
      headers: { ...SB_H, Prefer: 'resolution=merge-duplicates' },
      body: JSON.stringify({ code, gpx_track: gpx, itineraire: it, updated_at: new Date().toISOString() }),
    });
  } catch {}
}

async function sbPull(code: string): Promise<{ gpx_track: GpxTrack | null; itineraire: Itineraire | null } | null> {
  try {
    const res = await fetch(`${TABLE}?code=eq.${code}&select=gpx_track,itineraire`, { headers: SB_H });
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
  const BUF = 0.09; // ≈ 10 km
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
}

const GpxContext = createContext<GpxContextValue>({
  gpxTrack: null,
  setGpxTrack: () => {},
  itineraire: null,
  setItineraire: () => {},
  traceBbox: null,
  syncCode: '',
  joinSyncCode: async () => {},
});

export function GpxProvider({ children }: { children: React.ReactNode }) {
  const [gpxTrack, setGpxTrackState]     = useState<GpxTrack | null>(null);
  const [itineraire, setItineraireState] = useState<Itineraire | null>(null);
  const [syncCode, setSyncCode]          = useState('');

  // Refs so callbacks always see the latest values without stale closures
  const syncCodeRef   = useRef('');
  const stateRef      = useRef({ gpx: null as GpxTrack | null, it: null as Itineraire | null });

  useEffect(() => {
    AsyncStorage.multiGet([KEY_GPX, KEY_IT, KEY_CODE]).then(async (pairs) => {
      const [gpxPair, itPair, codePair] = pairs;

      let localGpx: GpxTrack | null = null;
      let localIt: Itineraire | null = null;
      if (gpxPair[1]) { try { localGpx = JSON.parse(gpxPair[1]); } catch {} }
      if (itPair[1])  { try { localIt  = JSON.parse(itPair[1]);  } catch {} }

      // Show local data immediately
      if (localGpx) { stateRef.current.gpx = localGpx; setGpxTrackState(localGpx); }
      if (localIt)  { stateRef.current.it  = localIt;  setItineraireState(localIt); }

      // Resolve sync code
      let code = codePair[1] ?? '';
      if (!code) {
        code = generateCode();
        await AsyncStorage.setItem(KEY_CODE, code);
      }
      syncCodeRef.current = code;
      setSyncCode(code);

      // Pull from Supabase in background (Supabase wins if data exists)
      const remote = await sbPull(code);
      if (remote) {
        const rGpx = remote.gpx_track;
        const rIt  = remote.itineraire;
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
        // If Supabase row exists but is empty, push local data
        if (!rGpx && !rIt && (localGpx || localIt)) {
          sbPush(code, localGpx, localIt);
        }
      } else if (localGpx || localIt) {
        // No remote row yet — seed it from local
        sbPush(code, localGpx, localIt);
      }
    });
  }, []);

  const setGpxTrack = useCallback((track: GpxTrack | null) => {
    stateRef.current.gpx = track;
    setGpxTrackState(track);
    track
      ? AsyncStorage.setItem(KEY_GPX, JSON.stringify(track))
      : AsyncStorage.removeItem(KEY_GPX);
    if (syncCodeRef.current) sbPush(syncCodeRef.current, track, stateRef.current.it);
  }, []);

  const setItineraire = useCallback((it: Itineraire | null) => {
    stateRef.current.it = it;
    setItineraireState(it);
    it
      ? AsyncStorage.setItem(KEY_IT, JSON.stringify(it))
      : AsyncStorage.removeItem(KEY_IT);
    if (syncCodeRef.current) sbPush(syncCodeRef.current, stateRef.current.gpx, it);
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
    <GpxContext.Provider value={{ gpxTrack, setGpxTrack, itineraire, setItineraire, traceBbox, syncCode, joinSyncCode }}>
      {children}
    </GpxContext.Provider>
  );
}

export function useGpx() {
  return useContext(GpxContext);
}
