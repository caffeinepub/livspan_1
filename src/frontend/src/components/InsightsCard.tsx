import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { Lightbulb, Minus, TrendingDown, TrendingUp } from "lucide-react";
import type { DailyHealthData, ScoreEntry } from "../backend.d";
import { useActor } from "../hooks/useActor";
import { useGetCallerProfile } from "../hooks/useQueries";

type Status = "good" | "warning" | "bad";

interface Insight {
  icon: string;
  label: { de: string; en: string };
  status: Status;
  detail: { de: string; en: string };
}

function getLast7Days(): string[] {
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
    );
  }
  return days;
}

// Age-adapted BP thresholds – same logic as StressCard
function bpGreenThreshold(age: number | null): {
  sysGreen: number;
  sysWarning: number;
} {
  if (age !== null && age >= 80) return { sysGreen: 145, sysWarning: 160 };
  if (age !== null && age >= 60) return { sysGreen: 139, sysWarning: 150 };
  if (age !== null && age >= 45) return { sysGreen: 130, sysWarning: 140 };
  if (age !== null && age >= 30) return { sysGreen: 125, sysWarning: 135 };
  return { sysGreen: 120, sysWarning: 130 };
}

function buildInsights(
  healthData: DailyHealthData[],
  scoreHistory: ScoreEntry[],
  age: number | null,
): Insight[] {
  const last7 = getLast7Days();
  const relevant = healthData.filter((d) => last7.includes(d.date));

  const insights: Insight[] = [];

  // Sleep
  const sleepDays = relevant.filter(
    (d) => d.sleepDuration !== undefined && d.sleepDuration > 0,
  );
  if (sleepDays.length > 0) {
    const avg =
      sleepDays.reduce((s, d) => s + (d.sleepDuration ?? 0), 0) /
      sleepDays.length;
    const rounded = Math.round(avg * 10) / 10;
    const status: Status = avg >= 7 ? "good" : avg >= 6 ? "warning" : "bad";
    insights.push({
      icon: "😴",
      label: { de: "Schlaf", en: "Sleep" },
      status,
      detail: {
        de: `Ø ${rounded}h / Tag (${sleepDays.length} Tage)`,
        en: `Avg ${rounded}h / day (${sleepDays.length} days)`,
      },
    });
  }

  // Score trend
  const last7Scores = scoreHistory
    .filter((s) => last7.includes(s.date))
    .sort((a, b) => a.date.localeCompare(b.date));
  if (last7Scores.length >= 4) {
    const recent = last7Scores.slice(-3);
    const older = last7Scores.slice(0, last7Scores.length - 3);
    const avgRecent = recent.reduce((s, e) => s + e.score, 0) / recent.length;
    const avgOlder = older.reduce((s, e) => s + e.score, 0) / older.length;
    const diff = avgRecent - avgOlder;
    const status: Status = diff >= 3 ? "good" : diff <= -3 ? "bad" : "warning";
    const sign = diff > 0 ? "+" : "";
    insights.push({
      icon: diff >= 3 ? "📈" : diff <= -3 ? "📉" : "📊",
      label: { de: "Score-Trend", en: "Score Trend" },
      status,
      detail: {
        de: `${diff >= 3 ? "Steigend" : diff <= -3 ? "Fallend" : "Stabil"} (${sign}${Math.round(diff)} Pkt)`,
        en: `${diff >= 3 ? "Improving" : diff <= -3 ? "Declining" : "Stable"} (${sign}${Math.round(diff)} pts)`,
      },
    });
  }

  // Nutrition — protein
  const proteinDays = relevant.filter(
    (d) => d.protein !== undefined && d.protein > 0,
  ).length;
  if (relevant.length > 0) {
    const status: Status =
      proteinDays >= 5 ? "good" : proteinDays >= 3 ? "warning" : "bad";
    insights.push({
      icon: "🥩",
      label: { de: "Protein", en: "Protein" },
      status,
      detail: {
        de: `${proteinDays} von ${relevant.length} Tagen getrackt`,
        en: `${proteinDays} of ${relevant.length} days tracked`,
      },
    });
  }

  // Water
  const waterDays = relevant.filter(
    (d) => d.water !== undefined && d.water > 0,
  ).length;
  if (relevant.length > 0) {
    const status: Status =
      waterDays >= 5 ? "good" : waterDays >= 3 ? "warning" : "bad";
    insights.push({
      icon: "💧",
      label: { de: "Wasser", en: "Water" },
      status,
      detail: {
        de: `${waterDays} von ${relevant.length} Tagen getrackt`,
        en: `${waterDays} of ${relevant.length} days tracked`,
      },
    });
  }

  // Movement
  const moveDays = relevant.filter(
    (d) => d.movementDuration !== undefined && d.movementDuration > 0,
  ).length;
  if (relevant.length > 0) {
    const status: Status =
      moveDays >= 4 ? "good" : moveDays >= 2 ? "warning" : "bad";
    insights.push({
      icon: "🏃",
      label: { de: "Bewegung", en: "Exercise" },
      status,
      detail: {
        de: `${moveDays} von ${relevant.length} Tagen aktiv`,
        en: `${moveDays} of ${relevant.length} days active`,
      },
    });
  }

  // Fasting
  const fastDays = relevant.filter(
    (d) => d.fastingStart !== undefined && d.fastingStart !== "",
  ).length;
  if (relevant.length > 0) {
    const status: Status =
      fastDays >= 4 ? "good" : fastDays >= 2 ? "warning" : "bad";
    insights.push({
      icon: "⏱️",
      label: { de: "Fasten", en: "Fasting" },
      status,
      detail: {
        de: `${fastDays} von ${relevant.length} Tagen gefastet`,
        en: `${fastDays} of ${relevant.length} days fasted`,
      },
    });
  }

  // Stress / BP — age-adapted thresholds
  const bpDays = relevant.filter(
    (d) => d.systolic !== undefined && d.systolic > 0,
  );
  if (bpDays.length > 0) {
    const avgSys =
      bpDays.reduce((s, d) => s + (d.systolic ?? 0), 0) / bpDays.length;
    const rounded = Math.round(avgSys);
    const { sysGreen, sysWarning } = bpGreenThreshold(age);
    const status: Status =
      avgSys <= sysGreen ? "good" : avgSys <= sysWarning ? "warning" : "bad";
    insights.push({
      icon: "❤️",
      label: { de: "Blutdruck", en: "Blood Pressure" },
      status,
      detail: {
        de: `Ø ${rounded} mmHg systolisch`,
        en: `Avg ${rounded} mmHg systolic`,
      },
    });
  }

  return insights;
}

