import { Slider } from "@/components/ui/slider";
import { Dumbbell } from "lucide-react";
import { useEffect, useState } from "react";
import { useLanguage } from "../hooks/useLanguage";
import { t } from "../i18n";

const STORAGE_KEY = "livspan-movement";

function getTodayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

type SportKey =
  | "running"
  | "cycling"
  | "swimming"
  | "gym"
  | "yoga"
  | "hiking"
  | "other";

interface MovementValues {
  sport: SportKey;
  intensity: number;
  duration: number;
}

const DEFAULTS: MovementValues = {
  sport: "running",
  intensity: 5,
  duration: 30,
};

function loadToday(): MovementValues {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw);
    if (parsed.date !== getTodayKey()) return { ...DEFAULTS };
    return parsed.values;
  } catch {
    return { ...DEFAULTS };
  }
}

function saveToday(values: MovementValues) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ date: getTodayKey(), values }),
  );
}

function intensityColor(intensity: number) {
  if (intensity <= 3) return "text-green-accent";
  if (intensity <= 6) return "text-yellow-400";
  if (intensity <= 9) return "text-orange-400";
  return "text-red-400";
}

function durationColor(duration: number) {
  if (duration >= 30) return "text-green-accent";
  if (duration >= 15) return "text-yellow-400";
  return "text-muted-foreground";
}

export default function MovementCard() {
  const { lang } = useLanguage();
  const tr = t[lang];

  const [values, setValues] = useState<MovementValues>(() => loadToday());

  useEffect(() => {
    saveToday(values);
  }, [values]);

  const set = <K extends keyof MovementValues>(key: K, v: MovementValues[K]) =>
    setValues((prev) => ({ ...prev, [key]: v }));

  const sportOptions: { value: SportKey; label: string }[] = [
    { value: "running", label: tr.movement_sport_running },
    { value: "cycling", label: tr.movement_sport_cycling },
    { value: "swimming", label: tr.movement_sport_swimming },
    { value: "gym", label: tr.movement_sport_gym },
    { value: "yoga", label: tr.movement_sport_yoga },
    { value: "hiking", label: tr.movement_sport_hiking },
    { value: "other", label: tr.movement_sport_other },
  ];

  const intensityLabel = () => {
    if (values.intensity <= 3) return tr.movement_status_low;
    if (values.intensity <= 6) return tr.movement_status_moderate;
    if (values.intensity <= 9) return tr.movement_status_high;
    return tr.movement_status_max;
  };

  const currentSportLabel =
    sportOptions.find((o) => o.value === values.sport)?.label ?? values.sport;

  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-xl bg-blue-500/15 flex items-center justify-center text-blue-400 shrink-0">
          <Dumbbell className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-display font-semibold text-sm text-foreground">
            {tr.movement_title}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {tr.movement_desc}
          </p>
        </div>
      </div>

      <div className="space-y-5">
        {/* Sport select */}
        <div>
          <div className="flex justify-between items-baseline mb-2">
            <span className="text-xs font-medium text-foreground">
              {tr.movement_sport}
            </span>
            <span className="text-xs font-semibold text-blue-400">
              {currentSportLabel}
            </span>
          </div>
          <select
            value={values.sport}
            onChange={(e) => set("sport", e.target.value as SportKey)}
            className="w-full rounded-lg border border-border/50 bg-muted/40 text-foreground text-xs px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-400/50 transition-colors"
            data-ocid="movement.select"
          >
            {sportOptions.map((opt) => (
              <option
                key={opt.value}
                value={opt.value}
                className="bg-background text-foreground"
              >
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Intensity slider */}
        <div>
          <div className="flex justify-between items-baseline mb-2">
            <span className="text-xs font-medium text-foreground">
              {tr.movement_intensity}
            </span>
            <span className="text-xs text-muted-foreground">
              <span
                className={`font-semibold ${intensityColor(values.intensity)}`}
              >
                {values.intensity}/10
              </span>
              {" – "}
              <span className={intensityColor(values.intensity)}>
                {intensityLabel()}
              </span>
            </span>
          </div>
          <Slider
            min={1}
            max={10}
            step={1}
            value={[values.intensity]}
            onValueChange={([v]) => set("intensity", v)}
            className="w-full"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            <span>1</span>
            <span className="text-blue-400/70">
              {tr.movement_status_low} → {tr.movement_status_max}
            </span>
            <span>10</span>
          </div>
        </div>

        {/* Duration slider */}
        <div>
          <div className="flex justify-between items-baseline mb-2">
            <span className="text-xs font-medium text-foreground">
              {tr.movement_duration}
            </span>
            <span
              className={`text-xs font-semibold ${durationColor(values.duration)}`}
            >
              {values.duration} min
            </span>
          </div>
          <Slider
            min={0}
            max={180}
            step={5}
            value={[values.duration]}
            onValueChange={([v]) => set("duration", v)}
            className="w-full"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            <span>0</span>
            <span className="text-blue-400/70">Ziel: ≥30 min</span>
            <span>180</span>
          </div>
        </div>

        {/* Summary row */}
        <div className="pt-1 border-t border-border/30 flex items-center justify-between">
          <div className="text-center">
            <p className="text-sm font-bold text-blue-400">
              {currentSportLabel}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {tr.movement_sport_short}
            </p>
          </div>
          <div className="w-px h-8 bg-border/30" />
          <div className="text-center">
            <p
              className={`text-sm font-bold ${intensityColor(values.intensity)}`}
            >
              {values.intensity}/10
            </p>
            <p className="text-[10px] text-muted-foreground">
              {tr.movement_intensity_short}
            </p>
          </div>
          <div className="w-px h-8 bg-border/30" />
          <div className="text-center">
            <p
              className={`text-sm font-bold ${durationColor(values.duration)}`}
            >
              {values.duration} min
            </p>
            <p className="text-[10px] text-muted-foreground">
              {tr.movement_duration_short}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
