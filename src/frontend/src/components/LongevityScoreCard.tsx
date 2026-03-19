import { AlertTriangle, Flame } from "lucide-react";
import { useEffect } from "react";
import { useDailyHealth } from "../hooks/useDailyHealth";
import { useLanguage } from "../hooks/useLanguage";
import { useGetCallerProfile, useSaveScoreEntry } from "../hooks/useQueries";
import { t } from "../i18n";

const ACTIVITY_FACTORS: Record<string, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

function calcBMR(
  weightKg: number,
  heightCm: number,
  age: number,
  gender: string,
): number {
  const male = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  const female = 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
  if (gender === "male") return Math.round(male);
  if (gender === "female") return Math.round(female);
  return Math.round((male + female) / 2);
}

function getTodayKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function calcSleepScore(duration: number, quality: number) {
  if (duration === 0 && quality === 0) return 0;
  const durationScore =
    duration >= 9 ? 100 : duration >= 7 ? 100 : (duration / 7) * 100;
  const qualityScore = (quality / 10) * 100;
  return (durationScore + qualityScore) / 2;
}

function calcNutritionScore(
  protein: number,
  veggies: number,
  water: number,
  calories: number,
  weightKg: number,
  tdee: number | null,
) {
  const proteinTarget = weightKg * 1.8;
  const proteinScore = Math.min(100, (protein / proteinTarget) * 100);
  const veggiesScore = Math.min(100, (veggies / 400) * 100);
  const waterScore = Math.min(100, (water / 2) * 100);

  if (calories > 0 && tdee !== null && tdee > 0) {
    const calorieRatio = calories / tdee;
    const calorieScore = Math.max(0, 100 - Math.abs(calorieRatio - 1) * 200);
    return (proteinScore + veggiesScore + waterScore + calorieScore) / 4;
  }

  return (proteinScore + veggiesScore + waterScore) / 3;
}

function calcMovementScore(duration: number, intensity: number) {
  if (duration === 0) return 0;
  const durationScore = Math.min(100, (duration / 45) * 100);
  let intensityScore: number;
  if (intensity >= 4 && intensity <= 7) {
    intensityScore = 100;
  } else if (intensity < 4) {
    intensityScore = (intensity / 4) * 100;
  } else {
    intensityScore = Math.max(40, 100 - (intensity - 7) * 15);
  }
  return durationScore * 0.6 + intensityScore * 0.4;
}

// Age-adapted BP thresholds – mirrors StressCard logic
function bpThresholds(age: number | null) {
  if (age !== null && age >= 80) return { sysOptimal: 142, diaOptimal: 87 };
  if (age !== null && age >= 60) return { sysOptimal: 134, diaOptimal: 82 };
  if (age !== null && age >= 45) return { sysOptimal: 125, diaOptimal: 82 };
  if (age !== null && age >= 30) return { sysOptimal: 122, diaOptimal: 80 };
  // 18-29 or unknown
  return { sysOptimal: 115, diaOptimal: 75 };
}

function calcStressScore(
  systolic: number,
  diastolic: number,
  restingHr: number,
  age: number | null,
) {
  if (systolic === 0 && diastolic === 0 && restingHr === 0) return 0;
  const { sysOptimal, diaOptimal } = bpThresholds(age);
  const systolicScore = Math.max(
    0,
    100 - Math.abs(systolic - sysOptimal) * 1.5,
  );
  const diastolicScore = Math.max(
    0,
    100 - Math.abs(diastolic - diaOptimal) * 2,
  );
  const hrScore = Math.max(0, 100 - Math.abs(restingHr - 55) * 1.5);
  return (systolicScore + diastolicScore + hrScore) / 3;
}

function calcFastingScore(startTime: string, endTime: string) {
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  const startMin = sh * 60 + sm;
  const endMin = eh * 60 + em;
  const fastingWindowHours =
    endMin >= startMin
      ? (endMin - startMin) / 60
      : (1440 - startMin + endMin) / 60;
  return Math.min(100, (fastingWindowHours / 16) * 100);
}

