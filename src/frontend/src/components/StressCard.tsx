import { Slider } from "@/components/ui/slider";
import { HeartPulse } from "lucide-react";
import { useDailyHealth } from "../hooks/useDailyHealth";
import { useLanguage } from "../hooks/useLanguage";
import { t } from "../i18n";
import AiTip from "./AiTip";

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
  const { health, setHealth } = useDailyHealth();

  const { systolic, diastolic, restingHr } = health;

  const set = (key: "systolic" | "diastolic" | "restingHr", v: number) =>
    setHealth({ [key]: v });

  const bpColorClass = bpColor(systolic, diastolic);
  const hrColorClass = hrColor(restingHr);

  // Build AI tips
  const aiTips: string[] = [];
  const bpElevated = systolic >= 130 || diastolic >= 80;
  const hrHigh = restingHr > 70;
  if (systolic > 0 && bpElevated)
    aiTips.push(...(tr.ai_tip_bp_elevated as unknown as string[]));
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
                {diastolic} mmHg
              </span>
              {" – "}
              <span className={bpColorClass}>
                {bpCategory(systolic, diastolic, lang)}
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
                {restingHr} bpm
              </span>
              {" – "}
              <span className={hrColorClass}>
                {hrCategory(restingHr, lang)}
              </span>
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
              {bpCategory(systolic, diastolic, lang)}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {tr.stress_status}
            </p>
          </div>
        </div>

        {/* AI Tips */}
        <AiTip tips={aiTips} lang={lang} />
      </div>
    </div>
  );
}
