import { Slider } from "@/components/ui/slider";
import { Dumbbell } from "lucide-react";
import { useDailyHealth } from "../hooks/useDailyHealth";
import { useLanguage } from "../hooks/useLanguage";
import { t } from "../i18n";
import AiTip from "./AiTip";

type SportKey =
  | "running"
  | "cycling"
  | "swimming"
  | "gym"
  | "yoga"
  | "hiking"
  | "other";

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
  const { health, setHealth } = useDailyHealth();

  const { sport, intensity, movementDuration: duration } = health;

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
    if (intensity <= 3) return tr.movement_status_low;
    if (intensity <= 6) return tr.movement_status_moderate;
    if (intensity <= 9) return tr.movement_status_high;
    return tr.movement_status_max;
  };

  const currentSportLabel =
    sportOptions.find((o) => o.value === sport)?.label ?? sport;

  // Build AI tips
  const aiTips: string[] = [];
  if (duration > 0 && duration < 30)
    aiTips.push(...(tr.ai_tip_movement_low as unknown as string[]));
  if (duration > 0 && intensity < 4)
    aiTips.push(...(tr.ai_tip_movement_intensity as unknown as string[]));

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
            value={sport}
            onChange={(e) => setHealth({ sport: e.target.value as SportKey })}
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
              <span className={`font-semibold ${intensityColor(intensity)}`}>
                {intensity}/10
              </span>
              {" – "}
              <span className={intensityColor(intensity)}>
                {intensityLabel()}
              </span>
            </span>
          </div>
          <Slider
            min={1}
            max={10}
            step={1}
            value={[intensity]}
            onValueChange={([v]) => setHealth({ intensity: v })}
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
              className={`text-xs font-semibold ${durationColor(duration)}`}
            >
              {duration} min
            </span>
          </div>
          <Slider
            min={0}
            max={180}
            step={5}
            value={[duration]}
            onValueChange={([v]) => setHealth({ movementDuration: v })}
            className="w-full"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            <span>0</span>
            <span className="text-blue-400/70">Target: ≥30 min</span>
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
            <p className={`text-sm font-bold ${intensityColor(intensity)}`}>
              {intensity}/10
            </p>
            <p className="text-[10px] text-muted-foreground">
              {tr.movement_intensity_short}
            </p>
          </div>
          <div className="w-px h-8 bg-border/30" />
          <div className="text-center">
            <p className={`text-sm font-bold ${durationColor(duration)}`}>
              {duration} min
            </p>
            <p className="text-[10px] text-muted-foreground">
              {tr.movement_duration_short}
            </p>
          </div>
        </div>

        {/* AI Tips */}
        <AiTip tips={aiTips} />
      </div>
    </div>
  );
}
