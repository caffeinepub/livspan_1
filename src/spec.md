# LivSpan

## Current State
Admin page shows a subscription list with Principal IDs (shortened), expiry dates, and status. Principals are not copyable. The 1 LIV token airdrop on subscription activation is already implemented in the backend via `grantWelcomeLiv`.

## Requested Changes (Diff)

### Add
- Copy button next to each Principal ID in the subscription list (copies full Principal to clipboard)
- "Copy All" button in the subscription list header to copy all Principal IDs at once (for batch LIV transfers)
- A short notice in the card description reminding the admin that 1 LIV is auto-sent on each new subscription

### Modify
- Subscription list table row: show full Principal on hover tooltip, add clipboard copy icon button
- Summary stats row: add "Copy All Addresses" action button

### Remove
- Nothing

## Implementation Plan
1. Add copy-to-clipboard logic using navigator.clipboard.writeText
2. Add Copy icon button per row in the subscription table
3. Add "Copy All" button in the card header area
4. Add translation strings for copy actions in both DE and EN
5. Show toast confirmation on copy
