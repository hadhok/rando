import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GpxTrack } from '../utils/gpxParser';

const STORAGE_KEY = 'gpx_track_v1';

interface GpxContextValue {
  gpxTrack: GpxTrack | null;
  setGpxTrack: (track: GpxTrack | null) => void;
}

const GpxContext = createContext<GpxContextValue>({
  gpxTrack: null,
  setGpxTrack: () => {},
});

export function GpxProvider({ children }: { children: React.ReactNode }) {
  const [gpxTrack, setGpxTrackState] = useState<GpxTrack | null>(null);

  // Restore persisted track on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((json) => {
      if (json) {
        try {
          setGpxTrackState(JSON.parse(json));
        } catch {}
      }
    });
  }, []);

  const setGpxTrack = useCallback((track: GpxTrack | null) => {
    setGpxTrackState(track);
    if (track) {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(track));
    } else {
      AsyncStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  return (
    <GpxContext.Provider value={{ gpxTrack, setGpxTrack }}>
      {children}
    </GpxContext.Provider>
  );
}

export function useGpx() {
  return useContext(GpxContext);
}