function getAgeScoreInsight(age: number, lang: string): string {
  if (age >= 80) {
    switch (lang) {
      case "de":
        return "Ab 80: Gentle Bewegung, Proteinzufuhr (≥2,2g/kg) und BP-Kontrolle sind jetzt deine wichtigsten Longevity-Hebel.";
      case "ru":
        return "После 80 лет: мягкие нагрузки, достаточный белок (≥2,2 г/кг) и контроль давления — ключевые факторы долголетия.";
      case "zh":
        return "80岁以上：温和运动、充足蛋白质（≥2.2g/kg）和血压控制是您最重要的长寿因素。";
      default:
        return "Age 80+: Gentle movement, protein intake (≥2.2g/kg), and BP control are your key longevity levers.";
    }
  }
  if (age >= 60) {
    switch (lang) {
      case "de":
        return "Ab 60: Priorisiere Muskelerhalt (Protein ≥2,0g/kg), BP-Kontrolle (<139/<85) und regelmäßige Bewegung.";
      case "ru":
        return "После 60 лет: приоритет — сохранение мышц (белок ≥2,0 г/кг), контроль давления (<139/<85) и регулярные нагрузки.";
      case "zh":
        return "60岁以上：优先保持肌肉量（蛋白质≥2.0g/kg）、控制血压（<139/<85）和规律运动。";
      default:
        return "Age 60+: Prioritise muscle preservation (protein ≥2.0g/kg), BP control (<139/<85), and regular movement.";
    }
  }
  if (age >= 45) {
    switch (lang) {
      case "de":
        return "Ab 45: Achte auf Hormonbalance, BP (<130/<85) und ausreichend Protein (1,8g/kg) für optimale Longevity.";
      case "ru":
        return "После 45 лет: следите за гормональным балансом, давлением (<130/<85) и достаточным белком (1,8 г/кг).";
      case "zh":
        return "45岁以上：关注激素平衡、血压（<130/<85）和充足蛋白质（1.8g/kg）。";
      default:
        return "Age 45+: Focus on hormonal balance, BP (<130/<85), and adequate protein (1.8g/kg) for optimal longevity.";
    }
  }
  if (age >= 30) {
    switch (lang) {
      case "de":
        return "Ab 30: Stressmanagement und konsequente Routinen jetzt legen den Grundstein für deine Langlebigkeit.";
      case "ru":
        return "После 30 лет: управление стрессом и последовательные привычки сейчас закладывают основу долголетия.";
      case "zh":
        return "30岁以上：现在管理压力、建立规律习惯，为您的长寿奠定基础。";
      default:
        return "Age 30+: Stress management and consistent routines now lay the foundation for your longevity.";
    }
  }
  // 18-29
  switch (lang) {
    case "de":
      return "Deine Gewohnheiten jetzt bestimmen deine Gesundheit in 30 Jahren — früh starten macht den größten Unterschied.";
    case "ru":
      return "Ваши привычки сейчас определят здоровье через 30 лет — начало в молодом возрасте имеет наибольшее значение.";
    case "zh":
      return "您现在的习惯决定30年后的健康——越早开始，影响越大。";
    default:
      return "Your habits now shape your health in 30 years — starting early makes the biggest difference.";
  }
}

interface SubScoreRowProps {
  label: string;
  score: number;
  color: string;
  hasData: boolean;
}

function SubScoreRow({ label, score, color, hasData }: SubScoreRowProps) {
  const pct = Math.round(score);
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted-foreground w-24 shrink-0">
        {label}
      </span>
      <div className="flex-1 h-1.5 rounded-full bg-muted/50 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${hasData ? pct : 0}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-xs font-mono text-muted-foreground w-9 text-right">
        {hasData ? `${pct}%` : "--"}
      </span>
    </div>
  );
}

const RING_SIZE = 140;
const STROKE = 10;
const R = (RING_SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * R;

function ScoreRing({ score, category }: { score: number; category: string }) {
  const fill = (score / 100) * CIRCUMFERENCE;
  const offset = CIRCUMFERENCE - fill;

  let ringColor: string;
  if (score < 40) ringColor = "oklch(0.55 0.18 25)";
  else if (score < 60) ringColor = "oklch(0.75 0.16 75)";
  else if (score < 80) ringColor = "oklch(0.72 0.18 135)";
  else ringColor = "oklch(0.76 0.14 148)";

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: RING_SIZE, height: RING_SIZE }}
    >
      <svg
        role="img"
        aria-label={`LivSpan score: ${score}`}
        width={RING_SIZE}
        height={RING_SIZE}
        style={{ transform: "rotate(-90deg)" }}
      >
        <circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={R}
          fill="none"
          stroke="oklch(0.25 0.02 200)"
          strokeWidth={STROKE}
        />
        <circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={R}
          fill="none"
          stroke={ringColor}
          strokeWidth={STROKE}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s ease, stroke 0.5s ease" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="font-bold text-3xl text-foreground leading-none">
          {score}
        </span>
        <span className="text-xs text-muted-foreground mt-1 text-center leading-tight max-w-[80px]">
          {category}
        </span>
      </div>
    </div>
  );
}

