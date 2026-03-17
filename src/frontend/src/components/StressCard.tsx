import { Slider } from "@/components/ui/slider";
import { HeartPulse } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLanguage } from "../hooks/useLanguage";
import { useGetTodayHealthData, useSaveHealthData } from "../hooks/useQueries";
import { t } from "../i18n";

const STORAGE_KEY = "livspan-stress";

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

function loadToday(): {
  systolic: number;
  diastolic: number;
  restingHr: number;
} {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { systolic: 120, diastolic: 80, restingHr: 65 };
    const parsed = JSON.parse(raw);
    if (parsed.date !== getTodayKey())
      return { systolic: 120, diastolic: 80, restingHr: 65 };
    return parsed.values;
  } catch {
    return { systolic: 120, diastolic: 80, restingHr: 65 };
  }
}

function saveToday(values: {
  systolic: number;
  diastolic: number;
  restingHr: number;
}) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ date: getTodayKey(), values }),
  );
}

function bpCategory(systolic: number, diastolic: number, lang: "de" | "en") {
  if (systolic < 120 && diastolic < 80)
    return lang === "de" ? "Optimal" : "Optimal";
  if (systolic < 130 && diastolic < 80)
    return lang === "de" ? "Normal" : "Normal";
  if (systolic < 140 || diastolic < 90)
    return lang === "de" ? "Erhöht" : "Elevated";
  return lang === "de" ? "Hoch" : "High";
}

function bpColor(systolic: number, diastolic: number) {
  if (systolic < 120 && diastolic < 80) return "text-green-accent";
  if (systolic < 130 && diastolic < 80) return "text-green-accent";
  if (systolic < 140 || diastolic < 90) return "text-yellow-400";
  return "text-red-400";
}

function hrCategory(hr: number, lang: "de" | "en") {
  if (hr < 50) return lang === "de" ? "Athletisch" : "Athletic";
  if (hr < 60) return lang === "de" ? "Sehr gut" : "Excellent";
  if (hr < 70) return lang === "de" ? "Gut" : "Good";
  if (hr < 80) return lang === "de" ? "Normal" : "Normal";
  return lang === "de" ? "Erhöht" : "Elevated";
}

function hrColor(hr: number) {
  if (hr < 70) return "text-green-accent";
  if (hr < 80) return "text-yellow-400";
  return "text-red-400";
}

export default function StressCard() {
  const { lang } = useLanguage();
  const tr = t[lang];

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
        systolic: backendHealth.systolic ?? local.systolic,
        diastolic: backendHealth.diastolic ?? local.diastolic,
        restingHr: backendHealth.restingHr ?? local.restingHr,
      });
    }
  }, [backendHealth]);

  useEffect(() => {
    saveToday(values);
    const timer = setTimeout(() => {
      saveHealth.mutate({
        date: todayKey,
        systolic: values.systolic,
        diastolic: values.diastolic,
        restingHr: values.restingHr,
        sleepDuration: backendHealth?.sleepDuration ?? undefined,
        sleepQuality: backendHealth?.sleepQuality ?? undefined,
        protein: backendHealth?.protein ?? undefined,
        veggies: backendHealth?.veggies ?? undefined,
        water: backendHealth?.water ?? undefined,
        sport: backendHealth?.sport ?? undefined,
        intensity: backendHealth?.intensity ?? undefined,
        movementDuration: backendHealth?.movementDuration ?? undefined,
        fastingStart: backendHealth?.fastingStart ?? undefined,
        fastingEnd: backendHealth?.fastingEnd ?? undefined,
      });
    }, 800);
    return () => clearTimeout(timer);
    // biome-ignore lint/correctness/useExhaustiveDependencies: backendHealth used for merge only, intentionally stable
    // eslint-disable-next-line
  }, [values, backendHealth, saveHealth, todayKey]);

  const set = (key: "systolic" | "diastolic" | "restingHr", v: number) =>
    setValues((prev) => ({ ...prev, [key]: v }));

  const bpColorClass = bpColor(values.systolic, values.diastolic);
  const hrColorClass = hrColor(values.restingHr);

  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-xl bg-rose-500/15 flex items-center justify-center text-rose-400 shrink-0">
          <HeartPulse className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-display font-semibold text-sm text-foreground">
            {tr.stress_title}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {tr.stress_desc}
          </p>
        </div>
      </div>

      <div className="space-y-5">
        {/* Systolic */}
        <div>
          <div className="flex justify-between items-baseline mb-2">
            <span className="text-xs font-medium text-foreground">
              {tr.stress_systolic}
            </span>
            <span className="text-xs text-muted-foreground">
              <span className={`font-semibold ${bpColorClass}`}>
                {values.systolic} mmHg
              </span>
            </span>
          </div>
          <Slider
            min={80}
            max={200}
            step={1}
            value={[values.systolic]}
            onValueChange={([v]) => set("systolic", v)}
            className="w-full"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            <span>80</span>
            <span className="text-rose-400/70">
              {tr.stress_bp_target}: &lt;120
            </span>
            <span>200</span>
          </div>
        </div>

        {/* Diastolic */}
        <div>
          <div className="flex justify-between items-baseline mb-2">
            <span className="text-xs font-medium text-foreground">
              {tr.stress_diastolic}
            </span>
            <span className="text-xs text-muted-foreground">
              <span className={`font-semibold ${bpColorClass}`}>
                {values.diastolic} mmHg
              </span>
              {" – "}
              <span className={bpColorClass}>
                {bpCategory(values.systolic, values.diastolic, lang)}
              </span>
            </span>
          </div>
          <Slider
            min={50}
            max={130}
            step={1}
            value={[values.diastolic]}
            onValueChange={([v]) => set("diastolic", v)}
            className="w-full"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            <span>50</span>
            <span className="text-rose-400/70">
              {tr.stress_bp_target}: &lt;80
            </span>
            <span>130</span>
          </div>
        </div>

        {/* Resting Heart Rate */}
        <div>
          <div className="flex justify-between items-baseline mb-2">
            <span className="text-xs font-medium text-foreground">
              {tr.stress_resting_hr}
            </span>
            <span className="text-xs text-muted-foreground">
              <span className={`font-semibold ${hrColorClass}`}>
                {values.restingHr} bpm
              </span>
              {" – "}
              <span className={hrColorClass}>
                {hrCategory(values.restingHr, lang)}
              </span>
            </span>
          </div>
          <Slider
            min={30}
            max={120}
            step={1}
            value={[values.restingHr]}
            onValueChange={([v]) => set("restingHr", v)}
            className="w-full"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            <span>30</span>
            <span className="text-rose-400/70">
              {tr.stress_hr_target}: 50–70
            </span>
            <span>120</span>
          </div>
        </div>

        {/* Summary row */}
        <div className="pt-1 border-t border-border/30 flex items-center justify-between">
          <div className="text-center">
            <p className={`text-sm font-bold ${bpColorClass}`}>
              {values.systolic}/{values.diastolic}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {tr.stress_bp_short}
            </p>
          </div>
          <div className="w-px h-8 bg-border/30" />
          <div className="text-center">
            <p className={`text-sm font-bold ${hrColorClass}`}>
              {values.restingHr} bpm
            </p>
            <p className="text-[10px] text-muted-foreground">
              {tr.stress_hr_short}
            </p>
          </div>
          <div className="w-px h-8 bg-border/30" />
          <div className="text-center">
            <p className={`text-xs font-semibold ${bpColorClass}`}>
              {bpCategory(values.systolic, values.diastolic, lang)}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {tr.stress_status}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
