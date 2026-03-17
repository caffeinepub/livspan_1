# LivSpan

## Current State
Dashboard right sidebar cards are ordered: LivSpan-Score, Score-Verlauf, PersonalData, Nutrition, Sleep, Stress, Fasting, Movement, Diary, Placeholders.

## Requested Changes (Diff)

### Add
- Nothing new

### Modify
- Reorder right sidebar cards to follow logical day progression

### Remove
- Nothing

## Implementation Plan
1. Reorder the card components in the right sidebar column of DashboardPage.tsx:
   - LongevityScoreCard (LivSpan-Score)
   - LongevityScoreHistoryCard (Score-Verlauf)
   - SleepCard (Schlaf - review previous night upon waking)
   - FastingCard (Fasten - morning fasting window active)
   - NutritionCard (Ernährung - meals through the day)
   - MovementCard (Bewegung - exercise during the day)
   - StressCard (Stress & Herz - monitor throughout day)
   - PersonalDataCard (Persönliche Daten - general check-in)
   - DiaryCard (Tagebuch - end of day reflection)
   - Placeholder cards
