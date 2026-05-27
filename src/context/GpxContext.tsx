import React, { createContext, useContext, useState } from 'react';
import { GpxTrack } from '../utils/gpxParser';

interface GpxContextValue {
  gpxTrack: GpxTrack | null;
  setGpxTrack: (track: GpxTrack | null) => void;
}

const GpxContext = createContext<GpxContextValue>({
  gpxTrack: null,
  setGpxTrack: () => {},
});

export function GpxProvider({ children }: { children: React.ReactNode }) {
  const [gpxTrack, setGpxTrack] = useState<GpxTrack | null>(null);
  return (
    <GpxContext.Provider value={{ gpxTrack, setGpxTrack }}>
      {children}
    </GpxContext.Provider>
  );
}

export function useGpx() {
  return useContext(GpxContext);
}
