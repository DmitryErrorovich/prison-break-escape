# Prison Break: Escape

A PixiJS learning project: a stylized prison escape scene with a **simulated, virtual-credit-only crash game**. No real money, payments, external odds provider, or gambling backend.

## Getting started

Requires Node.js 20.19+ or 22.12+ (Vite 7 requirement).

```bash
npm install
npm run dev
```

Open the local URL printed by Vite (normally `http://localhost:5173`).

```bash
npm run typecheck
npm run build
```

## How to play

1. Select a virtual-credit stake (10, 25, 50, or 100 CR).
2. Select **Start Escape**. A locally simulated crash multiplier is chosen, then the prisoner starts running.
3. Select **Cash Out** before the crash to receive virtual credits, or get caught and lose the virtual stake.
4. If you run out of credits, select **Refill Demo Credits** to start again.

A round ends when you cash out in this initial single-player demo. Later multiplayer rounds should continue globally even after an individual player cashes out.

## Architecture

- `src/game/DemoCrashEngine.ts` — self-contained round state machine, credit accounting, simulated crash point, and subscriptions. The visual layer never chooses outcomes.
- `src/game/PrisonScene.ts` — PixiJS containers, graphics, text, character animation, scrolling background, responsive stage scaling.
- `src/components/PrisonCanvas.tsx` — owns the PixiJS `Application` lifecycle inside React, including async initialization, ticker, resize, and cleanup.
- `src/App.tsx` — React controls, multiplier display, virtual balance, and round history.

The initial scene draws its own graphics; no licensed external sprites or assets are needed. PixiJS is used **without** `@pixi/react` to make the rendering API explicit.

## PixiJS learning path

1. `Application` + async `init()` and `app.canvas`
2. Scene graph: `Container`, `Graphics`, `Text`, stage ordering
3. `Ticker` and frame-rate-independent movement using `deltaMS`
4. Scaling a fixed logical scene to a responsive DOM canvas
5. Sprite sheets, `Assets`, `AnimatedSprite`, and texture lifecycle (next PR)
6. Replacing local round simulation with a server-authoritative WebSocket feed (future)

## Important limitations

This is **not** a production wagering system. Random outcomes use `Math.random`, are generated and processed in the browser, and are **not cryptographically secure, provably fair, regulated, or trustworthy for real stakes**. If this evolves into a real-money product, outcome generation, payouts, synchronization, security, compliance, and independent testing must be redesigned and handled server-side.