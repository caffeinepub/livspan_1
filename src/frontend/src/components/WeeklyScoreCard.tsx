import { Calendar, Minus, TrendingDown, TrendingUp } from "lucide-react";
import { useLanguage } from "../hooks/useLanguage";
import { useGetScoreHistory } from "../hooks/useQueries";
import { t } from "../i18n";

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getDayLabel(d: Date, lang: string): string {
  const localeMap: Record<string, string> = {
    en: "en-US",
    de: "de-DE",
    ru: "ru-RU",
    zh: "zh-CN",
  };
  const locale = localeMap[lang] ?? "en-US";
  return d.toLocaleDateString(locale, { weekday: "short" });
}

function getBarColor(score: number): string {
  if (score >= 80) return "oklch(0.72 0.2 142)";
  if (score >= 60) return "oklch(0.78 0.18 142)";
  if (score >= 40) return "oklch(0.75 0.16 70)";
  return "oklch(0.6 0.2 25)";
}

function getTextColor(score: number): string {
  if (score >= 80) return "text-green-400";
  if (score >= 60) return "text-emerald-400";
  if (score >= 40) return "text-amber-400";
  return "text-red-400";
}

export default function WeeklyScoreCard() {
  const { lang } = useLanguage();
  const tr = t[lang];
  const { data: history = [] } = useGetScoreHistory();

  // Build last 7 days slots (today first, then going back)
  const today = new Date();
  const slots = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    return {
      date: formatDate(d),
      label: getDayLabel(d, lang),
      isToday: i === 6,
    };
  });

  // Map history by date
  const scoreMap = new Map<string, number>();
  for (const entry of history) {
    scoreMap.set(entry.date, entry.score);
  }

  const filledSlots = slots.map((s) => ({
    ...s,
    score: scoreMap.get(s.date) ?? null,
  }));

  const filledScores = filledSlots
    .filter((s) => s.score !== null)
    .map((s) => s.score as number);
  const hasEnoughData = filledScores.length >= 2;

  // Avg of last 7 days
  const avg7 = hasEnoughData
    ? Math.round(filledScores.reduce((a, b) => a + b, 0) / filledScores.length)
    : null;

  // Trend: compare first half vs second half
  let trend: "up" | "down" | "stable" = "stable";
  if (filledScores.length >= 4) {
    const half = Math.floor(filledScores.length / 2);
    const older = filledScores.slice(0, half).reduce((a, b) => a + b, 0) / half;
    const newer =
      filledScores.slice(half).reduce((a, b) => a + b, 0) /
      (filledScores.length - half);
    if (newer - older > 3) trend = "up";
    else if (older - newer > 3) trend = "down";
  }

  const trendLabel =
    trend === "up"
      ? tr.weekly_score_trend_up
      : trend === "down"
        ? tr.weekly_score_trend_down
        : tr.weekly_score_trend_stable;

  const TrendIcon =
    trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor =
    trend === "up"
      ? "text-green-400"
      : trend === "down"
        ? "text-red-400"
        : "text-muted-foreground";

  const maxScore = Math.max(...filledScores, 100);

  return (
    <div data-ocid="weekly_score.card" className="glass-card rounded-2xl p-5">
      {/* Header */}
      <div className="flex items-start gap-3 mb-5">
        <div className="p-2 rounded-xl bg-primary/10">
          <Calendar className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground text-base">
            {tr.weekly_score_title}
          </h3>
          <p className="text-muted-foreground text-sm">
            {tr.weekly_score_desc}
          </p>
        </div>
      </div>

      {!hasEnoughData ? (
        <div
          data-ocid="weekly_score.empty_state"
          className="flex items-center justify-center py-8 text-center"
        >
          <p className="text-muted-foreground text-sm max-w-xs">
            {tr.weekly_score_no_data}
          </p>
        </div>
      ) : (
        <>
          {/* Bar chart */}
          <div className="flex items-end justify-between gap-1.5 h-28 mb-3">
            {filledSlots.map((slot) => {
              const hasScore = slot.score !== null;
              const heightPct = hasScore
                ? Math.max(8, (slot.score! / maxScore) * 100)
                : 8;
              const barColor = hasScore
                ? getBarColor(slot.score!)
                : "oklch(0.3 0 0)";
              return (
                <div
                  key={slot.date}
                  className="flex flex-col items-center gap-1 flex-1"
                  style={{ height: "100%", justifyContent: "flex-end" }}
                >
                  {hasScore && (
                    <span
                      className={`text-[10px] font-semibold ${getTextColor(slot.score!)}`}
                    >
                      {slot.score}
                    </span>
                  )}
                  <div
                    className="w-full rounded-t-md transition-all duration-500"
                    style={{
                      height: `${heightPct}%`,
                      backgroundColor: barColor,
                      opacity: hasScore ? 1 : 0.25,
                      boxShadow:
                        slot.isToday && hasScore
                          ? `0 0 10px ${barColor}`
                          : "none",
                      border: slot.isToday
                        ? "1px solid rgba(255,255,255,0.2)"
                        : "none",
                    }}
                  />
                </div>
              );
            })}
          </div>

          {/* Day labels */}
          <div className="flex justify-between gap-1.5 mb-4">
            {filledSlots.map((slot) => (
              <div key={slot.date} className="flex-1 text-center">
                <span
                  className={`text-[10px] ${
                    slot.isToday
                      ? "text-primary font-semibold"
                      : "text-muted-foreground"
                  }`}
                >
                  {slot.label}
                </span>
              </div>
            ))}
          </div>

          {/* Avg + trend */}
          {avg7 !== null && (
            <div className="flex items-center justify-between pt-3 border-t border-border/40">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {tr.weekly_score_avg}:
                </span>
                <span className={`text-sm font-bold ${getTextColor(avg7)}`}>
                  {avg7}
                </span>
              </div>
              <div
                className={`flex items-center gap-1.5 text-sm font-medium ${trendColor}`}
              >
                <TrendIcon className="w-4 h-4" />
                <span>{trendLabel}</span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
