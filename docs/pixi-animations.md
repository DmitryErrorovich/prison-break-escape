# PixiJS lesson 2: from Graphics to AnimatedSprite

## Why we're changing the runner

PR #1 rotated each limb on every frame using `Graphics.rotation`. It works,
but when a pose is made of dozens of complex vector shapes it is cheaper to
rasterize a handful of poses once, and display their textures afterward.

PR #2 keeps our homemade vector character and adds an **eight-frame running cycle**.
There is no dependency on stock art and no image download to fail.

## Follow the actual code

1. **Draw the puppet** (`src/game/RunnerAnimation.ts`, `makePuppet`).
   `Container` is the parent; legs, arms, torso and head are child `Graphics`.
   Each limb has its local origin at its joint.
2. **Pose the limbs** (`createAnimatedRunner`). For eight angles around one
   full sine wave, rotate arms and legs in opposite directions.
3. **Bake each frame** (`app.renderer.generateTexture`). Draw each pose into a
   140 × 192 texture, keeping the feet at `y=180` in **every frame**. Without
   this consistent origin, the sprite would appear to jump as the frames change.
4. **Create the animation** (`new AnimatedSprite({ textures, autoUpdate: false })`).
   `anchor.set(0.5, 180 / 192)` makes the feet the logical position.
5. **Drive the animation** (`src/game/PrisonScene.ts`). A single ticker from
   `src/components/PrisonCanvas.tsx` passes `ticker` to `AnimatedSprite.update()`.
   `gotoAndPlay(0)` begins a run, and `stop()` freezes the last frame.
6. **React is NOT the renderer.** React owns the canvas and controls; PixiJS
   mutates the scene graph independently. We don't re-render React at 60 FPS.
7. **Clean up.** On component unmount, `PrisonScene.destroy()` releases the
   generated textures. The `Application` then destroys the stage and renderer.

## Things to try

- Change `RUN_FRAMES` from `8` to `4` or `12`: compare smoothness and memory.
- Change `animationSpeed` from `0.19` to `0.3`: the runners' legs move faster
  *without* changing the movement of the corridor or the crash multiplier.
- Change `FRAME_WIDTH`, `FRAME_HEIGHT`, or `FEET_Y`: see why stable texture
  boundaries and consistent anchors are important.
- Inspect the particle pool: `MAX_PARTICLES` objects are drawn once, then
  recycled. New particles do not allocate new `Graphics` every tick.
- Test the transition timing by editing `650` (capture) and `820` (escape)
  in `PrisonScene.update`.

## Later: real sprite sheets

A production pipeline usually packs PNG frames into a texture atlas with a
JSON descriptor. PixiJS can load it via `Assets.load('/runner.json')`, then
use `sheet.animations.run` as the textures array for `AnimatedSprite`.
That will be our next step if we want higher-quality external art.

This remains a virtual-credit-only simulation. Visuals must never decide
crash outcomes, and the local `DemoCrashEngine` is not suitable for real stakes.