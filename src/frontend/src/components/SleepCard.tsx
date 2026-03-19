import { Slider } from "@/components/ui/slider";
import { Moon } from "lucide-react";
import { useDailyHealth } from "../hooks/useDailyHealth";
import { useLanguage } from "../hooks/useLanguage";
import { useGetCallerProfile } from "../hooks/useQueries";
import { t } from "../i18n";
import AiTip from "./AiTip";

function sleepTargetForAge(age: number | null): { min: number; label: string } {
  if (age !== null && age >= 65) return { min: 7, label: "7–8h" };
  if (age !== null && age >= 26) return { min: 7, label: "7–9h" };
  return { min: 8, label: "8–10h" }; // 18–25
}

function ageAdaptedSleepTip(
  lang: string,
  age: number | null,
  target: string,
): string {
  const ageLabel = age !== null ? age : "?";
  switch (lang) {
    case "de":
      return `Für dein Alter (${ageLabel} Jahre) wird ein Schlaf von ${target} empfohlen. Ausreichend Schlaf ist ein zentraler Longevity-Faktor.`;
    case "ru":
      return `Для вашего возраста (${ageLabel} лет) рекомендуется сон ${target}. Достаточный сон — ключевой фактор долголетия.`;
    case "zh":
      return `根据您的年龄（${ageLabel}岁），建议睡眠时间为${target}。充足睡眠是长寿的关键因素。`;
    default:
      return `For your age (${ageLabel}), the recommended sleep duration is ${target}. Sufficient sleep is a key longevity factor.`;
  }
}

function ageMovementSleepTip(lang: string, age: number | null): string | null {
  if (age === null || age < 65) return null;
  switch (lang) {
    case "de":
      return "Ab 65 Jahren verändert sich die Schlafarchitektur: Tiefschlafphasen werden kürzer. Regelmäßige Schlafzeiten und kein Alkohol am Abend helfen besonders.";
    case "ru":
      return "После 65 лет архитектура сна меняется: фазы глубокого сна становятся короче. Регулярный режим сна и отказ от алкоголя вечером особенно важны.";
    case "zh":
      return "65岁以后睡眠结构发生变化：深度睡眠阶段缩短。规律作息和晚间戒酒尤为重要。";
    default:
      return "After 65, sleep architecture changes: deep sleep phases shorten. Regular sleep times and avoiding alcohol in the evening are especially helpful.";
  }
}

export default function SleepCard() {
  const { lang } = useLanguage();
  const tr = t[lang];
  const { health, setHealth } = useDailyHealth();
  const { data: profile } = useGetCallerProfile();

  const currentYear = new Date().getFullYear();
  const birthYear = (profile as any)?.birthYear
    ? Number((profile as any).birthYear)
    : null;
  const age = birthYear ? currentYear - birthYear : null;

  const { sleepDuration: duration, sleepQuality: quality } = health;

  const set = (key: "sleepDuration" | "sleepQuality", v: number) =>
    setHealth({ [key]: v });

  const { min: minTarget, label: targetLabel } = sleepTargetForAge(age);

  const durationPct = Math.min(
    100,
    Math.round((duration / (minTarget + 2)) * 100),
  );
  const qualityPct = Math.min(100, Math.round((quality / 10) * 100));

  const qualityLabel = (q: number) => {
    if (q <= 3) return "Poor";
    if (q <= 6) return "Fair";
    if (q <= 8) return "Good";
    return "Excellent";
  };

  const durationColor =
    duration >= minTarget ? "text-green-accent" : "text-foreground";
  const qualityColor = quality >= 7 ? "text-green-accent" : "text-foreground";

  // Build age-adapted AI tips
  const aiTips: string[] = [];
  if (duration > 0 && duration < minTarget) {
    aiTips.push(ageAdaptedSleepTip(lang, age, targetLabel));
    aiTips.push(...(tr.ai_tip_sleep_short as unknown as string[]));
  }
  if (quality > 0 && quality < 6)
    aiTips.push(...(tr.ai_tip_sleep_quality as unknown as string[]));
  const ageTip = ageMovementSleepTip(lang, age);
  if (ageTip && (duration > 0 || quality > 0)) aiTips.push(ageTip);

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
                {duration}h
              </span>
              {" / "}
              {minTarget + 2}
              {"h"}
            </span>
          </div>
          <Slider
            min={0}
            max={12}
            step={0.5}
            value={[duration]}
            onValueChange={([v]) => set("sleepDuration", v)}
            className="w-full"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            <span>0h</span>
            <span className="text-indigo-400/70">
              {tr.sleep_target}: {targetLabel}
            </span>
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
                {quality}/10
              </span>
              {" – "}
              <span className={qualityColor}>{qualityLabel(quality)}</span>
            </span>
          </div>
          <Slider
            min={0}
            max={10}
            step={1}
            value={[quality]}
            onValueChange={([v]) => set("sleepQuality", v)}
            className="w-full"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            <span>0</span>
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

        {/* AI Tips */}
        <AiTip tips={aiTips} />
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
