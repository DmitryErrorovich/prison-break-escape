import { Graphics, Text, type Application, type Ticker } from 'pixi.js';
import type { GameState, RoundPhase } from './DemoCrashEngine';
import { createAnimatedRunner } from './RunnerAnimation';
import { PrisonEnvironment } from './PrisonEnvironment';

// Fixed logical size; scale the scene graph to fit its parent canvas.
export const SCENE_WIDTH = 1000;
export const SCENE_HEIGHT = 560;

const FLOOR_Y = 462;
const MAX_PARTICLES = 36;

type Dust = { shape: Graphics; vx: number; vy: number; life: number; duration: number };

function label(text: string, size: number, color: number): Text {
  return new Text({
    text,
    style: { fontFamily: 'Arial, sans-serif', fontWeight: 'bold', fontSize: size, fill: color, letterSpacing: 2 },
  });
}

function clamp01(value: number): number { return Math.min(1, Math.max(0, value)); }
function easeOutCubic(value: number): number { return 1 - (1 - clamp01(value)) ** 3; }

/** Scene owns visuals only; DemoCrashEngine remains responsible for results. */
export class PrisonScene {
  private readonly environment: PrisonEnvironment;
  private readonly prisoner;
  private readonly guard;
  private readonly prisonerShadow: Graphics;
  private readonly guardShadow: Graphics;
  private readonly floorMarks: Graphics[] = [];
  private readonly alarmWash: Graphics;
  private readonly alarmLamps: Graphics[];
  private readonly resultLabel: Text;
  private readonly dust: Dust[];
  private phase: RoundPhase = 'ready';
  private progress = 0;
  private distance = 0;
  private animationMs = 0;
  private transitionMs = 0;
  private dustMs = 0;
  private baseX = 0;
  private baseY = 0;
  private guardAtStop = 240;

  constructor(private readonly app: Application) {
    const background = new Graphics()
      .rect(0, 0, SCENE_WIDTH, SCENE_HEIGHT).fill(0x0a1626)
      .rect(0, 342, SCENE_WIDTH, 218).fill(0x243345)
      .rect(0, 342, SCENE_WIDTH, 8).fill(0x3b5062)
      .rect(0, 522, SCENE_WIDTH, 38).fill(0x1a2736);
    app.stage.addChild(background);

    this.environment = new PrisonEnvironment();
    app.stage.addChild(this.environment);

    const floor = new Graphics()
      .rect(0, 342, SCENE_WIDTH, 218).fill(0x243345)
      .rect(0, 342, SCENE_WIDTH, 8).fill(0x405c70)
      .rect(0, 522, SCENE_WIDTH, 38).fill(0x1a2736)
      .rect(0, 452, SCENE_WIDTH, 2).fill({ color: 0x93a7b8, alpha: 0.17 });
    app.stage.addChild(floor);
    for (let index = 0; index < 12; index++) {
      const mark = new Graphics().roundRect(0, 0, 58, 5, 2).fill({ color: 0xa5b3bb, alpha: 0.27 });
      mark.y = 497;
      this.floorMarks.push(mark);
      app.stage.addChild(mark);
    }

    const title = label('BLOCK 07  /  SECURITY LEVEL: HIGH', 14, 0x97b5c8);
    title.position.set(28, 20);
    app.stage.addChild(title);
    const exitSign = new Graphics().roundRect(817, 19, 151, 35, 6).fill(0x183e39);
    const exitText = label('←  EXIT', 18, 0x65efb2);
    exitText.position.set(839, 25);
    app.stage.addChild(exitSign, exitText);

    // New: frame-based animation from procedurally generated textures.
    this.guard = createAnimatedRunner(app, true);
    this.prisoner = createAnimatedRunner(app, false);
    this.guard.position.set(240, FLOOR_Y);
    this.prisoner.position.set(574, FLOOR_Y);
    this.prisonerShadow = new Graphics().ellipse(0, 0, 52, 11).fill({ color: 0x000000, alpha: 0.2 });
    this.guardShadow = new Graphics().ellipse(0, 0, 44, 9).fill({ color: 0x000000, alpha: 0.2 });
    this.prisonerShadow.position.set(574, 472);
    this.guardShadow.position.set(240, 472);
    app.stage.addChild(this.guardShadow, this.prisonerShadow, this.guard, this.prisoner);

    // Pool the particle Graphics: no allocations during the animation loop.
    this.dust = Array.from({ length: MAX_PARTICLES }, () => {
      const shape = new Graphics().circle(0, 0, 3).fill(0xf4c58e);
      shape.visible = false;
      app.stage.addChild(shape);
      return { shape, vx: 0, vy: 0, life: 0, duration: 1 };
    });

    this.alarmLamps = [80, 500, 920].map((x) => {
      const lamp = new Graphics().circle(0, 0, 9).fill(0xff5365);
      lamp.position.set(x, 61);
      app.stage.addChild(lamp);
      return lamp;
    });
    this.alarmWash = new Graphics()
      .rect(0, 0, SCENE_WIDTH, SCENE_HEIGHT).fill(0xff3b57);
    this.alarmWash.alpha = 0;
    app.stage.addChild(this.alarmWash);

    this.resultLabel = label('', 64, 0xffffff);
    this.resultLabel.anchor.set(0.5);
    this.resultLabel.position.set(500, 310);
    this.resultLabel.visible = false;
    app.stage.addChild(this.resultLabel);
  }

