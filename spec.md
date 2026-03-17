# LivSpan

## Current State
The app has full backend persistence for daily health data (sleep, nutrition, exercise, stress, fasting), diary entries, and LivSpan-Score history. The `saveDailyHealthData` and `getDailyHealthData` backend APIs exist. The LivSpan-Score aggregates data from all cards in real-time via frontend state.

## Requested Changes (Diff)

### Add
- After midnight, automatically reset all daily tracking fields (Ernährung, Schlaf, Stress & Herzgesundheit, Bewegung) in both frontend state and backend (save cleared/zero values for new day).
- On app load / login, load today's health data from backend into the respective cards so the LivSpan-Score reflects persisted values immediately.
- Ensure every slider change in any card triggers a backend save AND updates the LivSpan-Score in real-time.

### Modify
- Nutrition, Sleep, Stress & Heart, Exercise cards: on mount and after midnight, load/reset from backend.
- LivSpan-Score: always computed from the currently loaded (backend-synced) values, not stale local state.

### Remove
- Nothing removed.

## Implementation Plan
1. On login/mount: call `getDailyHealthData(today)` and hydrate all card states.
2. After midnight detection: clear card states for the new day and save blank record to backend.
3. Every slider onChange: debounce-save via `saveDailyHealthData` and update score ring in real-time.
4. LivSpan-Score always reads from the shared health data state.
