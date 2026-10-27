# PixiJS lesson 3 — Parallax, scene layers and cameras

The prison world now has four visual-only sectors. No obstacle, spotlight or
camera changes crash probabilities or virtual-credit payouts.

- src/game/sectorProgress.ts: pure distance-to-sector mapping. Thresholds 0,
  900, 2100 and 3500 refer to travelled pixels, not multiplier values.
- src/game/PrisonEnvironment.ts: the background world is a Container. It holds
  prebuilt far tiles, near tiles, cameras and light effects for every sector.
- src/game/PrisonScene.ts: increments visual distance using the single Ticker;
  the existing game engine still owns the result.

## PixiJS techniques

1. **Draw order**. The far wall is underneath detailed tiles, floor and sprites.
2. **Parallax**. The distant scenery moves by distance * 0.22; near bars and
   doors move by full distance. Two tiles of each kind form a looping wall.
3. **Cross-fade**. Container.alpha changes gradually for the old/new sectors.
   No new Graphics are allocated on sector transitions.
4. **Pivot animation**. A camera and its beam share a parent Container.
   Rotating that parent produces a scanning surveillance cone.
5. **Low-cost updates**. Tick changes rotation, alpha, x and y rather than
   redrawing shapes every frame. React remains outside the rendering loop.
6. **Logic isolation**. npm test checks sector boundaries without WebGL.

Try changing PARALLAX from 0.22 to 0.7, or FADE_MS from 380 to 900.
