# LivSpan

## Current State
The dashboard header shows an "Access until" badge with the subscription expiry date. This badge is static (non-interactive). The backend has `activateSubscription` for new users but no function for renewing an existing subscription.

## Requested Changes (Diff)

### Add
- Backend: `renewSubscription(blockIndex: Nat64)` function that verifies 1 ICP payment and extends the existing expiry by 12 months (or from now if already expired)
- Frontend: `useRenewSubscription` hook in useQueries.ts
- Frontend: `RenewalModal` component in DashboardPage showing current/new expiry, payment address, block index input, and verify button

### Modify
- "Access until" badge in dashboard header: changed from static div to clickable button that opens the RenewalModal

### Remove
- Nothing removed

## Implementation Plan
1. Add `renewSubscription` to backend main.mo
2. Add `useRenewSubscription` hook to useQueries.ts
3. Add `RenewalModal` component to DashboardPage.tsx
4. Make "Access until" badge clickable to open modal
