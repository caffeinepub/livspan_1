import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Flame, Salad, Utensils, Zap } from "lucide-react";
import { useState } from "react";
import { useDailyHealth } from "../hooks/useDailyHealth";
import { useLanguage } from "../hooks/useLanguage";
import { useGetCallerProfile } from "../hooks/useQueries";
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

export default function NutritionCard() {
  const { lang } = useLanguage();
  const tr = t[lang];
  const { data: profile } = useGetCallerProfile();
  const { health, setHealth } = useDailyHealth();
  const [activityLevel, setActivityLevel] = useState("moderate");

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
    bmr !== null ? Math.round(bmr * ACTIVITY_FACTORS[activityLevel]) : null;

  const calorieGoal = tdee ?? 2000;
  const calorieMax = tdee ? Math.round(tdee * 1.5) : 4000;

  const proteinTarget = Math.round(weightKg * 1.8);

  const { protein, veggies, water, calories } = health;

  const set = (key: "protein" | "veggies" | "water", v: number) =>
    setHealth({ [key]: v });

  const proteinPct = Math.min(100, Math.round((protein / proteinTarget) * 100));
  const veggiesPct = Math.min(100, Math.round((veggies / 400) * 100));
  const waterPct = Math.min(100, Math.round((water / 2) * 100));
  const caloriesPct = Math.min(100, Math.round((calories / calorieGoal) * 100));

  const activityOptions = [
    { value: "sedentary", label: tr.nutrition_activity_sedentary },
    { value: "light", label: tr.nutrition_activity_light },
    { value: "moderate", label: tr.nutrition_activity_moderate },
    { value: "active", label: tr.nutrition_activity_active },
    { value: "very_active", label: tr.nutrition_activity_very_active },
  ];

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

      {/* BMR + TDEE Tiles */}
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

        {/* Activity Level Selector */}
        {bmr !== null && (
          <div className="rounded-xl bg-white/5 border border-border/40 px-4 py-3">
            <span className="text-xs text-muted-foreground block mb-2">
              {tr.nutrition_activity_label}
            </span>
            <Select value={activityLevel} onValueChange={setActivityLevel}>
              <SelectTrigger className="bg-input border-border/60 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {activityOptions.map((opt) => (
                  <SelectItem
                    key={opt.value}
                    value={opt.value}
                    className="text-xs"
                  >
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                  water >= 2 ? "text-green-accent" : "text-foreground"
                }`}
              >
                {water.toFixed(1)}L
              </span>
              {" / min. 2L"}
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
              {tr.nutrition_goal}: 2L
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
