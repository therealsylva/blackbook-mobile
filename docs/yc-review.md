# YC review scope and verification

Tatum integration is excluded; it is being handled separately. Fine intraday history is deferred. The terminal opens on 5D; saved user ranges remain respected.

## Market coverage

Osimhen is held out of launch discovery and new orders. The imported 23 October archive uses Galatasaray fixture context but has no reconstructed sporting update for OSI. Its five source checkpoints (26 August, 30 August, 1 September, 6 October, 22 October) all retain 1,813.912292. This is a coverage/data-provenance hold, not a claim that Turkey is geographically outside Europe. Existing positions retain their stored identity and reduce-only exits. Archived files and existing ledgers are not deleted.

## Numeric contract

- Users select dollar amount and integer leverage. Exposure = allocated cash x leverage, rounded down internally to matching precision. The $1 minimum is enforced without asking users for lots.
- Fees use the current published policy, quote precision and per-order/per-fill rounding. Policy 1 is explicitly zero-fee; displaying $0.00 under policy 1 is correct. Policy 2 currently specifies 200 maker / 600 taker ppm. Clients do not invent a fee rate.
- Estimated entry fees use the taker rate conservatively; reserved fees use the maximum policy rate and upper price bound. Final settlement determines actual fees.
- P&L is signed exposure x relative price change, with settlement rounding. Dollar money stays at two decimals; displayed position price levels use four decimals. Stored prices retain full precision.
- Liquidation is a market price in index points. The cross-account estimate solves equity = maintenance with other markets held at their marks. It accounts for existing same-market exposure and estimated entry fees. It is not an execution guarantee; unavailable or non-positive estimates display a dash.
- Volume is settled notional in settlement minor units, counted once per trade, never matching-unit count or imported candle count. Volatility uses observed price range, not allowed band width.

## Delivery

The guide is versioned in the frontend repository. The deployment helper installs a reviewed APK, guide and update manifest into the VPS download directory served by Caddy. Building code alone does not install these files. The final Android build must be generated from the merged mobile PR and installed on a physical phone for Android keyboard and predictive-back confirmation.

Fresh real-account email delivery/reset and live VPS session checks require a real review account and deployed services; local signed-in fixtures do not establish those outcomes. Funding tests are out of scope here.
