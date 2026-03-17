import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { User } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useLanguage } from "../hooks/useLanguage";
import { useGetCallerProfile, useSaveProfile } from "../hooks/useQueries";
import { t } from "../i18n";

function calcAge(birthYear: string): number | null {
  const by = Number.parseInt(birthYear, 10);
  if (
    !birthYear ||
    Number.isNaN(by) ||
    by < 1900 ||
    by > new Date().getFullYear()
  )
    return null;
  return new Date().getFullYear() - by;
}

function calcBMI(weightKg: string, heightCm: string): number | null {
  const w = Number.parseFloat(weightKg);
  const h = Number.parseFloat(heightCm);
  if (!w || !h || Number.isNaN(w) || Number.isNaN(h) || h <= 0) return null;
  return w / ((h / 100) * (h / 100));
}

export default function PersonalDataCard() {
  const { lang } = useLanguage();
  const tr = t[lang];

  const { data: profile } = useGetCallerProfile();
  const saveProfile = useSaveProfile();

  const [birthYear, setBirthYear] = useState("");
  const [gender, setGender] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [bodyFat, setBodyFat] = useState("");

  useEffect(() => {
    if (profile) {
      setBirthYear(profile.birthYear != null ? String(profile.birthYear) : "");
      setGender(profile.gender ?? "");
      setHeight(profile.heightCm != null ? String(profile.heightCm) : "");
      setWeight(profile.weightKg != null ? String(profile.weightKg) : "");
      setBodyFat(profile.bodyFatPct != null ? String(profile.bodyFatPct) : "");
    }
  }, [profile]);

  const handleSave = async () => {
    try {
      await saveProfile.mutateAsync({
        name: profile?.name ?? "",
        birthYear: birthYear ? BigInt(birthYear) : undefined,
        gender: gender || undefined,
        heightCm: height ? BigInt(Math.round(Number(height))) : undefined,
        weightKg: weight ? Number(weight) : undefined,
        bodyFatPct: bodyFat ? Number(bodyFat) : undefined,
      });
      toast.success(tr.profile_saved);
    } catch {
      toast.error(tr.profile_save_error);
    }
  };

  const age = calcAge(birthYear);
  const bmi = calcBMI(weight, height);

  const getBmiCategory = (bmiVal: number) => {
    if (bmiVal < 18.5)
      return { label: tr.bmi_underweight, color: "text-blue-400" };
    if (bmiVal < 25)
      return { label: tr.bmi_normal, color: "text-green-accent" };
    if (bmiVal < 30)
      return { label: tr.bmi_overweight, color: "text-yellow-400" };
    return { label: tr.bmi_obese, color: "text-red-400" };
  };

  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-green-accent/15 flex items-center justify-center text-green-accent shrink-0">
          <User className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-display font-semibold text-sm text-foreground">
            {tr.personal_data_title}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {tr.personal_data_desc}
          </p>
        </div>
      </div>

      {(age !== null || bmi !== null) && (
        <div className="grid grid-cols-2 gap-2 mb-4">
          {age !== null && (
            <div className="rounded-xl bg-white/5 border border-border/40 px-3 py-2 flex flex-col">
              <span className="text-xs text-muted-foreground">{tr.age}</span>
              <span className="text-lg font-bold text-green-accent leading-tight">
                {age}
                <span className="text-xs font-normal text-muted-foreground ml-1">
                  {tr.age_unit}
                </span>
              </span>
            </div>
          )}
          {bmi !== null &&
            (() => {
              const cat = getBmiCategory(bmi);
              return (
                <div className="rounded-xl bg-white/5 border border-border/40 px-3 py-2 flex flex-col">
                  <span className="text-xs text-muted-foreground">
                    {tr.bmi}
                  </span>
                  <span
                    className={`text-lg font-bold leading-tight ${cat.color}`}
                  >
                    {bmi.toFixed(1)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {cat.label}
                  </span>
                </div>
              );
            })()}
        </div>
      )}

      <div className="space-y-3">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">
            {tr.birth_year}
          </Label>
          <Input
            type="number"
            min={1900}
            max={2024}
            value={birthYear}
            onChange={(e) => setBirthYear(e.target.value)}
            placeholder="1990"
            className="bg-input border-border/60 focus:ring-green-accent focus:border-green-accent h-8 text-sm"
            data-ocid="profile.input"
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">{tr.gender}</Label>
          <Select value={gender} onValueChange={setGender}>
            <SelectTrigger
              className="bg-input border-border/60 h-8 text-sm"
              data-ocid="profile.select"
            >
              <SelectValue placeholder="—" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">{tr.gender_male}</SelectItem>
              <SelectItem value="female">{tr.gender_female}</SelectItem>
              <SelectItem value="other">{tr.gender_other}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{tr.height}</Label>
            <Input
              type="number"
              min={50}
              max={300}
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              placeholder="175"
              className="bg-input border-border/60 focus:ring-green-accent focus:border-green-accent h-8 text-sm"
              data-ocid="profile.input"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{tr.weight}</Label>
            <Input
              type="number"
              min={20}
              max={500}
              step={0.1}
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="70"
              className="bg-input border-border/60 focus:ring-green-accent focus:border-green-accent h-8 text-sm"
              data-ocid="profile.input"
            />
          </div>
        </div>

        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">{tr.body_fat}</Label>
          <Input
            type="number"
            min={1}
            max={70}
            step={0.1}
            value={bodyFat}
            onChange={(e) => setBodyFat(e.target.value)}
            placeholder="18.5"
            className="bg-input border-border/60 focus:ring-green-accent focus:border-green-accent h-8 text-sm"
            data-ocid="profile.input"
          />
        </div>

        <Button
          onClick={handleSave}
          disabled={saveProfile.isPending}
          size="sm"
          className="w-full rounded-lg bg-gold text-primary-foreground hover:opacity-90 font-semibold text-sm mt-1"
          data-ocid="profile.save_button"
        >
          {saveProfile.isPending ? tr.saving : tr.save}
        </Button>
      </div>
    </div>
  );
}
