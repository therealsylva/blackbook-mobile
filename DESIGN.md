# BlackBook mobile design contract

BlackBook mobile is a native exchange interface, not the desktop website placed inside a phone shell. Every screen must support the exchange loop: discover a priced index, inspect it, trade it, and manage the resulting position or order.

## Visual rules

- Canvas is true black (`#000000`). Navigation is near-black (`#050506`).
- Text and controls are neutral. Copper, gold, gradients, glass, neon and decorative glow are not part of the system.
- Green and red communicate market direction or trading actions only.
- Mona Sans is the interface family. Market numbers use tabular figures. Monospace is reserved for the Advanced order book.
- Page inset is 18dp. Touch targets are at least 44dp. Entity imagery is 40–44dp.
- Radius tops out at 12dp. Capsules are reserved for genuine segmented controls or search—not headings, settings rows or balances.
- Use whitespace and type hierarchy before borders. Avoid boxed sections and repeated full-width dividers.

## Brand and imagery

- The `BK` mark is the launcher/adaptive icon only. It is never a profile avatar, page logo or settings decoration.
- App launch shows the full `BlackBook` wordmark on black, then the app shell. No loading copy, spinner or artificial delay.
- Profile uses a human silhouette until an actual user image exists.
- Athletes and people use circular, face-first crops. Never use full-body action photography in market rows.
- Club, league and product marks use a transparent square frame with `contain`; crests must never stretch or inherit portrait cropping.

## Product structure

- Bottom navigation: Home, All Indices, Trade, Portfolio, Profile.
- Home contains balance, wallet/trade actions and a concise priced market list. It does not contain the website hero, news feed, index explainers or footer.
- All Indices is a searchable, sortable priced market directory with category tabs and favourites.
- Basic Trade prioritises chart, amount, leverage, risk controls and Long/Short.
- Advanced Trade includes switchable Chart and Order Book panels plus Market/Limit/Stop controls.
- Portfolio has no decorative equity chart. It exposes Deposit, Withdraw, Transfer, history, assets, positions and orders.
- Settings contain account security, trading preferences, notifications, language, currency, market colours, help, legal and about. Methodology does not belong in Settings.

## Verification

Every material UI change must render at 360×800, 390×844 and 430×932. Check safe areas, long names, keyboard-open order forms, sheets, chart/order-book switching, portrait crops and contained crests before releasing an APK.
