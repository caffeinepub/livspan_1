import { Button } from "@/components/ui/button";
import { Pencil, Timer, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useDailyHealth } from "../hooks/useDailyHealth";
import { useLanguage } from "../hooks/useLanguage";
import { useGetCallerProfile } from "../hooks/useQueries";
import { t } from "../i18n";
import AiTip from "./AiTip";

function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function computePhase(
  startMin: number,
  endMin: number,
  nowMin: number,
  nowSec: number,
): {
  phase: "fasting" | "eating";
  remainingSeconds: number;
  totalSeconds: number;
  progressFraction: number;
} {
  const DAY = 24 * 60;
  const fastingDur =
    endMin >= startMin ? endMin - startMin : DAY - startMin + endMin;
  const eatingDur = DAY - fastingDur;

  let inFasting: boolean;
  if (endMin >= startMin) {
    inFasting = nowMin >= startMin && nowMin < endMin;
  } else {
    inFasting = nowMin >= startMin || nowMin < endMin;
  }

  if (inFasting) {
    let elapsed: number;
    if (nowMin >= startMin) {
      elapsed = nowMin - startMin;
    } else {
      elapsed = DAY - startMin + nowMin;
    }
    const elapsedSec = elapsed * 60 + (nowSec % 60);
    const totalSec = fastingDur * 60;
    const remainingSec = Math.max(0, totalSec - elapsedSec);
    return {
      phase: "fasting",
      remainingSeconds: remainingSec,
      totalSeconds: totalSec,
      progressFraction: Math.min(1, elapsedSec / totalSec),
    };
  }
  let elapsed: number;
  if (nowMin >= endMin) {
    elapsed = nowMin - endMin;
  } else {
    elapsed = DAY - endMin + nowMin;
  }
  const elapsedSec = elapsed * 60 + (nowSec % 60);
  const totalSec = eatingDur * 60;
  const remainingSec = Math.max(0, totalSec - elapsedSec);
  return {
    phase: "eating",
    remainingSeconds: remainingSec,
    totalSeconds: totalSec,
    progressFraction: Math.min(1, elapsedSec / totalSec),
  };
}

function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [
    String(h).padStart(2, "0"),
    String(m).padStart(2, "0"),
    String(s).padStart(2, "0"),
  ].join(":");
}

function fastingRecommendationForAge(age: number | null): {
  window: string;
  hours: number;
  label: string;
} {
  if (age !== null && age >= 65)
    return { window: "12:12", hours: 12, label: "12:12" };
  if (age !== null && age >= 50)
    return { window: "14:10", hours: 14, label: "14:10" };
  return { window: "16:8", hours: 16, label: "16:8" };
}

function ageAdaptedFastingTip(lang: string, age: number | null): string {
  const ageLabel = age !== null ? age : "?";
  if (age !== null && age >= 65) {
    switch (lang) {
      case "de":
        return `Mit ${ageLabel} Jahren empfiehlt sich ein mildes 12:12-Fasten, das leichter verträglich ist und dennoch die Autophagie anregt. Längere Fastenfenster können in diesem Alter den Muskelabbau fördern.`;
      case "ru":
        return `В ${ageLabel} лет рекомендуется мягкое голодание 12:12, которое легче переносится и при этом стимулирует аутофагию. Более длительное голодание в этом возрасте может усилить потерю мышечной массы.`;
      case "zh":
        return `在${ageLabel}岁时，建议采用温和的12:12轻断食方案，更易耐受且仍能激活自噬。更长的断食窗口在此年龄段可能加速肌肉流失。`;
      default:
        return `At ${ageLabel}, a gentle 12:12 fasting protocol is recommended -- easier to tolerate while still activating autophagy. Longer fasting windows at this age may accelerate muscle loss.`;
    }
  }
  if (age !== null && age >= 50) {
    switch (lang) {
      case "de":
        return `Mit ${ageLabel} Jahren ist 14:10-Fasten ideal: Es unterstützt Zellregeneration und Insulinsensitivität, ohne den Proteinbedarf zu gefährden. Achte auf ausreichend Protein im Essensfenster.`;
      case "ru":
        return `В ${ageLabel} лет идеально голодание 14:10: поддерживает клеточную регенерацию и чувствительность к инсулину, не угрожая потребности в белке. Следите за достаточным потреблением белка в период еды.`;
      case "zh":
        return `在${ageLabel}岁，14:10断食方案最为理想：支持细胞再生和胰岛素敏感性，同时不影响蛋白质需求。请确保在进食窗口内摄入足够蛋白质。`;
      default:
        return `At ${ageLabel}, 14:10 fasting is ideal: it supports cellular regeneration and insulin sensitivity without compromising protein needs. Make sure to get adequate protein during your eating window.`;
    }
  }
  // Under 50
  switch (lang) {
    case "de":
      return `16:8-Fasten ist für dein Alter (${ageLabel} Jahre) gut geeignet und unterstützt Autophagie, Insulinsensitivität und Körpergewichtsmanagement.`;
    case "ru":
      return `Голодание 16:8 хорошо подходит для вашего возраста (${ageLabel} лет) и поддерживает аутофагию, чувствительность к инсулину и контроль веса.`;
    case "zh":
      return `16:8断食对您的年龄（${ageLabel}岁）非常适合，有助于促进自噬、改善胰岛素敏感性和体重管理。`;
    default:
      return `16:8 fasting is well-suited for your age (${ageLabel}) and supports autophagy, insulin sensitivity, and weight management.`;
  }
}

