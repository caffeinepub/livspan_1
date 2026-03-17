# LivSpan

## Current State
New project. No existing backend or frontend.

## Requested Changes (Diff)

### Add
- Wallet-based authentication (sign in with wallet address, no email/password)
- Daily Routines: create, edit, delete routines with title, time (Uhrzeit), and description
- Checkbox to mark each routine as done
- Auto-reset of routine completion status after midnight each day
- Routines sorted by time
- Dashboard page showing all routines for logged-in user

### Modify
- N/A (new project)

### Remove
- N/A

## Implementation Plan
1. Backend (Motoko):
   - User identity based on principal (wallet address)
   - Routine data model: id, owner (principal), title, time (text HH:MM), description, createdAt
   - Completion tracking: routineId -> last completed date (YYYY-MM-DD)
   - CRUD operations: createRoutine, updateRoutine, deleteRoutine, getRoutines
   - markDone / markUndone with date tracking
   - getRoutinesWithStatus: returns routines with computed done=true/false based on today's date

2. Frontend:
   - Login page: connect wallet / enter wallet address to authenticate via II (Internet Identity)
   - Dashboard page: list of routines sorted by time
   - Create Routine modal/form
   - Edit Routine inline or modal
   - Delete confirmation
   - Animated checkbox for done state
   - Dark mode premium UI with deep greens and blues
