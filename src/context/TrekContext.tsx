import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ETAPES } from '../data/etapes';

// ─── Types ────────────────────────────────────────────────────────────────────

export type HebergType = 'refuge' | 'bivouac' | 'camping' | 'gite' | 'village' | 'libre';

export interface TrekHebergement {
  type: HebergType | null;
  id: number | null;
  nom: string;
  confirmed: boolean;
}

export interface TrekJour {
  date: string; // ISO "2025-07-15"
  etapeId: number;
  hebergement: TrekHebergement;
  notes: string;
}

export interface TrekPlan {
  nom: string;
  dateDebut: string;
  jours: TrekJour[];
}

// ─── Storage key ──────────────────────────────────────────────────────────────

const STORAGE_KEY = 'trek_plan_v1';

// ─── Helper: build a plan ─────────────────────────────────────────────────────

export function buildTrekPlan(
  fromEtapeIdx: number,
  toEtapeIdx: number,
  dateDebut: string,
): TrekPlan {
  const start = Math.min(fromEtapeIdx, toEtapeIdx);
  const end = Math.max(fromEtapeIdx, toEtapeIdx);

  const jours: TrekJour[] = [];
  for (let i = start; i <= end; i++) {
    const etape = ETAPES[i];
    if (!etape) continue;

    const date = new Date(dateDebut);
    date.setDate(date.getDate() + (i - start));
    const iso = date.toISOString().slice(0, 10);

    jours.push({
      date: iso,
      etapeId: etape.id,
      hebergement: {
        type: null,
        id: null,
        nom: 'Hébergement à définir',
        confirmed: false,
      },
      notes: '',
    });
  }

  const firstEtape = ETAPES[start];
  const lastEtape = ETAPES[end];
  const nom =
    firstEtape && lastEtape
      ? `GR10 · ${firstEtape.depart} → ${lastEtape.arrivee}`
      : 'Mon Trek GR10';

  return { nom, dateDebut, jours };
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface TrekContextValue {
  trekPlan: TrekPlan | null;
  setTrekPlan: (plan: TrekPlan | null) => void;
  updateJour: (etapeId: number, updates: Partial<TrekJour>) => void;
}

const TrekContext = createContext<TrekContextValue>({
  trekPlan: null,
  setTrekPlan: () => {},
  updateJour: () => {},
});

export function TrekProvider({ children }: { children: React.ReactNode }) {
  const [trekPlan, setTrekPlanState] = useState<TrekPlan | null>(null);

  // Load from AsyncStorage on mount
  useEffect(() => {
    (AsyncStorage as any).getItem(STORAGE_KEY).then((raw: string | null) => {
      if (raw) {
        try {
          const parsed: TrekPlan = JSON.parse(raw);
          setTrekPlanState(parsed);
        } catch {}
      }
    });
  }, []);

  const setTrekPlan = useCallback((plan: TrekPlan | null) => {
    setTrekPlanState(plan);
    if (plan) {
      (AsyncStorage as any).setItem(STORAGE_KEY, JSON.stringify(plan));
    } else {
      (AsyncStorage as any).removeItem(STORAGE_KEY);
    }
  }, []);

  const updateJour = useCallback(
    (etapeId: number, updates: Partial<TrekJour>) => {
      setTrekPlanState((prev) => {
        if (!prev) return prev;
        const jours = prev.jours.map((j) =>
          j.etapeId === etapeId ? { ...j, ...updates } : j,
        );
        const updated: TrekPlan = { ...prev, jours };
        (AsyncStorage as any).setItem(STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });
    },
    [],
  );

  return (
    <TrekContext.Provider value={{ trekPlan, setTrekPlan, updateJour }}>
      {children}
    </TrekContext.Provider>
  );
}

export function useTrek() {
  return useContext(TrekContext);
}
