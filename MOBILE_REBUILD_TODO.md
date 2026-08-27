# Approved mobile rebuild TODO

This checklist is the implementation authority for the approved rebuild. Do not add product behavior outside it.

## Identity and foundation

- [x] 01 Fix the clipped splash wordmark and use the canonical logo.
- [x] 02 Remove the exposed status-bar/splash composition failure.
- [x] 03 Replace `expo-symbols`/Material utility icons with Lucide.
- [x] 04 Restore void black instead of the blue-grey surface system.
- [x] 05 Render active utility/navigation icons bright white.
- [x] 06 Replace generic icon choices with frontend-aligned meanings.
- [x] 07 Remove the box/card treatment from ordinary page structure.
- [x] 21 Load and use Mona Sans instead of platform fallback fonts.
- [x] 22 Restore confident frontend weights for entity and ticker text.
- [x] 40 Port the frontend chart aesthetic instead of the crude SVG polyline.
- [x] 41 Restore selective pill semantics and remove slab/divider controls.
- [x] 45 Restore the exact frontend chart color palettes.

## Home and navigation

- [x] 08 Remove the four-cell Home CTA slab.
- [x] 09 Place compact Deposit and Withdraw actions beside the balance.
- [x] 10 Remove duplicate Trade, Positions, and Alerts actions from Home.
- [x] 11 Distribute Hot/New/Gainers/Losers across the available width.
- [x] 12 Keep Favorites user-created and non-default.
- [x] 13 Remove the redundant Markets/Major Indices heading stack.
- [x] 34 Remove Profile from bottom navigation; Home avatar is the entry.
- [x] 56 Add Feed to bottom navigation and restore frontend content.

## Indices and entity identity

- [x] 14 Correct Real Madrid crest proportions and optical sizing.
- [x] 23 Use Clubs, Leagues, Athletes, Artists, Products categories.
- [x] 24 Remove Music and People/Public Figures/Elon taxonomy.
- [x] 25 Remove hard-coded `/POINT` suffixes from mobile tickers.
- [x] 26 Correct per-asset containment, circle, tile, and portrait framing.
- [x] 27 Supply canonical brand assets instead of text fallbacks.
- [x] 28 Use the EPL lion treatment, not the squashed horizontal wordmark.
- [x] 29 Remove the directory star column; favorite belongs in Overview.
- [x] 30 Restore a true, distinct Index Overview.
- [x] 31 Align directory headers and use `$12.9M` volume formatting once.
- [x] 32 Add a dedicated Major Pairs/Rivalries section.
- [x] 33 Remove the irrelevant RMD/LMY relative-value market.

## Trade and charts

- [x] 16 Keep Basic/Advanced only in Preferences.
- [x] 36 Keep Overview, Basic Trade, and Advanced Trade distinct.
- [x] 37 Remove the giant fixed Short/Long footer.
- [x] 38 Adapt the existing frontend ticket rather than inventing one.
- [x] 39 Remove oversized quote/stat blocks that hide the ticket.
- [x] 43 Use actual per-range data instead of cosmetic multipliers.
- [x] 44 Build Advanced as a compact terminal workspace, not extended Basic.

## Portfolio and account model

- [x] 42 Remove triplicated Portfolio History entry points.
- [x] 46 Make positions compact and collapsed by default.
- [x] 47 Remove excessive whitespace from position rows.
- [x] 48 Label Current and Mark correctly.
- [x] 49 Show open orders against current market context.
- [x] 50 Replace receipt history with a proper trade journal.
- [x] 51 Use sentence/title case for UI state; uppercase only tickers/units.
- [x] 52 Remove the crypto-style Assets tab.
- [x] 53 Remove Funding/Trading account split and internal Transfer.

## Profile, settings, and notifications

- [x] 15 Remove the Positions/Orders/Alerts Profile grid.
- [x] 17 Make Push notifications the actual master toggle.
- [x] 18 Make alerts/order/risk items navigable feeds, not toggles.
- [x] 19 Keep toggle thumb/track visible on void black.
- [x] 20 Remove childish explanatory copy.
- [x] 35 Remove the duplicate gear/settings destination.
- [x] 54 Add editable picture and identity information.
- [x] 55 Move identity into editable account state; remove hard-coded duplicates.
