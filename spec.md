# LivSpan

## Current State
Backend speichert: Routinen, Nutzerprofil, Score-Verlauf, Tagebuch.
Gesundheitskarten (Schlaf, Ernaehrung, Bewegung, Stress, Fasten) speichern nur in localStorage.

## Requested Changes (Diff)

### Add
- DailyHealthData Typ im Backend (date + optionale sleep/nutrition/movement/stress/fasting Felder)
- saveDailyHealthData, getDailyHealthData Funktionen
- Frontend Hooks: useGetHealthData, useSaveHealthData
- Cards laden beim Mount aus Backend, speichern bei Aenderung ins Backend (debounced)

### Modify
- SleepCard, NutritionCard, MovementCard, StressCard, FastingCard: Backend-Integration
- useQueries.ts: neue Hooks
- backend.d.ts: neue Typen/Methoden

### Remove
- Nichts (localStorage bleibt als Fallback)

## Implementation Plan
1. Backend: DailyHealthData + saveDailyHealthData + getDailyHealthData
2. backend.d.ts aktualisieren
3. useQueries.ts: neue Hooks
4. 5 Health-Cards: Backend laden + speichern (debounced 800ms)
