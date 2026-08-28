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

## Phone polish pass — implemented

- [x] 57 Replace the generic Deposit and Withdraw arrow icons with distinctive, frontend-aligned action icons matching the quality of the rest of the app.
- [x] 58 Fix the balance-width/number-rendering leak that leaves trailing dots or an ellipsis after the displayed balance.
- [x] 59 Remove the invented `Market pulse` heading and restore the plain `Indices` product label.
- [x] 60 Increase the Home Hot/New/Gainers/Losers/Favorites label size, weight, and inactive contrast so the switcher does not look small, greyed-out, or timid.
- [x] 61 Replace the Home switcher's flat active underline with the same clear pill treatment used by the All Indices category switcher.
- [x] 62 Rebalance Home market-row widths so long index names remain readable without colliding with or being sacrificed to the mini chart.
- [x] 63 Give the Home `All indices` action a clear button/tap affordance instead of rendering it like passive grey text.
- [x] 64 Recompose All Indices rows using the Home-list hierarchy: preserve enough width for full names, keep price prominent with 24h movement grouped beneath it, and move volume into secondary metadata instead of its own cramped column.
- [x] 65 Increase the All Indices table/category header font size and contrast; labels such as Index, Price, 24h, and Vol must not look faint or undersized if any remain after the row recomposition.
- [x] 66 Replace the flattened Real Madrid crest source/crop and preserve its natural aspect ratio; verify it visually beside the correctly contained CGPT mark instead of trying another optical scale tweak.
- [x] 67 Replace the incorrect purple Premier League artwork with the proper standalone EPL lion-head mark; source or generate the correct asset rather than using a purple circular substitute.
- [x] 68 Give Portfolio an intentional visual composition and hierarchy so its content does not hang in an empty black void; use spacing, typography, and restrained structure without returning to card/panel abuse.
- [x] 69 Strengthen Portfolio typography throughout; headings, tabs, labels, position details, and supporting text must not look flat, faint, or timid.
- [x] 70 Render Positions, Orders, and Journal counts as compact notification-style count badges, not small inline numbers that read like exponents (`Positions²`).
- [x] 71 Recompose Portfolio order rows so primary information is anchored from the left and the right edge is reserved only for quote/action context; remove the large empty-left/right-heavy arrangement.
- [x] 72 Apply directional color to Portfolio percentage movement as well as monetary P&L; positive percentages use the positive colour and negative percentages use the negative colour.
- [x] 73 Use the exact numeric font and numeric treatment from the index-frontend Overview page for Portfolio balances, prices, P&L, percentages, and entry/current values; verify against the frontend source instead of approximating it.
- [x] 74 Add `Pairs` as a dedicated All Indices category alongside Clubs, Leagues, Athletes, Artists, and Products so Major Pairs is not buried below the entire directory.
- [x] 75 Add `Pairs` to the Home market switcher immediately after Hot: Hot, Pairs, New, Gainers, Losers, Favorites.
- [x] 76 Make the expanded Home switcher horizontally scrollable instead of shrinking or cramming all six options into the visible width at once.
- [x] 77 Replace the Profile picture URL field with a native device file/photo picker flow; users must upload or select an image from their device rather than paste a URL.
- [x] 78 Add a clear Light/Dark theme toggle in User Center preferences and apply the selected theme consistently throughout the app.
