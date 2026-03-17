import { Slider } from "@/components/ui/slider";
import { Salad } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLanguage } from "../hooks/useLanguage";
import {
  useGetCallerProfile,
  useGetTodayHealthData,
  useSaveHealthData,
} from "../hooks/useQueries";
import { t } from "../i18n";

const STORAGE_KEY = "livspan-nutrition";

function getTodayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function getTodayKeyPadded() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function loadToday(): { protein: number; veggies: number; water: number } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { protein: 0, veggies: 0, water: 0 };
    const parsed = JSON.parse(raw);
    if (parsed.date !== getTodayKey())
      return { protein: 0, veggies: 0, water: 0 };
    return parsed.values;
  } catch {
    return { protein: 0, veggies: 0, water: 0 };
  }
}

function saveToday(values: {
  protein: number;
  veggies: number;
  water: number;
}) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ date: getTodayKey(), values }),
  );
}

export default function NutritionCard() {
  const { lang } = useLanguage();
  const tr = t[lang];
  const { data: profile } = useGetCallerProfile();

  const weightKg = profile?.weightKg ?? 70;
  const proteinTarget = Math.round(weightKg * 1.8);

  const todayKey = getTodayKeyPadded();
  const { data: backendHealth } = useGetTodayHealthData(todayKey);
  const saveHealth = useSaveHealthData();

  const [values, setValues] = useState(() => loadToday());
  const initializedRef = useRef(false);

  useEffect(() => {
    if (backendHealth && !initializedRef.current) {
      initializedRef.current = true;
      const local = loadToday();
      setValues({
        protein: backendHealth.protein ?? local.protein,
        veggies: backendHealth.veggies ?? local.veggies,
        water: backendHealth.water ?? local.water,
      });
    }
  }, [backendHealth]);

  useEffect(() => {
    saveToday(values);
    const timer = setTimeout(() => {
      saveHealth.mutate({
        date: todayKey,
        protein: values.protein,
        veggies: values.veggies,
        water: values.water,
        sleepDuration: backendHealth?.sleepDuration ?? undefined,
        sleepQuality: backendHealth?.sleepQuality ?? undefined,
        sport: backendHealth?.sport ?? undefined,
        intensity: backendHealth?.intensity ?? undefined,
        movementDuration: backendHealth?.movementDuration ?? undefined,
        systolic: backendHealth?.systolic ?? undefined,
        diastolic: backendHealth?.diastolic ?? undefined,
        restingHr: backendHealth?.restingHr ?? undefined,
        fastingStart: backendHealth?.fastingStart ?? undefined,
        fastingEnd: backendHealth?.fastingEnd ?? undefined,
      });
    }, 800);
    return () => clearTimeout(timer);
    // biome-ignore lint/correctness/useExhaustiveDependencies: backendHealth used for merge only, intentionally stable
    // eslint-disable-next-line
  }, [values, backendHealth, saveHealth, todayKey]);

  const set = (key: "protein" | "veggies" | "water", v: number) =>
    setValues((prev) => ({ ...prev, [key]: v }));

  const proteinPct = Math.min(
    100,
    Math.round((values.protein / proteinTarget) * 100),
  );
  const veggiesPct = Math.min(100, Math.round((values.veggies / 400) * 100));
  const waterPct = Math.min(100, Math.round((values.water / 2) * 100));

  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-xl bg-green-accent/15 flex items-center justify-center text-green-accent shrink-0">
          <Salad className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-display font-semibold text-sm text-foreground">
            {tr.nutrition_title}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {tr.nutrition_desc}
          </p>
        </div>
      </div>

      <div className="space-y-5">
        {/* Protein */}
        <div>
          <div className="flex justify-between items-baseline mb-2">
            <span className="text-xs font-medium text-foreground">
              {tr.nutrition_protein}
            </span>
            <span className="text-xs text-muted-foreground">
              <span
                className={`font-semibold ${
                  proteinPct >= 100 ? "text-green-accent" : "text-foreground"
                }`}
              >
                {values.protein}g
              </span>
              {" / "}
              {proteinTarget}g
            </span>
          </div>
          <Slider
            min={0}
            max={proteinTarget * 1.5}
            step={1}
            value={[values.protein]}
            onValueChange={([v]) => set("protein", v)}
            className="w-full"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            <span>0g</span>
            <span className="text-green-accent/70">
              {tr.nutrition_goal}: {proteinTarget}g
            </span>
          </div>
        </div>

        {/* Vegetables */}
        <div>
          <div className="flex justify-between items-baseline mb-2">
            <span className="text-xs font-medium text-foreground">
              {tr.nutrition_veggies}
            </span>
            <span className="text-xs text-muted-foreground">
              <span
                className={`font-semibold ${
                  veggiesPct >= 100 ? "text-green-accent" : "text-foreground"
                }`}
              >
                {values.veggies}g
              </span>
              {" / 400g"}
            </span>
          </div>
          <Slider
            min={0}
            max={600}
            step={10}
            value={[values.veggies]}
            onValueChange={([v]) => set("veggies", v)}
            className="w-full"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            <span>0g</span>
            <span className="text-green-accent/70">
              {tr.nutrition_goal}: 400g
            </span>
          </div>
        </div>

        {/* Water */}
        <div>
          <div className="flex justify-between items-baseline mb-2">
            <span className="text-xs font-medium text-foreground">
              {tr.nutrition_water}
            </span>
            <span className="text-xs text-muted-foreground">
              <span
                className={`font-semibold ${
                  values.water >= 2 ? "text-green-accent" : "text-foreground"
                }`}
              >
                {values.water.toFixed(1)}L
              </span>
              {" / min. 2L"}
            </span>
          </div>
          <Slider
            min={0}
            max={4}
            step={0.1}
            value={[values.water]}
            onValueChange={([v]) =>
              set("water", Number.parseFloat(v.toFixed(1)))
            }
            className="w-full"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            <span>0L</span>
            <span className="text-green-accent/70">
              {tr.nutrition_goal}: 2L
            </span>
          </div>
        </div>

        {/* Progress summary */}
        <div className="pt-1 border-t border-border/30 grid grid-cols-3 gap-2 text-center">
          <ProgressDot pct={proteinPct} label={tr.nutrition_protein_short} />
          <ProgressDot pct={veggiesPct} label={tr.nutrition_veggies_short} />
          <ProgressDot pct={waterPct} label={tr.nutrition_water_short} />
        </div>
      </div>
    </div>
  );
}

function ProgressDot({ pct, label }: { pct: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-8 h-8">
        <svg
          viewBox="0 0 32 32"
          className="w-full h-full -rotate-90"
          role="img"
          aria-label={label}
        >
          <circle
            cx="16"
            cy="16"
            r="13"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            className="text-border/40"
          />
          <circle
            cx="16"
            cy="16"
            r="13"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeDasharray={`${2 * Math.PI * 13}`}
            strokeDashoffset={`${2 * Math.PI * 13 * (1 - pct / 100)}`}
            className={pct >= 100 ? "text-green-accent" : "text-gold"}
            strokeLinecap="round"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-foreground">
          {pct}%
        </span>
      </div>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  );
}