  resize(): void {
    const { width, height } = this.app.screen;
    const scale = Math.min(width / SCENE_WIDTH, height / SCENE_HEIGHT);
    this.app.stage.scale.set(scale);
    this.baseX = (width - SCENE_WIDTH * scale) / 2;
    this.baseY = (height - SCENE_HEIGHT * scale) / 2;
    this.app.stage.position.set(this.baseX, this.baseY);
  }

  update(ticker: Ticker | undefined, game: GameState): void {
    // deltaMS in milliseconds: use time-based movement regardless of FPS.
    const dt = Math.min(Math.max(ticker?.deltaMS ?? 0, 0), 100);
    const running = game.phase === 'running';

    if (game.phase !== this.phase) {
      this.onPhaseChange(game.phase);
    }
    this.transitionMs += dt;
    this.animationMs += dt;

    if (running) {
      this.distance += dt * 0.34;
      this.progress = this.distance % SCENE_WIDTH;
      this.dustMs += dt;
      while (this.dustMs >= 95) {
        this.dustMs -= 95;
        this.spawnDust(this.prisoner.x - 18, FLOOR_Y + 2, false);
        this.spawnDust(this.guard.x - 18, FLOOR_Y + 2, false);
      }
      if (ticker) {
        this.prisoner.update(ticker);
        this.guard.update(ticker);
      }
    }

    this.environment.update(dt, this.distance, running);
    this.floorMarks.forEach((mark, i) => {
      mark.x = ((i * 104 - this.progress * 1.75) % (SCENE_WIDTH + 104) + SCENE_WIDTH + 104) % (SCENE_WIDTH + 104) - 60;
    });

    if (running) {
      this.prisoner.position.set(574, FLOOR_Y);
      this.guard.position.set(240 + Math.min(140, Math.log(game.multiplier) * 38), FLOOR_Y);
      this.prisoner.rotation = 0;
      this.guard.rotation = 0;
    } else if (game.phase === 'crashed') {
      const t = easeOutCubic(this.transitionMs / 650);
      this.guard.position.set(this.guardAtStop + (534 - this.guardAtStop) * t, FLOOR_Y);
      this.prisoner.position.set(574 + 24 * t, FLOOR_Y + 3 * t);
      this.prisoner.rotation = -1.05 * t;
      this.guard.rotation = -0.12 * Math.sin(Math.PI * t);
    } else if (game.phase === 'cashed-out') {
      const t = easeOutCubic(this.transitionMs / 820);
      this.prisoner.position.set(574 + 480 * t, FLOOR_Y - Math.sin(t * Math.PI) * 36);
      this.guard.position.set(this.guardAtStop, FLOOR_Y);
      this.prisoner.rotation = 0;
      this.guard.rotation = 0;
    } else {
      this.prisoner.position.set(574, FLOOR_Y);
      this.guard.position.set(240, FLOOR_Y);
      this.prisoner.rotation = 0;
      this.guard.rotation = 0;
    }

    this.prisonerShadow.position.set(this.prisoner.x, FLOOR_Y + 10);
    this.guardShadow.position.set(this.guard.x, FLOOR_Y + 10);
    this.prisonerShadow.alpha = game.phase === 'cashed-out' ? 1 - easeOutCubic(this.transitionMs / 820) : 1;

    this.updateDust(dt);
    const flash = (Math.sin(this.animationMs * 0.012) + 1) / 2;
    this.alarmLamps.forEach((lamp, index) => {
      lamp.alpha = running ? (index % 2 ? 1 - flash : flash) * 0.9 + 0.1 : 0.23;
    });
    this.alarmWash.alpha = running ? flash * 0.075 : game.phase === 'crashed' ? Math.max(0, 0.24 * (1 - this.transitionMs / 900)) : 0;

    const impact = game.phase === 'crashed' ? Math.max(0, 1 - this.transitionMs / 330) : 0;
    const shake = impact > 0 ? Math.sin(this.transitionMs * 0.11) * 9 * impact : 0;
    this.app.stage.position.set(this.baseX + shake, this.baseY);

    this.resultLabel.visible = game.phase === 'crashed' || game.phase === 'cashed-out';
    if (this.resultLabel.visible) {
      this.resultLabel.text = game.phase === 'crashed' ? 'CAUGHT!' : 'ESCAPED!';
      this.resultLabel.style.fill = game.phase === 'crashed' ? 0xff7282 : 0x75edb5;
      this.resultLabel.alpha = clamp01(this.transitionMs / 260);
      this.resultLabel.scale.set(0.85 + 0.15 * easeOutCubic(this.transitionMs / 400));
    }
  }

