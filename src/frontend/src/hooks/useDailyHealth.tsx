import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { DailyHealthData } from "../backend.d";
import { useActor } from "./useActor";

// ---------- types ----------

export interface DailyHealthState {
  sleepDuration: number;
  sleepQuality: number;
  protein: number;
  veggies: number;
  water: number;
  sport: string;
  intensity: number;
  movementDuration: number;
  systolic: number;
  diastolic: number;
  restingHr: number;
  fastingStart: string | null;
  fastingEnd: string | null;
}

interface DailyHealthContextValue {
  health: DailyHealthState;
  setHealth: (patch: Partial<DailyHealthState>) => void;
  isLoaded: boolean;
  todayStr: string;
}

// ---------- defaults ----------

const EMPTY: DailyHealthState = {
  sleepDuration: 0,
  sleepQuality: 0,
  protein: 0,
  veggies: 0,
  water: 0,
  sport: "running",
  intensity: 5,
  movementDuration: 0,
  systolic: 0,
  diastolic: 0,
  restingHr: 0,
  fastingStart: null,
  fastingEnd: null,
};

// ---------- helpers ----------

function getTodayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function fromBackend(data: DailyHealthData): DailyHealthState {
  return {
    sleepDuration: data.sleepDuration ?? 0,
    sleepQuality: data.sleepQuality ?? 0,
    protein: data.protein ?? 0,
    veggies: data.veggies ?? 0,
    water: data.water ?? 0,
    sport: data.sport ?? "running",
    intensity: data.intensity ?? 5,
    movementDuration: data.movementDuration ?? 0,
    systolic: data.systolic ?? 0,
    diastolic: data.diastolic ?? 0,
    restingHr: data.restingHr ?? 0,
    fastingStart: data.fastingStart ?? null,
    fastingEnd: data.fastingEnd ?? null,
  };
}

/** Write legacy localStorage keys so LongevityScoreCard still works */
function syncLocalStorage(h: DailyHealthState, dateKey: string) {
  // Sleep
  localStorage.setItem(
    "livspan-sleep",
    JSON.stringify({
      date: dateKey,
      values: { duration: h.sleepDuration, quality: h.sleepQuality },
    }),
  );
  // Nutrition
  localStorage.setItem(
    "livspan-nutrition",
    JSON.stringify({
      date: dateKey,
      values: { protein: h.protein, veggies: h.veggies, water: h.water },
    }),
  );
  // Stress
  localStorage.setItem(
    "livspan-stress",
    JSON.stringify({
      date: dateKey,
      values: {
        systolic: h.systolic,
        diastolic: h.diastolic,
        restingHr: h.restingHr,
      },
    }),
  );
  // Movement
  localStorage.setItem(
    "livspan-movement",
    JSON.stringify({
      date: dateKey,
      values: {
        sport: h.sport,
        intensity: h.intensity,
        duration: h.movementDuration,
      },
    }),
  );
  // Fasting
  if (h.fastingStart && h.fastingEnd) {
    localStorage.setItem(
      "livspan-fasting",
      JSON.stringify({ startTime: h.fastingStart, endTime: h.fastingEnd }),
    );
  } else {
    localStorage.removeItem("livspan-fasting");
  }
  window.dispatchEvent(new CustomEvent("livspan-data-updated"));
}

// ---------- context ----------

const DailyHealthCtx = createContext<DailyHealthContextValue>({
  health: EMPTY,
  setHealth: () => {},
  isLoaded: false,
  todayStr: getTodayStr(),
});

export function DailyHealthProvider({
  children,
}: { children: React.ReactNode }) {
  const { actor, isFetching } = useActor();
  const [todayStr, setTodayStr] = useState(getTodayStr);
  const [health, setHealthRaw] = useState<DailyHealthState>(EMPTY);
  const [isLoaded, setIsLoaded] = useState(false);
  const hydratedRef = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const healthRef = useRef<DailyHealthState>(health);
  healthRef.current = health;

  // ---------- load from backend ----------
  useEffect(() => {
    if (!actor || isFetching || hydratedRef.current) return;
    (async () => {
      try {
        const data = await actor.getDailyHealthData(todayStr);
        if (data) {
          const loaded = fromBackend(data);
          setHealthRaw(loaded);
          syncLocalStorage(loaded, todayStr);
        }
      } catch {
        // silently ignore load errors
      } finally {
        hydratedRef.current = true;
        setIsLoaded(true);
      }
    })();
  }, [actor, isFetching, todayStr]);

  // ---------- debounced auto-save ----------
  const scheduleSave = useCallback(
    (state: DailyHealthState, date: string) => {
      if (!actor) return;
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(async () => {
        try {
          await actor.saveDailyHealthData(
            date,
            state.sleepDuration || null,
            state.sleepQuality || null,
            state.protein || null,
            state.veggies || null,
            state.water || null,
            state.sport || null,
            state.intensity || null,
            state.movementDuration || null,
            state.systolic || null,
            state.diastolic || null,
            state.restingHr || null,
            state.fastingStart,
            state.fastingEnd,
          );
        } catch {
          // silently ignore save errors
        }
      }, 800);
    },
    [actor],
  );

  // ---------- setHealth (used by cards) ----------
  const setHealth = useCallback(
    (patch: Partial<DailyHealthState>) => {
      setHealthRaw((prev) => {
        const next = { ...prev, ...patch };
        syncLocalStorage(next, todayStr);
        scheduleSave(next, todayStr);
        return next;
      });
    },
    [todayStr, scheduleSave],
  );

  // ---------- midnight reset ----------
  useEffect(() => {
    const check = () => {
      const current = getTodayStr();
      if (current === todayStr) return;
      // New day!
      setTodayStr(current);
      hydratedRef.current = false;
      const fresh = { ...EMPTY };
      setHealthRaw(fresh);
      setIsLoaded(false);
      syncLocalStorage(fresh, current);
      // Save blank data for new day
      if (actor) {
        actor
          .saveDailyHealthData(
            current,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
          )
          .catch(() => {});
      }
    };

    const interval = setInterval(check, 60_000);
    const handleVisibility = () => {
      if (document.visibilityState === "visible") check();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [todayStr, actor]);

  return (
    <DailyHealthCtx.Provider value={{ health, setHealth, isLoaded, todayStr }}>
      {children}
    </DailyHealthCtx.Provider>
  );
}

export function useDailyHealth() {
  return useContext(DailyHealthCtx);
}
