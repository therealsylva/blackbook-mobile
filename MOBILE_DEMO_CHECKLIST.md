# Football mobile demo 0.2.1

- 15 clubs, 15 athletes and eight tradable ticker pairs.
- Home retains the original compact exchange layout; Hot includes Mbappé and Yamal in place of PSG and Liverpool.
- Individual rows retain full names and ticker subtitles. Pair rows show both icons, ticker, price and daily percentage change only.
- Pair price is X/Y × 1,000. Pair Index uses the underlying Index values. Each pair band uses the wider percentage from its two legs on that side.
- Shared individual/pair overview: price, daily change, jagged market chart, timeframes, Upper band, Lower band, Index, 24h volume, brief description, News & analysis and Trade.
- Remove density, publication labels, vs-reference labels and Coming Soon from market screens.
- Shared pair/individual order ticket; pair orders and positions carry the pair ticker and both icons.
- Seeded daily demo movement is 1–6% in either direction. Charts and candles share prices across Overview and Trade. Daily movement is measured from the demo opening price, not from Index.
- ACM has a circular container with an undistorted crest. Raphinha uses the official Barcelona portrait with a face-focused display crop.
- Version 0.2.1 / Android versionCode 3. Existing app identity and normal in-app APK update feed retained.

Validation: npm run check; npm run check:demo; Expo web export; CI phone renders at 360/390/430 including light theme, pair order confirmation and pair position; ARM64 Android release build.

The underlying publication and methodology remain unchanged. Trading, prices and volume are local demo data. Keep PR #2 open and unmerged for review.
