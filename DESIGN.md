# BlackBook mobile design contract

BlackBook mobile is a native real-world index exchange. It is not the desktop website inside a phone shell and it is not a generic crypto dashboard. Every screen must support the loop: discover a priced index, inspect it, trade it and manage the resulting position or order.

## Brand

- Canvas is pitch black (`#000000`). Dark neutral surfaces create hierarchy; copper, gold, gradients, glass, neon and decorative glow are forbidden.
- Use the exact path-based BlackBook logo from `index-frontend/apps/web/public/assets/brand/blackbook-logo.svg`. Never rebuild the logo with a font.
- `BK` is the launcher/adaptive icon only. Profile uses a human silhouette until an actual user image exists.
- UI typography uses the platform system family. Brand lettering comes only from the canonical SVG.
- Green and red communicate market direction and trade intent only. They are not decorative accents.
- BlackBook identity comes from the wordmark, real-world entity art, sharp geometry, tabular market data and ledger-like separator rules.

## Spacing and hierarchy

- All layout spacing follows a 4dp grid: `4 / 8 / 12 / 16 / 24 / 32`.
- Page gutter is 16dp. Standard header is 52dp, search is 42dp, market row is 66dp and minimum touch target is 44dp.
- Use near-black grouped surfaces and partial row dividers to create structure. Do not leave unrelated controls floating in empty black space.
- Do not box every item. Market rows use a divider beginning after the entity artwork; settings use one grouped surface with internal dividers.
- Radius is `4 / 6 / 8 / 10dp`. Capsules are reserved for genuine tags. Tabs use rails or underlines, not fat pills.

## Icons and imagery

- UI icons come from `expo-symbols`: SF Symbols on iOS and Material Symbols on Android/web. Do not hand-draw replacement glyphs.
- Navigation and utility icons use one optical weight and a 20–22dp visual size inside 44dp targets.
- People use dedicated square, face-first source crops with a circular mask. Runtime scale/translate crop hacks are forbidden.
- Club, league and product marks are trimmed to visible bounds, uniformly padded and rendered with `contain`. Never stretch a mark or inherit portrait styling.
- Entity artwork must carry more visual weight than utility glyphs.

## Product structure

- Bottom navigation: Home, All Indices, Trade, Portfolio, Profile.
- Home contains compact balance, four exchange actions and `Hot / New / Gainers / Losers`. `Hot` is the default. Website hero, news, explainers and footer are forbidden.
- Favorites are user-created saved markets, never the default state of a new account.
- All Indices is a searchable, sortable priced market directory with categories and saved-market controls.
- Basic Trade prioritises the chart, amount, leverage, risk and Long/Short.
- Advanced Trade opens on Chart and switches between Chart and Order Book. Basic/Advanced is a mode action, never a large segmented pill.
- Portfolio contains balances, Deposit, Withdraw, Transfer, positions, orders, history and assets. It has no decorative equity chart.
- Settings contain account security, trading preferences, notifications, language, currency, appearance, support, legal and about. Methodology does not belong in Settings.
- Product behaviour is locally simulated for full interaction testing. The interface never displays `simulated`, `demo` or placeholder disclaimers.

## Verification

Every material UI change must render at 360×800, 390×844 and 430×932. Check safe areas, long names, keyboard-open forms, sheets, Chart/Order Book switching, portrait crops, crest optical sizing and bottom navigation before releasing an APK.
