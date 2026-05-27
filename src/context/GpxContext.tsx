import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GpxTrack } from '../utils/gpxParser';
import { Itineraire } from '../utils/itineraireParser';

const KEY_GPX = 'gpx_track_v1';
const KEY_IT  = 'itineraire_v1';

interface GpxContextValue {
  gpxTrack: GpxTrack | null;
  setGpxTrack: (track: GpxTrack | null) => void;
  itineraire: Itineraire | null;
  setItineraire: (it: Itineraire | null) => void;
}

const GpxContext = createContext<GpxContextValue>({
  gpxTrack: null,
  setGpxTrack: () => {},
  itineraire: null,
  setItineraire: () => {},
});

export function GpxProvider({ children }: { children: React.ReactNode }) {
  const [gpxTrack, setGpxTrackState]     = useState<GpxTrack | null>(null);
  const [itineraire, setItineraireState] = useState<Itineraire | null>(null);

  useEffect(() => {
    AsyncStorage.multiGet([KEY_GPX, KEY_IT]).then((pairs) => {
      const [gpxPair, itPair] = pairs;
      if (gpxPair[1]) { try { setGpxTrackState(JSON.parse(gpxPair[1])); } catch {} }
      if (itPair[1])  { try { setItineraireState(JSON.parse(itPair[1])); } catch {} }
    });
  }, []);

  const setGpxTrack = useCallback((track: GpxTrack | null) => {
    setGpxTrackState(track);
    track
      ? AsyncStorage.setItem(KEY_GPX, JSON.stringify(track))
      : AsyncStorage.removeItem(KEY_GPX);
  }, []);

  const setItineraire = useCallback((it: Itineraire | null) => {
    setItineraireState(it);
    it
      ? AsyncStorage.setItem(KEY_IT, JSON.stringify(it))
      : AsyncStorage.removeItem(KEY_IT);
  }, []);

  return (
    <GpxContext.Provider value={{ gpxTrack, setGpxTrack, itineraire, setItineraire }}>
      {children}
    </GpxContext.Provider>
  );
}

export function useGpx() {
  return useContext(GpxContext);
}
