# LivSpan

## Current State
The top navbar shows a shortened principal and a wallet icon in a small pill. The backend has no LIV token logic. The admin can manage subscriptions.

## Requested Changes (Diff)

### Add
- **LIV Token in Backend:** ICRC-1-style token with 21,000,000 total supply. All tokens initially minted into the founder (admin) wallet via a one-time `claimFounderLivTokens()` call (only callable once, only by admin). Functions: `getMyLivBalance()`, `getLivBalance(principal)`, `transferLiv(to, amount)`, `claimFounderLivTokens()`.
- **Wallet Dropdown Panel in Navbar:** Clicking the wallet pill opens a dropdown that shows:
  - Full wallet address (principal) with copy-to-clipboard button
  - LIV token balance (fetched from backend)
  - "View on OISY" link for ICP balance
  - Close button

### Modify
- Wallet pill in navbar: make it a clickable button that opens the wallet dropdown
- Wallet dropdown auto-closes on outside click

### Remove
- Nothing removed

## Implementation Plan
1. Add LIV token state and functions to `main.mo`:
   - `livBalances: Map<Principal, Nat>`
   - `livTokensClaimed: Bool` flag
   - `claimFounderLivTokens()`: admin-only, one-time, mints 21_000_000 to caller
   - `getMyLivBalance()`: query, returns caller's LIV balance
   - `getLivBalance(p)`: query, returns any principal's LIV balance
   - `transferLiv(to, amount)`: update, transfers LIV between principals
2. Frontend: Add `WalletPanel` dropdown component in `DashboardPage.tsx` navbar
   - Shows full principal with copy button
   - Shows LIV balance via `useQuery` on `getMyLivBalance`
   - Shows OISY link
   - Animated open/close
