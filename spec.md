# LivSpan

## Current State
The wallet panel in DashboardPage shows the full principal address, LIV token balance, and send/receive views. There is no transaction history. The backend has a `transferLiv` function and a `grantWelcomeLiv` internal function, but neither records transactions.

## Requested Changes (Diff)

### Add
- `LivTransaction` type in backend: `{ id: Nat; from: Text; to: Text; amount: Nat; timestamp: Int; txType: Text }` (txType: "send" | "receive" | "airdrop")
- `livTransactions` map in backend (per user, list of transactions)
- `getLivTransactions()` query function returning the caller's transaction history (most recent first, max 50)
- Record transactions in `transferLiv` for both sender and recipient
- Record airdrop transaction in `grantWelcomeLiv` for recipient
- New "History" view in `WalletDropdown` component (4th view state)
- History button in the main wallet view (alongside Send / Receive)
- List of transactions showing type icon, amount, counterpart address (shortened), and timestamp

### Modify
- `transferLiv` backend function: after successful transfer, append transaction records for sender ("send") and recipient ("receive")
- `grantWelcomeLiv` internal function: append airdrop transaction for recipient
- `WalletDropdown` component: add `history` view state and a History button

### Remove
- Nothing

## Implementation Plan
1. Add `LivTransaction` type and `livTransactions` map to backend
2. Add `getLivTransactions` query function
3. Update `transferLiv` to record send/receive entries
4. Update `grantWelcomeLiv` to record airdrop entry
5. Regenerate backend bindings (generate_motoko_code not needed -- minimal additions)
6. Add `useGetLivTransactions` query hook in frontend
7. Add "History" view to `WalletDropdown` with a list of recent transactions
