# LivSpan

## Current State
The dashboard has a LongevityScoreCard showing today's aggregated score. The backend already stores daily score entries (`ScoreEntry { date, score }`) via `saveScoreEntry` and exposes `getScoreHistoryForCaller()`. No weekly overview is shown on the dashboard yet.

## Requested Changes (Diff)

### Add
- `WeeklyScoreCard` component: shows the last 7 days of LivSpan scores as a bar chart (one bar per day), avg score, trend indicator (vs previous 7 days), and a short interpretation text.
- i18n keys for all 4 languages (EN, DE, RU, ZH): `weekly_score_title`, `weekly_score_desc`, `weekly_score_avg`, `weekly_score_no_data`, `weekly_score_trend_up`, `weekly_score_trend_down`, `weekly_score_trend_stable`.

### Modify
- `DashboardPage`: insert `<WeeklyScoreCard />` directly after `<LongevityScoreCard />`.
- `i18n.ts`: add weekly score keys to all 4 language blocks.

### Remove
- Nothing.

## Implementation Plan
1. Add i18n keys to all 4 language blocks in `i18n.ts`.
2. Create `src/frontend/src/components/WeeklyScoreCard.tsx` using `useGetScoreHistory` hook, render 7-day bars with day labels, avg, trend.
3. Import and place `<WeeklyScoreCard />` in `DashboardPage.tsx` after `<LongevityScoreCard />`.
4. Validate (lint + typecheck + build).
