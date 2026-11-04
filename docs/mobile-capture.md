# Mobile creative capture (demo only)
This branch provides an illustrative product-style mobile gameplay UI. All balances
and winnings are **fictional**; EUR/USD/RON are display labels for virtual credits,
not real deposits, payments, conversions, odds or withdrawals.

## Record from your phone
1. Run `npm install` and `npm run dev -- --host 0.0.0.0`.
2. Connect phone and computer to the same Wi-Fi network.
3. Open `http://YOUR_COMPUTER_LAN_IP:5173` on your phone.
4. Expand **RECORDING SETTINGS**, select EUR/USD/RON and a demo preset.
5. Enable **AUTO RECORD SEQUENCE** to cycle four scripted rounds hands-free.
6. Collapse settings and enable iOS/Android built-in screen recording.
7. Turn off autoplay from settings after recording.

**Presets**: Quick escape (cash out about 1.85x), Close call (3.08x),
Instant capture (crash 1.01x), Big escape (8.42x). The automatic sequence
loops. `Random demo` retains the previous locally random simulated outcomes.

The camera uses a portrait cover crop centered between prisoner and guard;
the existing scene remains responsive at desktop sizes. The existing Pixi
ticker drives autoplay and all game animation, without unmanaged intervals.

## Validation
Run `npm test` and `npm run build` before merging; test on a real
mobile screen as well. User-facing demo labels intentionally remain visible.
