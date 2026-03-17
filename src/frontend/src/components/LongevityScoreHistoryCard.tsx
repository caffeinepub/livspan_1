import { TrendingUp } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useLanguage } from "../hooks/useLanguage";
import { useGetScoreHistory } from "../hooks/useQueries";
import { t } from "../i18n";

const GREEN_COLOR = "oklch(0.76 0.14 148)";

function formatDateLabel(dateStr: string) {
  const [, month, day] = dateStr.split("-");
  return `${day}.${month}`;
}

export default function LongevityScoreHistoryCard() {
  const { lang } = useLanguage();
  const tr = t[lang];
  const { data: history = [], isLoading } = useGetScoreHistory();

  // Sort and take last 30 days
  const sorted = [...history]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-30);

  // 7-day average
  const last7 = sorted.slice(-7);
  const avg7 =
    last7.length > 0
      ? Math.round(last7.reduce((sum, e) => sum + e.score, 0) / last7.length)
      : null;

  const chartData = sorted.map((e) => ({
    date: formatDateLabel(e.date),
    score: e.score,
  }));

  return (
    <div className="glass-card rounded-2xl p-5" data-ocid="score_history.card">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-start gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "oklch(0.76 0.14 148 / 0.15)" }}
          >
            <TrendingUp className="w-4 h-4" style={{ color: GREEN_COLOR }} />
          </div>
          <div>
            <h3 className="font-display font-semibold text-sm text-foreground leading-tight">
              {tr.score_history_title}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {lang === "de" ? "Letzte 30 Tage" : "Last 30 days"}
            </p>
          </div>
        </div>
        {avg7 !== null && (
          <div className="text-right shrink-0">
            <span
              className="text-lg font-bold font-mono"
              style={{ color: GREEN_COLOR }}
            >
              {avg7}
            </span>
            <p className="text-xs text-muted-foreground mt-0.5">
              {tr.score_history_avg7}
            </p>
          </div>
        )}
      </div>

      {/* Chart or empty state */}
      {isLoading ? (
        <div
          className="flex items-center justify-center py-10"
          data-ocid="score_history.loading_state"
        >
          <div
            className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: GREEN_COLOR, borderTopColor: "transparent" }}
          />
        </div>
      ) : chartData.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-10 text-center"
          data-ocid="score_history.empty_state"
        >
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
            style={{ background: "oklch(0.76 0.14 148 / 0.10)" }}
          >
            <TrendingUp
              className="w-5 h-5"
              style={{ color: "oklch(0.76 0.14 148 / 0.5)" }}
            />
          </div>
          <p className="text-xs text-muted-foreground max-w-[180px] leading-relaxed">
            {tr.score_history_empty}
          </p>
          <p className="text-xs text-muted-foreground/60 mt-1 max-w-[180px] leading-relaxed">
            {lang === "de"
              ? "Täglich eintragen, um den Fortschritt zu sehen."
              : "Track daily to see your progress."}
          </p>
        </div>
      ) : (
        <div className="h-36 w-full" data-ocid="score_history.chart_point">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 4, right: 4, bottom: 0, left: -20 }}
            >
              <defs>
                <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor="oklch(0.76 0.14 148)"
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="100%"
                    stopColor="oklch(0.76 0.14 148)"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="oklch(0.30 0.02 200 / 0.4)"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 9, fill: "oklch(0.55 0.03 200)" }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 9, fill: "oklch(0.55 0.03 200)" }}
                axisLine={false}
                tickLine={false}
                ticks={[0, 25, 50, 75, 100]}
              />
              <Tooltip
                contentStyle={{
                  background: "oklch(0.15 0.025 200)",
                  border: "1px solid oklch(0.28 0.03 200)",
                  borderRadius: "8px",
                  fontSize: "11px",
                  color: "oklch(0.88 0.02 200)",
                }}
                labelStyle={{ color: "oklch(0.65 0.03 200)", marginBottom: 2 }}
                cursor={{
                  stroke: "oklch(0.76 0.14 148 / 0.4)",
                  strokeWidth: 1,
                }}
                formatter={(value: number) => [value, "Score"]}
              />
              <Area
                type="monotone"
                dataKey="score"
                stroke={GREEN_COLOR}
                strokeWidth={2}
                fill="url(#scoreGradient)"
                dot={false}
                activeDot={{
                  r: 4,
                  fill: GREEN_COLOR,
                  stroke: "oklch(0.15 0.025 200)",
                  strokeWidth: 2,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
