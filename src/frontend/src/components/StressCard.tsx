import { Slider } from "@/components/ui/slider";
import { HeartPulse } from "lucide-react";
import { useDailyHealth } from "../hooks/useDailyHealth";
import { useLanguage } from "../hooks/useLanguage";
import { useGetCallerProfile } from "../hooks/useQueries";
import { t } from "../i18n";
import AiTip from "./AiTip";

// Age-adapted BP thresholds (ESC/Hochdruckliga + Longevity perspective)
// Upper bounds (high BP)
function bpUpperThresholds(age: number | null) {
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

// Lower bounds (low BP / hypotension) – also age-adapted
// Elderly tolerate slightly higher minimums before symptoms occur
function bpLowerThresholds(age: number | null) {
  if (age !== null && age >= 80)
    return { sysLow: 105, sysVeryLow: 95, diaLow: 65, diaVeryLow: 55 };
  if (age !== null && age >= 60)
    return { sysLow: 100, sysVeryLow: 90, diaLow: 65, diaVeryLow: 55 };
  if (age !== null && age >= 45)
    return { sysLow: 95, sysVeryLow: 85, diaLow: 60, diaVeryLow: 50 };
  if (age !== null && age >= 30)
    return { sysLow: 90, sysVeryLow: 80, diaLow: 60, diaVeryLow: 50 };
  // 18–29: athletes can go lower, so threshold is a bit more lenient
  return { sysLow: 90, sysVeryLow: 80, diaLow: 60, diaVeryLow: 50 };
}

// Age-adapted HR lower bounds (bradycardia thresholds)
// Older adults have less cardiac reserve, so lower HR is flagged sooner
function hrLowerThreshold(age: number | null) {
  if (age !== null && age >= 60) return { hrLow: 50, hrVeryLow: 40 };
  if (age !== null && age >= 30) return { hrLow: 45, hrVeryLow: 35 };
  return { hrLow: 40, hrVeryLow: 30 }; // 18–29: athletic bradycardia more common
}

function bpCategory(systolic: number, diastolic: number, age: number | null) {
  if (systolic === 0 && diastolic === 0) return "–";
  const { sysGreen, sysYellow, diaGreen, diaYellow } = bpUpperThresholds(age);
  const { sysLow, sysVeryLow, diaLow, diaVeryLow } = bpLowerThresholds(age);
  if (systolic < sysVeryLow || diastolic < diaVeryLow) return "Very Low";
  if (systolic < sysLow || diastolic < diaLow) return "Low";
  if (systolic <= sysGreen && diastolic <= diaGreen) return "Optimal";
  if (systolic <= sysYellow && diastolic <= diaYellow) return "Normal";
  if (systolic < sysYellow + 10 || diastolic < diaYellow + 5) return "Elevated";
  return "High";
}

function bpColor(systolic: number, diastolic: number, age: number | null) {
  if (systolic === 0 && diastolic === 0) return "text-muted-foreground";
  const { sysGreen, sysYellow, diaGreen, diaYellow } = bpUpperThresholds(age);
  const { sysLow, sysVeryLow, diaLow, diaVeryLow } = bpLowerThresholds(age);
  if (systolic < sysVeryLow || diastolic < diaVeryLow) return "text-red-400";
  if (systolic < sysLow || diastolic < diaLow) return "text-yellow-400";
  if (systolic <= sysGreen && diastolic <= diaGreen) return "text-green-accent";
  if (systolic <= sysYellow && diastolic <= diaYellow)
    return "text-green-accent";
  if (systolic < sysYellow + 10 || diastolic < diaYellow + 5)
    return "text-yellow-400";
  return "text-red-400";
}

function hrCategory(hr: number, age: number | null) {
  if (hr === 0) return "–";
  const { hrLow, hrVeryLow } = hrLowerThreshold(age);
  if (hr < hrVeryLow) return "Very Low";
  if (hr < hrLow) return "Low";
  if (hr < 50) return "Athletic";
  if (hr < 60) return "Excellent";
  if (hr < 70) return "Good";
  if (hr < 80) return "Normal";
  return "Elevated";
}

function hrColor(hr: number, age: number | null) {
  if (hr === 0) return "text-muted-foreground";
  const { hrLow, hrVeryLow } = hrLowerThreshold(age);
  if (hr < hrVeryLow) return "text-red-400";
  if (hr < hrLow) return "text-yellow-400";
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

function bpLowTip(
  lang: string,
  age: number | null,
  sysLow: number,
  diaLow: number,
): string {
  const ageLabel = age !== null ? age : "?";
  switch (lang) {
    case "de":
      return `Dein Blutdruck liegt unter dem altersgerechten Mindestwert (${ageLabel} Jahre: >${sysLow}/${diaLow} mmHg). Niederdruck kann zu Schwindel, Müdigkeit und Kreislaufproblemen führen.`;
    case "ru":
      return `Ваше давление ниже возрастной нормы (${ageLabel} лет: >${sysLow}/${diaLow} мм рт. ст.). Низкое давление может вызывать головокружение, усталость и проблемы с кровообращением.`;
    case "zh":
      return `您的血压低于年龄适宜的最低值（${ageLabel}岁: >${sysLow}/${diaLow} mmHg）。低血压可能导致头晕、疲劳和循环问题。`;
    default:
      return `Your blood pressure is below the age-appropriate minimum (age ${ageLabel}: >${sysLow}/${diaLow} mmHg). Low BP can cause dizziness, fatigue and circulation issues.`;
  }
}

function hrLowTip(lang: string, age: number | null, hrLow: number): string {
  const ageLabel = age !== null ? age : "?";
  switch (lang) {
    case "de":
      return `Dein Ruhepuls liegt unter dem altersgerechten Mindestwert (${ageLabel} Jahre: >${hrLow} bpm). Ein sehr niedriger Puls kann auf Bradykardie hindeuten – bitte ärztlich abklären lassen.`;
    case "ru":
      return `Ваш пульс в покое ниже возрастной нормы (${ageLabel} лет: >${hrLow} уд/мин). Очень низкий пульс может указывать на брадикардию — проконсультируйтесь с врачом.`;
    case "zh":
      return `您的静息心率低于年龄适宜的最低值（${ageLabel}岁: >${hrLow} bpm）。极低的心率可能提示心动过缓，请咨询医生。`;
    default:
      return `Your resting HR is below the age-appropriate minimum (age ${ageLabel}: >${hrLow} bpm). A very low HR may indicate bradycardia — consult a doctor.`;
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
  const hrColorClass = hrColor(restingHr, age);

  // Upper thresholds
  const { sysGreen: sysTarget, diaGreen: diaTarget } = bpUpperThresholds(age);
  // Lower thresholds
  const { sysLow, diaLow } = bpLowerThresholds(age);
  const { hrLow } = hrLowerThreshold(age);

  const bpHigh = systolic > sysTarget || diastolic > diaTarget;
  const bpLow =
    (systolic > 0 && systolic < sysLow) ||
    (diastolic > 0 && diastolic < diaLow);
  const hrHigh = restingHr > 70;
  const hrLow_ = restingHr > 0 && restingHr < hrLow;

  const aiTips: string[] = [];
  if (systolic > 0 && bpHigh) {
    aiTips.push(ageTargetTip(lang, age, sysTarget, diaTarget));
    aiTips.push(...(tr.ai_tip_bp_elevated as unknown as string[]));
  }
  if (bpLow) {
    aiTips.push(bpLowTip(lang, age, sysLow, diaLow));
  }
  if (restingHr > 0 && hrHigh)
    aiTips.push(...(tr.ai_tip_hr_high as unknown as string[]));
  if (hrLow_) aiTips.push(hrLowTip(lang, age, hrLow));

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
            <span className="text-blue-400/70">&gt;{sysLow}</span>
            <span className="text-rose-400/70">
              {tr.stress_bp_target}: {sysLow}–{sysTarget}
            </span>
            <span className="text-rose-400/70">&lt;{sysTarget}</span>
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
            <span className="text-blue-400/70">&gt;{diaLow}</span>
            <span className="text-rose-400/70">
              {tr.stress_bp_target}: {diaLow}–{diaTarget}
            </span>
            <span className="text-rose-400/70">&lt;{diaTarget}</span>
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
              <span className={hrColorClass}>{hrCategory(restingHr, age)}</span>
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
            <span className="text-blue-400/70">&gt;{hrLow}</span>
            <span className="text-rose-400/70">
              {tr.stress_hr_target}: {hrLow}–70
            </span>
            <span className="text-rose-400/70">&lt;70</span>
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
