# LivSpan

## Current State
The NutritionCard calculates and displays Grundumsatz (BMR) and TDEE based on personal data and a selectable activity level. It tracks protein, veggies, and water via sliders. Daily health data (including nutrition) is persisted in the backend.

## Requested Changes (Diff)

### Add
- Calorie intake slider in NutritionCard, with TDEE as the daily goal
- `calories` field in DailyHealthState and backend DailyHealthData
- New i18n strings for calorie tracking
- A calorie progress dot in the nutrition summary row

### Modify
- Backend `DailyHealthData` type to include `calories: ?Float`
- `saveDailyHealthData` to accept an additional `calories: ?Float` parameter
- `useDailyHealth.tsx` to include `calories` in state, load, and save
- `NutritionCard.tsx` to show calorie slider with TDEE as goal

### Remove
- Nothing

## Implementation Plan
1. Regenerate backend to include calories field in DailyHealthData and saveDailyHealthData
2. Update DailyHealthState in useDailyHealth.tsx to add calories field
3. Update fromBackend, scheduleSave, midnight reset, and syncLocalStorage helpers
4. Update NutritionCard to show a calorie intake slider with TDEE as goal
5. Add i18n strings for calories tracking in both de and en
