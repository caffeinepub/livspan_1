# LivSpan

## Current State
The app supports two languages: English (en) and German (de), selectable per account via the menu. Translations are stored in `src/frontend/src/i18n.ts`.

## Requested Changes (Diff)

### Add
- Russian (`ru`) language option in `i18n.ts` with full translations for all keys including AI tips
- Russian flag/label in the language selector UI

### Modify
- `i18n.ts`: add `ru` block with all translated strings
- Language selector component: add Russian option

### Remove
- Nothing

## Implementation Plan
1. Add `ru` translation block to `i18n.ts` with all keys translated to Russian
2. Update language selector in the menu to include Russian (RU / 🇷🇺)
3. Ensure language persists per account in backend (already supported)
