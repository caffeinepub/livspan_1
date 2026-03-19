import { Slider } from "@/components/ui/slider";
import { Dumbbell } from "lucide-react";
import { useDailyHealth } from "../hooks/useDailyHealth";
import { useLanguage } from "../hooks/useLanguage";
import { useGetCallerProfile } from "../hooks/useQueries";
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

function durationColor(duration: number, minTarget: number) {
  if (duration >= minTarget) return "text-green-accent";
  if (duration >= minTarget / 2) return "text-yellow-400";
  return "text-muted-foreground";
}

function movementTargetForAge(age: number | null): {
  min: number;
  label: string;
  intensityNote: string;
} {
  if (age !== null && age >= 65)
    return { min: 30, label: "≥30 min", intensityNote: "moderate (Zone 2)" };
  if (age !== null && age >= 50)
    return { min: 30, label: "≥30 min", intensityNote: "moderate-high" };
  return { min: 30, label: "≥30 min", intensityNote: "moderate-high" };
}

function ageAdaptedMovementTip(
  lang: string,
  age: number | null,
): string | null {
  if (age === null) return null;
  if (age >= 65) {
    switch (lang) {
      case "de":
        return "Ab 65 Jahren sind Balance- und Kraftübungen besonders wichtig, um Stürze zu verhindern und Muskelmasse zu erhalten (Sarkopenie-Prävention). Ziel: 2–3x/Woche Krafttraining.";
      case "ru":
        return "После 65 лет упражнения на баланс и силу особенно важны для предотвращения падений и сохранения мышечной массы. Цель: 2–3 раза в неделю силовые тренировки.";
      case "zh":
        return "65岁以后，平衡和力量训练对预防跌倒和保持肌肉质量（预防肌少症）尤为重要。目标：每周2-3次力量训练。";
      default:
        return "After 65, balance and strength exercises are especially important to prevent falls and maintain muscle mass (sarcopenia prevention). Aim for 2–3x/week resistance training.";
    }
  }
  if (age >= 50) {
    switch (lang) {
      case "de":
        return "Ab 50 Jahren nimmt die Muskelmasse schneller ab. Kombiniere Kraft- und Ausdauertraining für optimale Longevity-Wirkung. Proteinzufuhr vor dem Training verbessert die Muskelregeneration.";
      case "ru":
        return "После 50 лет мышечная масса убывает быстрее. Сочетайте силовые и кардиотренировки для оптимального эффекта долголетия. Белок перед тренировкой улучшает восстановление мышц.";
      case "zh":
        return "50岁后肌肉质量下降加速。结合力量和有氧训练可获得最佳长寿效果。训练前摄入蛋白质有助于肌肉恢复。";
      default:
        return "After 50, muscle mass declines faster. Combine strength and endurance training for optimal longevity benefits. Protein intake before training improves muscle recovery.";
    }
  }
  return null;
}

export default function MovementCard() {
  const { lang } = useLanguage();
  const tr = t[lang];
  const { health, setHealth } = useDailyHealth();
  const { data: profile } = useGetCallerProfile();

  const currentYear = new Date().getFullYear();
  const birthYear = (profile as any)?.birthYear
    ? Number((profile as any).birthYear)
    : null;
  const age = birthYear ? currentYear - birthYear : null;

  const { sport, intensity, movementDuration: duration } = health;

  const { min: minTarget, label: targetLabel } = movementTargetForAge(age);

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

  // Build age-adapted AI tips
  const aiTips: string[] = [];
  if (duration > 0 && duration < minTarget)
    aiTips.push(...(tr.ai_tip_movement_low as unknown as string[]));
  if (duration > 0 && intensity < 4)
    aiTips.push(...(tr.ai_tip_movement_intensity as unknown as string[]));
  const ageTip = ageAdaptedMovementTip(lang, age);
  if (ageTip && duration > 0) aiTips.push(ageTip);

  const dCol = durationColor(duration, minTarget);

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
            <span className={`text-xs font-semibold ${dCol}`}>
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
            <span className="text-blue-400/70">Target: {targetLabel}</span>
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
            <p className={`text-sm font-bold ${dCol}`}>{duration} min</p>
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
