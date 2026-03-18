import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "livspan-daily-card-checks";

export type CardKey =
  | "sleep"
  | "nutrition"
  | "movement"
  | "stress"
  | "fasting"
  | "diary";

interface CheckState {
  date: string;
  checked: Record<string, boolean>;
}

function getTodayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function load(): CheckState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { date: getTodayStr(), checked: {} };
    const parsed: CheckState = JSON.parse(raw);
    if (parsed.date !== getTodayStr())
      return { date: getTodayStr(), checked: {} };
    return parsed;
  } catch {
    return { date: getTodayStr(), checked: {} };
  }
}

export function useDailyCardChecks() {
  const [state, setState] = useState<CheckState>(load);

  useEffect(() => {
    const interval = setInterval(() => {
      const today = getTodayStr();
      if (state.date !== today) {
        const fresh = { date: today, checked: {} };
        setState(fresh);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
      }
    }, 60_000);
    return () => clearInterval(interval);
  }, [state.date]);

  const toggle = useCallback((key: CardKey) => {
    setState((prev) => {
      const today = getTodayStr();
      const base = prev.date === today ? prev : { date: today, checked: {} };
      const next = {
        ...base,
        checked: { ...base.checked, [key]: !base.checked[key] },
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const isChecked = useCallback(
    (key: CardKey) => !!state.checked[key],
    [state],
  );

  return { toggle, isChecked };
}