const RING_SIZE = 130;
const STROKE = 8;
const RADIUS = (RING_SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function PhaseRing({
  fraction,
  phase,
}: {
  fraction: number;
  phase: "fasting" | "eating";
}) {
  const offset = CIRCUMFERENCE * (1 - fraction);
  const color =
    phase === "fasting" ? "oklch(0.65 0.15 250)" : "oklch(0.76 0.14 148)";

  return (
    <svg
      width={RING_SIZE}
      height={RING_SIZE}
      style={{ transform: "rotate(-90deg)" }}
      aria-hidden="true"
    >
      <circle
        cx={RING_SIZE / 2}
        cy={RING_SIZE / 2}
        r={RADIUS}
        fill="none"
        stroke="oklch(0.3 0.02 200)"
        strokeWidth={STROKE}
      />
      <circle
        cx={RING_SIZE / 2}
        cy={RING_SIZE / 2}
        r={RADIUS}
        fill="none"
        stroke={color}
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeDasharray={`${CIRCUMFERENCE}`}
        strokeDashoffset={offset}
        style={{ transition: "stroke-dashoffset 1s linear" }}
      />
    </svg>
  );
}

export default function FastingCard() {
  const { lang } = useLanguage();
  const tr = t[lang];
  const { health, setHealth } = useDailyHealth();
  const { data: profile } = useGetCallerProfile();

  const currentYear = new Date().getFullYear();
  const birthYear = (profile as any)?.birthYear
    ? Number((profile as any).birthYear)
    : null;
  const age = birthYear ? currentYear - birthYear : null;

  const fastingStart = health.fastingStart;
  const fastingEnd = health.fastingEnd;
  const hasSchedule = !!fastingStart && !!fastingEnd;

  const [editMode, setEditMode] = useState(false);
  const [draftStart, setDraftStart] = useState(fastingStart ?? "20:00");
  const [draftEnd, setDraftEnd] = useState(fastingEnd ?? "12:00");

  const [now, setNow] = useState(() => new Date());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => setNow(new Date()), 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Sync draft state when context loads fasting data
  useEffect(() => {
    if (fastingStart) setDraftStart(fastingStart);
    if (fastingEnd) setDraftEnd(fastingEnd);
  }, [fastingStart, fastingEnd]);

  const handleEdit = () => {
    setDraftStart(fastingStart ?? "20:00");
    setDraftEnd(fastingEnd ?? "12:00");
    setEditMode(true);
  };

  const handleSave = () => {
    if (draftStart === draftEnd) return;
    setHealth({ fastingStart: draftStart, fastingEnd: draftEnd });
    setEditMode(false);
  };

  const handleCancel = () => setEditMode(false);

  let phaseInfo: ReturnType<typeof computePhase> | null = null;
  if (hasSchedule) {
    const startMin = timeToMinutes(fastingStart!);
    const endMin = timeToMinutes(fastingEnd!);
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const nowSec = now.getSeconds();
    phaseInfo = computePhase(startMin, endMin, nowMin, nowSec);
  }

  // Compute actual fasting window hours
  let actualFastingHours = 0;
  if (hasSchedule) {
    const startMin = timeToMinutes(fastingStart!);
    const endMin = timeToMinutes(fastingEnd!);
    const DAY = 24 * 60;
    actualFastingHours =
      Math.round(
        ((endMin >= startMin ? endMin - startMin : DAY - startMin + endMin) /
          60) *
          10,
      ) / 10;
  }

  const rec = fastingRecommendationForAge(age);
  const aiTip = ageAdaptedFastingTip(lang, age);

  // Show AI tip if fasting window is shorter than recommended
  const showAiTip = !hasSchedule || actualFastingHours < rec.hours - 1;

  return (
    <div className="glass-card rounded-2xl p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-500/15 flex items-center justify-center text-blue-400 shrink-0">
            <Timer className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-sm text-foreground">
              {tr.fasting_title}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {tr.fasting_desc}
            </p>
          </div>
        </div>
        {hasSchedule && !editMode && (
          <button
            type="button"
            onClick={handleEdit}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
            aria-label={tr.fasting_edit}
            data-ocid="fasting.edit_button"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Age-adapted recommendation badge */}
      {age !== null && (
        <div className="mb-3 flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <span className="text-[10px] text-blue-300/80">
            {lang === "de"
              ? `Empfehlung für dein Alter (${age} J.): ${rec.label}-Fasten`
              : lang === "ru"
                ? `Рекомендация для вашего возраста (${age} л.): ${rec.label} голодание`
                : lang === "zh"
                  ? `适合您年龄（${age}岁）的方案：${rec.label}断食`
                  : `Recommended for your age (${age}): ${rec.label} fasting`}
          </span>
        </div>
      )}

      {/* No schedule */}
      {!hasSchedule && !editMode && (
        <div className="text-center py-4" data-ocid="fasting.empty_state">
          <p className="text-sm text-muted-foreground mb-3">
            {tr.fasting_no_schedule}
          </p>
          <Button
            size="sm"
            onClick={() => setEditMode(true)}
            className="rounded-full px-4 bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 border border-blue-500/30 text-xs font-semibold"
            data-ocid="fasting.primary_button"
          >
            {tr.fasting_set_schedule}
          </Button>
        </div>
      )}

      {/* Edit form */}
      {editMode && (
        <div className="space-y-4" data-ocid="fasting.panel">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="fasting-start"
                className="text-xs text-muted-foreground mb-1 block"
              >
                {tr.fasting_start}
              </label>
              <input
                id="fasting-start"
                type="time"
                value={draftStart}
                onChange={(e) => setDraftStart(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm bg-muted/40 border border-border/50 text-foreground focus:outline-none focus:border-blue-400/60 transition-colors"
                data-ocid="fasting.input"
              />
            </div>
            <div>
              <label
                htmlFor="fasting-end"
                className="text-xs text-muted-foreground mb-1 block"
              >
                {tr.fasting_end}
              </label>
              <input
                id="fasting-end"
                type="time"
                value={draftEnd}
                onChange={(e) => setDraftEnd(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm bg-muted/40 border border-border/50 text-foreground focus:outline-none focus:border-blue-400/60 transition-colors"
                data-ocid="fasting.input"
              />
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground">
            "Fasting windows spanning midnight are supported (e.g. 20:00 –
            12:00)."
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleSave}
              disabled={draftStart === draftEnd}
              className="flex-1 rounded-lg bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 border border-blue-500/30 text-xs font-semibold"
              data-ocid="fasting.save_button"
            >
              {tr.fasting_save}
            </Button>
            {hasSchedule && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCancel}
                className="rounded-lg text-xs text-muted-foreground"
                data-ocid="fasting.cancel_button"
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Live view */}
      {hasSchedule && !editMode && phaseInfo && (
        <div className="flex flex-col items-center gap-3">
          <div className="relative flex items-center justify-center">
            <PhaseRing
              fraction={phaseInfo.progressFraction}
              phase={phaseInfo.phase}
            />
            <div className="absolute flex flex-col items-center">
              <span
                className={`text-base font-mono font-bold tracking-tight ${
                  phaseInfo.phase === "fasting"
                    ? "text-blue-400"
                    : "text-green-accent"
                }`}
              >
                {formatDuration(phaseInfo.remainingSeconds)}
              </span>
              <span className="text-[9px] text-muted-foreground mt-0.5">
                {tr.fasting_remaining}
              </span>
            </div>
          </div>

          <div className="text-center">
            <span
              className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                phaseInfo.phase === "fasting"
                  ? "bg-blue-500/15 text-blue-400"
                  : "bg-green-accent/15 text-green-accent"
              }`}
            >
              {phaseInfo.phase === "fasting"
                ? tr.fasting_phase
                : tr.eating_phase}
            </span>
          </div>

          <div className="w-full flex items-center justify-between text-[10px] text-muted-foreground px-1">
            <div className="text-center">
              <p className="font-semibold text-foreground text-xs">
                {fastingStart}
              </p>
              <p>{tr.fasting_start}</p>
            </div>
            <div className="flex-1 mx-2 border-t border-dashed border-border/40" />
            <div className="text-center">
              <p className="font-semibold text-foreground text-xs">
                {fastingEnd}
              </p>
              <p>{tr.fasting_end}</p>
            </div>
          </div>

          <div className="w-full">
            <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
              <span>{tr.fasting_progress}</span>
              <span>{Math.round(phaseInfo.progressFraction * 100)}%</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-muted/40 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${
                  phaseInfo.phase === "fasting"
                    ? "bg-blue-400"
                    : "bg-green-accent"
                }`}
                style={{ width: `${phaseInfo.progressFraction * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* AI Tip */}
      {showAiTip && <AiTip tips={[aiTip]} />}
    </div>
  );
}
