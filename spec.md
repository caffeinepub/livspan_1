# LivSpan

## Current State
The app has a full health-tracking dashboard with backend persistence, Internet Identity login, and role-based access control. All dashboard features (nutrition, sleep, stress, exercise, fasting, diary, LivSpan-Score) are fully functional.

## Requested Changes (Diff)

### Add
- ICP payment-based subscription system: users must pay 1 ICP to access the dashboard
- Subscription duration: 12 months from payment date
- Owner wallet (Account ID): `5677f79bb400519598c0e75be936cafc391a930d21268d6fcf1eee3cb5c9d582`
- Backend subscription storage: map of Principal -> expiry timestamp (nanoseconds)
- Backend function: `checkSubscription()` - returns subscription status and expiry date for caller
- Backend function: `activateSubscription(blockIndex: Nat64)` - user provides their ICP transaction block index; backend calls ICP ledger canister to verify payment of >= 1 ICP to owner account, then activates 12-month subscription
- Backend function: `adminActivateSubscription(user: Principal)` - admin can manually activate a subscription
- Frontend paywall screen: shown to logged-in users with no active subscription
  - Displays owner account ID for payment
  - Shows required amount (1 ICP)
  - Input field for block index (transaction ID)
  - "Verify Payment" button
  - Loading/success/error feedback
  - Shows subscription expiry once active
- Subscription expiry shown in the dashboard header/personal data area

### Modify
- Dashboard: gated behind active subscription check; users without subscription see paywall instead

### Remove
- Nothing removed

## Implementation Plan
1. Add `subscriptions` map (Principal -> Int expiry timestamp) to backend
2. Add ICP ledger inter-canister call interface to verify transactions
3. Implement `checkSubscription`, `activateSubscription(blockIndex)`, `adminActivateSubscription` backend functions
4. Update frontend: after login, check subscription status; show paywall if not subscribed, dashboard if subscribed
5. Build paywall UI with payment instructions, block index input, and verify button
6. Show subscription expiry date in dashboard
