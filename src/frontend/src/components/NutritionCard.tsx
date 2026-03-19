import { Slider } from "@/components/ui/slider";
import { Activity, Flame, Salad, Utensils, Zap } from "lucide-react";
import { useDailyHealth } from "../hooks/useDailyHealth";
import { useLanguage } from "../hooks/useLanguage";
import { useGetCallerProfile } from "../hooks/useQueries";
import { t } from "../i18n";
import AiTip from "./AiTip";

function deriveActivityFactor(
  intensity: number,
  duration: number,
): { factor: number; key: string } {
  if (duration === 0) return { factor: 1.2, key: "sedentary" };
  if (duration < 30 && intensity < 4) return { factor: 1.375, key: "light" };
  if (duration >= 90 && intensity >= 8)
    return { factor: 1.9, key: "very_active" };
  if (duration > 60 && intensity >= 7) return { factor: 1.725, key: "active" };
  return { factor: 1.55, key: "moderate" };
}

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

/** Age-adapted water target in litres */
function waterTarget(age: number | null): number {
  if (age === null) return 2.0;
  if (age >= 65) return 2.5; // reduced thirst sensation at higher age
  return 2.0;
}

/** Age-adapted calorie safety note */
function ageCalorieNote(age: number | null, lang: string): string | null {
  if (age === null) return null;
  if (age >= 65) {
    if (lang === "de")
      return "Ab 65: Kalorienqualität über Kalorienmenge. Genug Protein schützt vor Muskelschwund.";
    if (lang === "ru")
      return "65+: качество калорий важнее количества. Достаточно белка для защиты мышц.";
    if (lang === "zh")
      return "65岁以上：卡路里质量比数量更重要，足够的蛋白质可防止肌肉流失。";
    return "Age 65+: Calorie quality matters more than restriction. Adequate protein protects muscle mass.";
  }
  if (age >= 50) {
    if (lang === "de")
      return "Ab 50: Stoffwechsel verlangsamt sich. Proteinreiche Mahlzeiten helfen, Muskeln zu erhalten.";
    if (lang === "ru")
      return "50+: метаболизм замедляется. Белковые блюда помогают сохранить мышцы.";
    if (lang === "zh")
      return "50岁以上：新陈代谢放缓。富含蛋白质的饮食有助于维持肌肉。";
    return "Age 50+: Metabolism slows. Protein-rich meals help maintain muscle mass.";
  }
  return null;
}