const statusColors: Record<Status, string> = {
  good: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  warning: "bg-amber-500/15 text-amber-400 border-amber-500/25",
  bad: "bg-red-500/15 text-red-400 border-red-500/25",
};

const statusLabel: Record<Status, { de: string; en: string }> = {
  good: { de: "Gut", en: "Good" },
  warning: { de: "OK", en: "OK" },
  bad: { de: "Verbessern", en: "Improve" },
};

function StatusIcon({ status }: { status: Status }) {
  if (status === "good") return <TrendingUp className="w-3 h-3" />;
  if (status === "bad") return <TrendingDown className="w-3 h-3" />;
  return <Minus className="w-3 h-3" />;
}

export default function InsightsCard() {
  const { actor, isFetching: actorFetching } = useActor();
  const { data: profile } = useGetCallerProfile();

  const birthYear = (profile as any)?.birthYear
    ? Number((profile as any).birthYear)
    : null;
  const age = birthYear ? new Date().getFullYear() - birthYear : null;

  const { data: healthData = [], isLoading: healthLoading } = useQuery<
    DailyHealthData[]
  >({
    queryKey: ["allHealthData"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllHealthData();
    },
    enabled: !!actor && !actorFetching,
  });

  const { data: scoreHistory = [], isLoading: scoreLoading } = useQuery<
    ScoreEntry[]
  >({
    queryKey: ["scoreHistory"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getScoreHistoryForCaller();
    },
    enabled: !!actor && !actorFetching,
  });

  const isLoading = healthLoading || scoreLoading || actorFetching;

  const last7 = getLast7Days();
  const daysWithData = healthData.filter((d) => last7.includes(d.date)).length;
  const hasEnoughData = daysWithData >= 2;

  const insights = hasEnoughData
    ? buildInsights(healthData, scoreHistory, age)
    : [];

  return (
    <div className="glass-card rounded-2xl p-5">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-xl bg-violet-500/15 flex items-center justify-center text-violet-400 shrink-0">
          <Lightbulb className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-display font-semibold text-sm text-foreground">
            {"Weekly Insights"}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {"Your last 7 days at a glance"}
          </p>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3" data-ocid="insights.loading_state">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="w-7 h-7 rounded-lg" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="w-16 h-5 rounded-full" />
            </div>
          ))}
        </div>
      )}

      {/* Not enough data */}
      {!isLoading && !hasEnoughData && (
        <div className="text-center py-6" data-ocid="insights.empty_state">
          <div className="text-3xl mb-3">📊</div>
          <p className="text-sm text-foreground font-medium mb-1">
            {"Not enough data yet"}
          </p>
          <p className="text-xs text-muted-foreground max-w-[220px] mx-auto">
            {"Track at least 2 days to see insights."}
          </p>
        </div>
      )}

      {/* Insights list */}
      {!isLoading && hasEnoughData && (
        <div className="space-y-2.5" data-ocid="insights.list">
          {insights.map((insight, idx) => (
            <div
              key={insight.label.de}
              className="flex items-center gap-3 py-1"
              data-ocid={`insights.item.${idx + 1}`}
            >
              <span className="text-lg w-7 text-center shrink-0">
                {insight.icon}
              </span>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-medium text-foreground">
                  {insight.label.en}
                </span>
                <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">
                  {insight.detail.en}
                </p>
              </div>
              <div
                className={`flex items-center gap-1 px-2 py-1 rounded-full border text-[10px] font-semibold shrink-0 ${
                  statusColors[insight.status]
                }`}
              >
                <StatusIcon status={insight.status} />
                <span>{statusLabel[insight.status].en}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer hint */}
      {!isLoading && hasEnoughData && (
        <p className="text-[10px] text-muted-foreground mt-4 pt-3 border-t border-border/30 text-center">
          {`Based on ${daysWithData} days in the last 7 days`}
        </p>
      )}
    </div>
  );
}