export default function LongevityScoreCard() {
  const { lang } = useLanguage();
  const tr = t[lang];
  const { data: profile } = useGetCallerProfile();
  const saveScore = useSaveScoreEntry();
  const { health } = useDailyHealth();

  const weightKg = (profile as any)?.weightKg ?? 70;
  const heightCm = (profile as any)?.heightCm
    ? Number((profile as any).heightCm)
    : null;
  const birthYear = (profile as any)?.birthYear
    ? Number((profile as any).birthYear)
    : null;
  const gender: string = (profile as any)?.gender ?? "";
  const currentYear = new Date().getFullYear();
  const age = birthYear ? currentYear - birthYear : null;
  const bmr =
    weightKg && heightCm && age
      ? calcBMR(weightKg, heightCm, age, gender)
      : null;
  const tdee =
    bmr !== null ? Math.round(bmr * ACTIVITY_FACTORS.moderate) : null;

  const {
    sleepDuration,
    sleepQuality,
    protein,
    veggies,
    water,
    calories,
    movementDuration,
    intensity,
    systolic,
    diastolic,
    restingHr,
    fastingStart,
    fastingEnd,
  } = health;

  const hasSleep = sleepDuration > 0 || sleepQuality > 0;
  const hasNutrition = protein > 0 || veggies > 0 || water > 0 || calories > 0;
  const hasStress = systolic > 0;
  const hasMovement = movementDuration > 0;
  const hasFasting = !!fastingStart && !!fastingEnd;

  const sleepScore = hasSleep ? calcSleepScore(sleepDuration, sleepQuality) : 0;
  const nutritionScore = hasNutrition
    ? calcNutritionScore(protein, veggies, water, calories, weightKg, tdee)
    : 0;
  const movementScore = hasMovement
    ? calcMovementScore(movementDuration, intensity)
    : 0;
  const stressScore = hasStress
    ? calcStressScore(systolic, diastolic, restingHr, age)
    : 0;
  const fastingScore = hasFasting
    ? calcFastingScore(fastingStart!, fastingEnd!)
    : 0;

  const totalScore = Math.round(
    sleepScore * 0.25 +
      nutritionScore * 0.25 +
      movementScore * 0.2 +
      stressScore * 0.2 +
      fastingScore * 0.1,
  );

  // Auto-save daily score once per day
  useEffect(() => {
    if (totalScore <= 0) return;
    const todayStr = getTodayKey();
    const lastSaved = localStorage.getItem("livspan-score-saved-date");
    if (lastSaved === todayStr) return;
    saveScore.mutate(
      { date: todayStr, score: totalScore },
      {
        onSuccess: () => {
          localStorage.setItem("livspan-score-saved-date", todayStr);
        },
      },
    );
  }, [totalScore, saveScore.mutate]);

  let categoryKey:
    | "longevity_cat_low"
    | "longevity_cat_mid"
    | "longevity_cat_good"
    | "longevity_cat_excellent";
  if (totalScore < 40) categoryKey = "longevity_cat_low";
  else if (totalScore < 60) categoryKey = "longevity_cat_mid";
  else if (totalScore < 80) categoryKey = "longevity_cat_good";
  else categoryKey = "longevity_cat_excellent";

  const hasIncomplete =
    !hasSleep || !hasNutrition || !hasStress || !hasMovement || !hasFasting;

  return (
    <div
      className="glass-card rounded-2xl p-5"
      data-ocid="longevity_score.card"
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-5">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "oklch(0.55 0.16 50 / 0.25)" }}
        >
          <Flame
            className="w-4.5 h-4.5"
            style={{ color: "oklch(0.75 0.16 55)" }}
          />
        </div>
        <div>
          <h3 className="font-display font-semibold text-sm text-foreground leading-tight">
            {tr.longevity_score_title}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {tr.longevity_score_desc}
          </p>
        </div>
      </div>

      {/* Ring */}
      <div className="flex justify-center mb-5">
        <ScoreRing score={totalScore} category={tr[categoryKey]} />
      </div>

      {/* Age insight */}
      {age !== null && (
        <div className="mx-1 mb-4 px-3 py-2 rounded-xl bg-white/4 border border-border/30 text-xs text-muted-foreground leading-snug text-center">
          {getAgeScoreInsight(age, lang)}
        </div>
      )}

      {/* Sub-scores */}
      <div className="space-y-2.5">
        <SubScoreRow
          label={tr.longevity_score_sub_sleep}
          score={sleepScore}
          color="oklch(0.60 0.15 280)"
          hasData={hasSleep}
        />
        <SubScoreRow
          label={tr.longevity_score_sub_nutrition}
          score={nutritionScore}
          color="oklch(0.72 0.18 135)"
          hasData={hasNutrition}
        />
        <SubScoreRow
          label={tr.longevity_score_sub_movement}
          score={movementScore}
          color="oklch(0.65 0.15 230)"
          hasData={hasMovement}
        />
        <SubScoreRow
          label={tr.longevity_score_sub_stress}
          score={stressScore}
          color="oklch(0.65 0.20 15)"
          hasData={hasStress}
        />
        <SubScoreRow
          label={tr.longevity_score_sub_fasting}
          score={fastingScore}
          color="oklch(0.75 0.16 75)"
          hasData={hasFasting}
        />
      </div>

      {/* Incomplete hint */}
      {hasIncomplete && (
        <div
          className="flex items-start gap-2 mt-4 p-3 rounded-xl bg-amber-500/8 border border-amber-500/20"
          data-ocid="longevity_score.error_state"
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-300/80 leading-snug">
            {tr.longevity_score_incomplete}
          </p>
        </div>
      )}
    </div>
  );
}
