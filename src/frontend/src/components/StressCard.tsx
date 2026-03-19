import { Slider } from "@/components/ui/slider";
import { HeartPulse } from "lucide-react";
import { useDailyHealth } from "../hooks/useDailyHealth";
import { useLanguage } from "../hooks/useLanguage";
import { useGetCallerProfile } from "../hooks/useQueries";
import { t } from "../i18n";
import AiTip from "./AiTip";

// Age-adapted BP thresholds (ESC/Hochdruckliga + Longevity perspective)
function bpThresholds(age: number | null) {
  if (age !== null && age >= 80)
    return { sysGreen: 145, sysYellow: 160, diaGreen: 90, diaYellow: 100 };
  if (age !== null && age >= 60)
    return { sysGreen: 139, sysYellow: 150, diaGreen: 85, diaYellow: 95 };
  if (age !== null && age >= 45)
    return { sysGreen: 130, sysYellow: 140, diaGreen: 85, diaYellow: 90 };
  if (age !== null && age >= 30)
    return { sysGreen: 125, sysYellow: 135, diaGreen: 80, diaYellow: 90 };
  return { sysGreen: 120, sysYellow: 130, diaGreen: 80, diaYellow: 90 };
}

function bpCategory(systolic: number, diastolic: number, age: number | null) {
  const { sysGreen, sysYellow, diaGreen, diaYellow } = bpThresholds(age);
  if (systolic <= sysGreen && diastolic <= diaGreen) return "Optimal";
  if (systolic <= sysYellow && diastolic <= diaYellow) return "Normal";
  if (systolic < sysYellow + 10 || diastolic < diaYellow + 5) return "Elevated";
  return "High";
}

function bpColor(systolic: number, diastolic: number, age: number | null) {
  const { sysGreen, sysYellow, diaGreen, diaYellow } = bpThresholds(age);
  if (systolic <= sysGreen && diastolic <= diaGreen) return "text-green-accent";
  if (systolic <= sysYellow && diastolic <= diaYellow)
    return "text-green-accent";
  if (systolic < sysYellow + 10 || diastolic < diaYellow + 5)
    return "text-yellow-400";
  return "text-red-400";
}

function hrCategory(hr: number) {
  if (hr < 50) return "Athletic";
  if (hr < 60) return "Excellent";
  if (hr < 70) return "Good";
  if (hr < 80) return "Normal";
  return "Elevated";
}

function hrColor(hr: number) {
  if (hr < 70) return "text-green-accent";
  if (hr < 80) return "text-yellow-400";
  return "text-red-400";
}

// Returns a localized string describing the age-specific BP target
function ageTargetTip(
  lang: string,
  age: number | null,
  sysTarget: number,
  diaTarget: number,
): string {
  const ageLabel = age !== null ? age : "?";
  switch (lang) {
    case "de":
      return `Dein altersgerechter Blutdruckzielwert (${ageLabel} Jahre) liegt bei <${sysTarget}/<${diaTarget} mmHg – basierend auf aktuellen ESC-Leitlinien.`;
    case "ru":
      return `Ваш целевой показатель артериального давления с учётом возраста (${ageLabel} лет) составляет <${sysTarget}/<${diaTarget} мм рт. ст. — согласно современным рекомендациям ЕОК.`;
    case "zh":
      return `根据您的年龄（${ageLabel}岁）及ESC指南，您的目标血压为 <${sysTarget}/<${diaTarget} mmHg。`;
    default:
      return `Your age-adapted BP target (age ${ageLabel}) is <${sysTarget}/<${diaTarget} mmHg — based on current ESC guidelines.`;
  }
}

export default function StressCard() {
  const { lang } = useLanguage();
  const tr = t[lang];
  const { health, setHealth } = useDailyHealth();
  const { data: profile } = useGetCallerProfile();

  const currentYear = new Date().getFullYear();
  const birthYear = (profile as any)?.birthYear
    ? Number((profile as any).birthYear)
    : null;
  const age = birthYear ? currentYear - birthYear : null;

  const { systolic, diastolic, restingHr } = health;

  const set = (key: "systolic" | "diastolic" | "restingHr", v: number) =>
    setHealth({ [key]: v });

  const bpColorClass = bpColor(systolic, diastolic, age);
  const hrColorClass = hrColor(restingHr);

  // Fully age-adapted trigger for AI tips
  const { sysGreen: sysTarget, diaGreen: diaTarget } = bpThresholds(age);
  const bpElevated = systolic > sysTarget || diastolic > diaTarget;
  const hrHigh = restingHr > 70;

  const aiTips: string[] = [];
  if (systolic > 0 && bpElevated) {
    // First tip is personalized with the user's age-specific target
    aiTips.push(ageTargetTip(lang, age, sysTarget, diaTarget));
    aiTips.push(...(tr.ai_tip_bp_elevated as unknown as string[]));
  }
  if (restingHr > 0 && hrHigh)
    aiTips.push(...(tr.ai_tip_hr_high as unknown as string[]));

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
                {systolic} mmHg
              </span>
            </span>
          </div>
          <Slider
            min={0}
            max={200}
            step={1}
            value={[systolic]}
            onValueChange={([v]) => set("systolic", v)}
            className="w-full"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            <span>0</span>
            <span className="text-rose-400/70">
              {tr.stress_bp_target}: &lt;{sysTarget}
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
                {diastolic} mmHg
              </span>
              {" – "}
              <span className={bpColorClass}>
                {bpCategory(systolic, diastolic, age)}
              </span>
            </span>
          </div>
          <Slider
            min={0}
            max={130}
            step={1}
            value={[diastolic]}
            onValueChange={([v]) => set("diastolic", v)}
            className="w-full"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            <span>0</span>
            <span className="text-rose-400/70">
              {tr.stress_bp_target}: &lt;{diaTarget}
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
                {restingHr} bpm
              </span>
              {" – "}
              <span className={hrColorClass}>{hrCategory(restingHr)}</span>
            </span>
          </div>
          <Slider
            min={0}
            max={120}
            step={1}
            value={[restingHr]}
            onValueChange={([v]) => set("restingHr", v)}
            className="w-full"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            <span>0</span>
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
              {systolic}/{diastolic}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {tr.stress_bp_short}
            </p>
          </div>
          <div className="w-px h-8 bg-border/30" />
          <div className="text-center">
            <p className={`text-sm font-bold ${hrColorClass}`}>
              {restingHr} bpm
            </p>
            <p className="text-[10px] text-muted-foreground">
              {tr.stress_hr_short}
            </p>
          </div>
          <div className="w-px h-8 bg-border/30" />
          <div className="text-center">
            <p className={`text-xs font-semibold ${bpColorClass}`}>
              {bpCategory(systolic, diastolic, age)}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {tr.stress_status}
            </p>
          </div>
        </div>

        {/* AI Tips */}
        <AiTip tips={aiTips} />
      </div>
    </div>
  );
}
