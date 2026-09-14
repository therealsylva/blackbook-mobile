# BlackBook mobile design contract

This contract is locked to the approved mobile audit. The web frontend is the visual and product source of truth. Mobile adapts its hierarchy to a phone; it does not invent a crypto-exchange theme, a second account model, or replacement chart behavior.

## Brand

- Use the canonical BlackBook wordmark asset. Never typeset the brand name as a substitute.
- The application canvas is void black (`#000000`). Chart plotting areas use the frontend terminal black (`#080808`).
- Terminal candles use `#08B996` / `#F04A59`. Overview performance lines use `#089981` / `#F23645`.
- UI text uses the bundled Mona Sans family. Market numbers use a deliberate tabular numeric treatment.
- Utility icons use Lucide React Native. Entity marks remain their canonical brand/portrait assets.
- Primary icons are bright white. Muted color communicates hierarchy, never disabled-looking navigation.

## Layout language

- Typography, alignment, and whitespace establish hierarchy. Full-width panels and grids are exceptional.
- Dividers are quiet hairlines used only between repeated rows. Do not construct entire pages from slabs and vertical rules.
- Pills are reserved for meaningful state and compact switching: category filters, chart/book, ranges, side/leverage, and status.
- Market and content rows live directly on the black canvas. Avoid blue-grey backplates behind ordinary icons.
- Prefer confident type sizes and fewer, stronger labels. Do not shrink the interface to fit unnecessary descriptions.

## Navigation

- Bottom navigation is exactly: Home, Indices, Trade, Portfolio, Feed.
- Profile/User Center is opened only from the Home avatar.
- Settings are consolidated inside User Center. There is no duplicate Profile bottom tab or duplicate settings page.

## Product structure

- Home: profile avatar, search, notifications, balance, compact Deposit/Withdraw actions, and a full-width `Hot / New / Gainers / Losers / Favorites` market switcher. `Hot` is default and Favorites remains user-created.
- Indices: categories are All, Clubs, Leagues, Athletes, Artists, Products. No Sports, Music, People, Public Figures, `/POINT`, star column, or RMD/LMY relative-value market. Include a dedicated Major Pairs section.
- Overview: a distinct index overview with the frontend area-line aesthetic, compact quote context, favorite and alert actions, and secondary data below the chart.
- Basic Trade: compact chart plus a focused order ticket. Basic/Advanced is selected only in Preferences.
- Advanced Trade: a dense terminal workspace with a compact Chart/Order Book pill, real range data, frontend-style candles/volume, and a compact ticket. No fixed giant Long/Short footer.
- Portfolio: one USD account model. No Assets wallet tab, Funding account, Trading account, or internal Transfer flow.
- Positions: compact by default and expandable. Show Entry and Current explicitly; reserve Mark for a distinct risk price.
- Orders: show target against current market price and retain time/type context.
- History: a journal timeline with opening, fill/cancel/close context, size, leverage, fees, duration, entry/exit, and realised P&L.
- Notifications: Push notifications is the toggle. Price alerts, order updates, and position risk are navigable feeds.
- User Center: editable My Info plus Security, Preferences, and General. Do not repeat live trading counts or interface selectors as panels.
- Feed: restore frontend news, index tools, strategies, market trends, trade ideas, gainers, losers, volume, volatility, listings, and entity/product coverage.

## Verification

- Run validation and TypeScript checks.
- Render and inspect 360x800, 390x844, and 430x932.
- Verify long names, safe areas, keyboard forms, chart/book switching, real range changes, crest sizing, compact positions, journal detail, Feed navigation, and the five-tab bar.
