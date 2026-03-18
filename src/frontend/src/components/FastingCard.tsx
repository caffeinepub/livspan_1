import { Button } from "@/components/ui/button";
import { Pencil, Timer, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useDailyHealth } from "../hooks/useDailyHealth";
import { useLanguage } from "../hooks/useLanguage";
import { t } from "../i18n";

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
    </div>
  );
}