export default function NutritionCard() {
  const { lang } = useLanguage();
  const tr = t[lang];
  const { data: profile } = useGetCallerProfile();
  const { health, setHealth } = useDailyHealth();

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

  const activityInfo = deriveActivityFactor(
    health.intensity ?? 0,
    health.movementDuration ?? 0,
  );

  // Apply age-based metabolic correction: after 60 reduce TDEE by ~5% per decade
  const ageMetabolicFactor =
    age !== null && age >= 70 ? 0.9 : age !== null && age >= 60 ? 0.95 : 1.0;

  const tdee =
    bmr !== null
      ? Math.round(bmr * activityInfo.factor * ageMetabolicFactor)
      : null;

  const calorieGoal = tdee ?? 2000;
  const calorieMax = tdee ? Math.round(tdee * 1.5) : 4000;

  // Age-adapted protein multiplier
  const proteinMultiplier =
    age !== null && age >= 70 ? 2.2 : age !== null && age >= 60 ? 2.0 : 1.8;
  const proteinTarget = Math.round(weightKg * proteinMultiplier);

  // Age-adapted water target
  const waterGoal = waterTarget(age);

  const { protein, veggies, water, calories } = health;

  const set = (key: "protein" | "veggies" | "water", v: number) =>
    setHealth({ [key]: v });

  const proteinPct = Math.min(100, Math.round((protein / proteinTarget) * 100));
  const veggiesPct = Math.min(100, Math.round((veggies / 400) * 100));
  const waterPct = Math.min(100, Math.round((water / waterGoal) * 100));
  const caloriesPct = Math.min(100, Math.round((calories / calorieGoal) * 100));

  const activityLabelKey =
    `nutrition_activity_${activityInfo.key}` as keyof typeof tr;

  const calorieNote = ageCalorieNote(age, lang);

  // Build AI tips
  const aiTips: string[] = [];
  if (protein > 0 && proteinPct < 80) {
    if (age !== null && age >= 60) {
      const ageTip =
        lang === "de"
          ? `Ab ${age >= 70 ? "70" : "60"} Jahren braucht dein Körper mehr Protein (${age >= 70 ? "≥2,2" : "≥2,0"}g/kg) um Muskelabbau (Sarkopenie) aktiv zu bekämpfen.`
          : lang === "ru"
            ? `После ${age >= 70 ? "70" : "60"} лет организму требуется больше белка (${age >= 70 ? "≥2,2" : "≥2,0"} г/кг) для борьбы с саркопенией.`
            : lang === "zh"
              ? `${age >= 70 ? "70" : "60"}岁以上需要更多蛋白质（${age >= 70 ? "≥2.2" : "≥2.0"}g/kg）以积极对抗肌肉流失（肌少症）。`
              : `After age ${age >= 70 ? "70" : "60"}, your body needs more protein (${age >= 70 ? "≥2.2" : "≥2.0"}g/kg) to actively combat muscle loss (sarcopenia).`;
      aiTips.push(ageTip);
    }
    aiTips.push(...(tr.ai_tip_protein as unknown as string[]));
  }
  if (veggies > 0 && veggiesPct < 80)
    aiTips.push(...(tr.ai_tip_veggies as unknown as string[]));
  if (water > 0 && waterPct < 80) {
    if (age !== null && age >= 65) {
      const waterAgeTip =
        lang === "de"
          ? "Ab 65 Jahren lässt das Durstgefühl nach. Trinke regelmäßig -- auch ohne Durst -- mindestens 2,5 L täglich."
          : lang === "ru"
            ? "После 65 лет чувство жажды снижается. Пейте регулярно, не дожидаясь жажды -- минимум 2,5 л в день."
            : lang === "zh"
              ? "65岁以上口渴感减弱。即使不渴也要定期喝水，每天至少2.5升。"
              : "After 65 your thirst sensation diminishes. Drink regularly even without thirst -- at least 2.5 L per day.";
      aiTips.push(waterAgeTip);
    }
    aiTips.push(...(tr.ai_tip_water as unknown as string[]));
  }
  if (calories > 0 && caloriesPct < 60) {
    if (age !== null && age >= 65) {
      const lowCalAgeTip =
        lang === "de"
          ? "Zu wenig Kalorien ab 65 Jahren beschleunigt den Muskelschwund. Stelle sicher, dass du genug isst -- besonders protein- und nährstoffreiche Mahlzeiten."
          : lang === "ru"
            ? "Слишком мало калорий после 65 лет ускоряет потерю мышечной массы. Убедитесь, что едите достаточно -- особенно богатые белком блюда."
            : lang === "zh"
              ? "65岁以上热量摄入不足会加速肌肉流失。确保摄入足够热量，尤其是富含蛋白质的食物。"
              : "Too few calories after age 65 accelerates muscle loss. Make sure you eat enough -- especially protein-rich, nutrient-dense meals.";
      aiTips.push(lowCalAgeTip);
    }
    aiTips.push(...(tr.ai_tip_calories_low as unknown as string[]));
  } else if (calories > 0 && caloriesPct > 130)
    aiTips.push(...(tr.ai_tip_calories_high as unknown as string[]));

  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-green-accent/15 flex items-center justify-center text-green-accent shrink-0">
          <Salad className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-display font-semibold text-sm text-foreground">
            {tr.nutrition_title}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {tr.nutrition_desc}
          </p>
        </div>
      </div>

      {/* BMR + Activity + TDEE Tiles */}
      <div className="mb-5 space-y-2">
        {/* BMR */}
        <div className="rounded-xl bg-white/5 border border-border/40 px-4 py-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gold/15 flex items-center justify-center text-gold shrink-0">
            <Flame className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-xs text-muted-foreground block">
              {tr.nutrition_bmr}
            </span>
            {bmr !== null ? (
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-bold text-gold leading-tight">
                  {bmr.toLocaleString()}
                </span>
                <span className="text-xs text-muted-foreground">
                  {tr.nutrition_bmr_unit}
                </span>
              </div>
            ) : (
              <span className="text-xs text-muted-foreground/70 italic">
                {tr.nutrition_bmr_missing}
              </span>
            )}
          </div>
        </div>

        {/* Activity Level (derived from Exercise card) */}
        {bmr !== null && (
          <div className="rounded-xl bg-white/5 border border-border/40 px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center text-blue-400 shrink-0">
              <Activity className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-xs text-muted-foreground block">
                {tr.nutrition_activity_label}
              </span>
              <span className="text-sm font-semibold text-foreground leading-tight">
                {tr[activityLabelKey] as string}
              </span>
              <span className="text-[10px] text-muted-foreground/70 block mt-0.5">
                {tr.nutrition_activity_from_movement}
              </span>
            </div>
          </div>
        )}

        {/* TDEE */}
        {tdee !== null && (
          <div className="rounded-xl bg-white/5 border border-border/40 px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-green-accent/15 flex items-center justify-center text-green-accent shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-xs text-muted-foreground block">
                {tr.nutrition_tdee}
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-bold text-green-accent leading-tight">
                  {tdee.toLocaleString()}
                </span>
                <span className="text-xs text-muted-foreground">
                  {tr.nutrition_tdee_unit}
                </span>
              </div>
              {ageMetabolicFactor < 1 && (
                <span className="text-[10px] text-gold/80 block mt-0.5">
                  {lang === "de"
                    ? `Alterskorrektur ${age! >= 70 ? "−10%" : "−5%"} angewandt`
                    : lang === "ru"
                      ? `Возрастная коррекция ${age! >= 70 ? "−10%" : "−5%"} применена`
                      : lang === "zh"
                        ? `已应用年龄修正系数 ${age! >= 70 ? "−10%" : "−5%"}`
                        : `Age correction ${age! >= 70 ? "−10%" : "−5%"} applied`}
                </span>
              )}
              {calorieNote && (
                <span className="text-[10px] text-muted-foreground/70 block mt-0.5">
                  {calorieNote}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-5">
        {/* Calorie Intake */}
        <div>
          <div className="flex justify-between items-baseline mb-2">
            <span className="text-xs font-medium text-foreground flex items-center gap-1.5">
              <Utensils className="w-3 h-3 text-muted-foreground" />
              {tr.nutrition_calories}
            </span>
            <span className="text-xs text-muted-foreground">
              <span
                className={`font-semibold ${
                  calories >= calorieGoal
                    ? "text-green-accent"
                    : "text-foreground"
                }`}
              >
                {calories.toLocaleString()} kcal
              </span>
              {" / "}
              {calorieGoal.toLocaleString()} kcal
            </span>
          </div>
          <Slider
            min={0}
            max={calorieMax}
            step={50}
            value={[calories]}
            onValueChange={([v]) => setHealth({ calories: v })}
            className="w-full"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            <span>0 kcal</span>
            <span className="text-green-accent/70">
              {tr.nutrition_calories_goal}: {calorieGoal.toLocaleString()} kcal
            </span>
          </div>
        </div>

        {/* Protein */}
        <div>
          <div className="flex justify-between items-baseline mb-2">
            <span className="text-xs font-medium text-foreground">
              {tr.nutrition_protein}
            </span>
            <span className="text-xs text-muted-foreground">
              <span
                className={`font-semibold ${
                  proteinPct >= 100 ? "text-green-accent" : "text-foreground"
                }`}
              >
                {protein}g
              </span>
              {" / "}
              {proteinTarget}g
            </span>
          </div>
          <Slider
            min={0}
            max={proteinTarget * 1.5}
            step={1}
            value={[protein]}
            onValueChange={([v]) => set("protein", v)}
            className="w-full"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            <span>0g</span>
            <span className="text-green-accent/70">
              {tr.nutrition_goal}: {proteinTarget}g
              {age !== null && age >= 60 ? ` (${proteinMultiplier}g/kg)` : ""}
            </span>
          </div>
        </div>

        {/* Vegetables */}
        <div>
          <div className="flex justify-between items-baseline mb-2">
            <span className="text-xs font-medium text-foreground">
              {tr.nutrition_veggies}
            </span>
            <span className="text-xs text-muted-foreground">
              <span
                className={`font-semibold ${
                  veggiesPct >= 100 ? "text-green-accent" : "text-foreground"
                }`}
              >
                {veggies}g
              </span>
              {" / 400g"}
            </span>
          </div>
          <Slider
            min={0}
            max={600}
            step={10}
            value={[veggies]}
            onValueChange={([v]) => set("veggies", v)}
            className="w-full"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            <span>0g</span>
            <span className="text-green-accent/70">
              {tr.nutrition_goal}: 400g
            </span>
          </div>
        </div>

        {/* Water */}
        <div>
          <div className="flex justify-between items-baseline mb-2">
            <span className="text-xs font-medium text-foreground">
              {tr.nutrition_water}
            </span>
            <span className="text-xs text-muted-foreground">
              <span
                className={`font-semibold ${
                  water >= waterGoal ? "text-green-accent" : "text-foreground"
                }`}
              >
                {water.toFixed(1)}L
              </span>
              {` / min. ${waterGoal.toFixed(1)}L`}
            </span>
          </div>
          <Slider
            min={0}
            max={4}
            step={0.1}
            value={[water]}
            onValueChange={([v]) =>
              set("water", Number.parseFloat(v.toFixed(1)))
            }
            className="w-full"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            <span>0L</span>
            <span className="text-green-accent/70">
              {tr.nutrition_goal}: {waterGoal.toFixed(1)}L
              {age !== null && age >= 65 ? " (65+)" : ""}
            </span>
          </div>
        </div>

        {/* Progress summary */}
        <div className="pt-1 border-t border-border/30 grid grid-cols-4 gap-2 text-center">
          <ProgressDot pct={caloriesPct} label={tr.nutrition_calories_short} />
          <ProgressDot pct={proteinPct} label={tr.nutrition_protein_short} />
          <ProgressDot pct={veggiesPct} label={tr.nutrition_veggies_short} />
          <ProgressDot pct={waterPct} label={tr.nutrition_water_short} />
        </div>

        {/* AI Tips */}
        <AiTip tips={aiTips} />
      </div>
    </div>
  );
}

function ProgressDot({ pct, label }: { pct: number; label: string }) {
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
            className={pct >= 100 ? "text-green-accent" : "text-gold"}
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
