"use client";

import { useState, useCallback } from "react";
import type { GameId } from "@/lib/game-config";

export interface SavedPick {
  id: string;
  game: GameId;
  label: string;
  source: string; // strategy ID or method ID
  mainNumbers: number[];
  powerball?: number | null;
  supplementaryNumbers?: number[] | null;
  savedAt: string; // ISO timestamp
}

const STORAGE_KEY = "lotto-saved-picks";

function loadFromStorage(): SavedPick[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function saveToStorage(picks: SavedPick[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(picks));
  } catch {
    // ignore quota / serialization errors
  }
}

export function useSavedPicks() {
  // Lazy initializer — reads localStorage once on the client; SSR-safe
  // (returns [] on server, hydrates from localStorage on first client render).
  const [picks, setPicks] = useState<SavedPick[]>(() => loadFromStorage());

  const savePick = useCallback((pick: Omit<SavedPick, "id" | "savedAt">) => {
    const newPick: SavedPick = {
      ...pick,
      id: `pick-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      savedAt: new Date().toISOString(),
    };
    setPicks((prev) => {
      const updated = [newPick, ...prev];
      saveToStorage(updated);
      return updated;
    });
    return newPick;
  }, []);

  const deletePick = useCallback((id: string) => {
    setPicks((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      saveToStorage(updated);
      return updated;
    });
  }, []);

  const clearAll = useCallback(() => {
    setPicks([]);
    saveToStorage([]);
  }, []);

  const clearGame = useCallback((game: GameId) => {
    setPicks((prev) => {
      const updated = prev.filter((p) => p.game !== game);
      saveToStorage(updated);
      return updated;
    });
  }, []);

  return { picks, savePick, deletePick, clearAll, clearGame };
}
