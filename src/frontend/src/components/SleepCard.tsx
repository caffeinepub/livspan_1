import { Slider } from "@/components/ui/slider";
import { Moon } from "lucide-react";
import { useEffect, useState } from "react";
import { useLanguage } from "../hooks/useLanguage";
import { t } from "../i18n";

const STORAGE_KEY = "livspan-sleep";

function getTodayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function loadToday(): { duration: number; quality: number } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { duration: 7, quality: 5 };
    const parsed = JSON.parse(raw);
    if (parsed.date !== getTodayKey()) return { duration: 7, quality: 5 };
    return parsed.values;
  } catch {
    return { duration: 7, quality: 5 };
  }
}

function saveToday(values: { duration: number; quality: number }) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ date: getTodayKey(), values }),
  );
}

export default function SleepCard() {
  const { lang } = useLanguage();
  const tr = t[lang];

  const [values, setValues] = useState(() => loadToday());

  useEffect(() => {
    saveToday(values);
  }, [values]);

  const set = (key: "duration" | "quality", v: number) =>
    setValues((prev) => ({ ...prev, [key]: v }));

  const durationPct = Math.min(100, Math.round((values.duration / 9) * 100));
  const qualityPct = Math.min(100, Math.round((values.quality / 10) * 100));

  const qualityLabel = (q: number) => {
    if (lang === "de") {
      if (q <= 3) return "Schlecht";
      if (q <= 6) return "Mittel";
      if (q <= 8) return "Gut";
      return "Sehr gut";
    }
    if (q <= 3) return "Poor";
    if (q <= 6) return "Fair";
    if (q <= 8) return "Good";
    return "Excellent";
  };

  const durationColor =
    values.duration >= 7 ? "text-green-accent" : "text-foreground";
  const qualityColor =
    values.quality >= 7 ? "text-green-accent" : "text-foreground";

  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-xl bg-indigo-500/15 flex items-center justify-center text-indigo-400 shrink-0">
          <Moon className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-display font-semibold text-sm text-foreground">
            {tr.sleep_title}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {tr.sleep_desc}
          </p>
        </div>
      </div>

      <div className="space-y-5">
        {/* Duration */}
        <div>
          <div className="flex justify-between items-baseline mb-2">
            <span className="text-xs font-medium text-foreground">
              {tr.sleep_duration}
            </span>
            <span className="text-xs text-muted-foreground">
              <span className={`font-semibold ${durationColor}`}>
                {values.duration}h
              </span>
              {" / 9h"}
            </span>
          </div>
          <Slider
            min={0}
            max={12}
            step={0.5}
            value={[values.duration]}
            onValueChange={([v]) => set("duration", v)}
            className="w-full"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            <span>0h</span>
            <span className="text-indigo-400/70">{tr.sleep_target}: 7–9h</span>
          </div>
        </div>

        {/* Quality */}
        <div>
          <div className="flex justify-between items-baseline mb-2">
            <span className="text-xs font-medium text-foreground">
              {tr.sleep_quality}
            </span>
            <span className="text-xs text-muted-foreground">
              <span className={`font-semibold ${qualityColor}`}>
                {values.quality}/10
              </span>
              {" – "}
              <span className={qualityColor}>
                {qualityLabel(values.quality)}
              </span>
            </span>
          </div>
          <Slider
            min={1}
            max={10}
            step={1}
            value={[values.quality]}
            onValueChange={([v]) => set("quality", v)}
            className="w-full"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            <span>1</span>
            <span>10</span>
          </div>
        </div>

        {/* Progress summary */}
        <div className="pt-1 border-t border-border/30 grid grid-cols-2 gap-2 text-center">
          <SleepDot
            pct={durationPct}
            label={tr.sleep_duration_short}
            color="indigo"
          />
          <SleepDot
            pct={qualityPct}
            label={tr.sleep_quality_short}
            color="indigo"
          />
        </div>
      </div>
    </div>
  );
}

function SleepDot({
  pct,
  label,
}: {
  pct: number;
  label: string;
  color: string;
}) {
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
            className={pct >= 100 ? "text-green-accent" : "text-indigo-400"}
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