  /** Release generated GPU textures explicitly before Application.destroy(). */
  destroy(): void {
    this.prisoner.destroy({ texture: true, textureSource: true });
    this.guard.destroy({ texture: true, textureSource: true });
  }

  private onPhaseChange(next: RoundPhase): void {
    this.guardAtStop = this.guard.x;
    this.phase = next;
    this.transitionMs = 0;
    this.dustMs = 0;
    if (next === 'running') {
      this.progress = 0;
      this.distance = 0;
      this.animationMs = 0;
      this.dust.forEach((particle) => { particle.life = 0; particle.shape.visible = false; });
      this.guard.gotoAndPlay(0);
      this.prisoner.gotoAndPlay(0);
    } else {
      this.guard.stop();
      this.prisoner.stop();
      if (next === 'crashed') {
        for (let i = 0; i < 17; i++) this.spawnDust(562, FLOOR_Y - 52, true);
      } else if (next === 'cashed-out') {
        for (let i = 0; i < 15; i++) this.spawnDust(574, FLOOR_Y - 90, true);
      }
    }
  }

  private spawnDust(x: number, y: number, burst: boolean): void {
    const particle = this.dust.find((entry) => entry.life <= 0);
    if (!particle) return;
    const angle = (Math.random() * 2 - 1) * Math.PI;
    const speed = burst ? 1.4 + Math.random() * 2.8 : 0.25 + Math.random() * 0.9;
    particle.vx = (burst ? Math.cos(angle) : -1) * speed;
    particle.vy = (burst ? Math.sin(angle) : -0.35) * speed;
    particle.duration = burst ? 560 + Math.random() * 360 : 420;
    particle.life = particle.duration;
    particle.shape.position.set(x + Math.random() * 12 - 6, y);
    particle.shape.tint = burst && this.phase === 'crashed' ? 0xff7886 : 0xffca89;
    particle.shape.scale.set(burst ? 1.4 : 0.75);
    particle.shape.alpha = 0.9;
    particle.shape.visible = true;
  }

  private updateDust(dt: number): void {
    for (const particle of this.dust) {
      if (particle.life <= 0) continue;
      particle.life = Math.max(0, particle.life - dt);
      particle.shape.x += particle.vx * dt * 0.06;
      particle.shape.y += particle.vy * dt * 0.06;
      particle.shape.alpha = particle.life / particle.duration;
      particle.shape.visible = particle.life > 0;
    }
  }
}