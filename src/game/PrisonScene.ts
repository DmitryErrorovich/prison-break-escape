import { Container, Graphics, Text, type Application } from 'pixi.js';
import type { GameState } from './DemoCrashEngine';

// Logical units stay constant, while the entire stage scales with its host element.
export const SCENE_WIDTH = 1000;
export const SCENE_HEIGHT = 560;

interface Runner {
  root: Container;
  leftLeg: Graphics;
  rightLeg: Graphics;
  leftArm: Graphics;
  rightArm: Graphics;
}

function label(text: string, size: number, color: number, weight: 'normal' | 'bold' = 'bold'): Text {
  return new Text({
    text,
    style: { fontFamily: 'Arial, sans-serif', fontWeight: weight, fontSize: size, fill: color, letterSpacing: 2 },
  });
}

function makeRunner(guard: boolean): Runner {
  const root = new Container();
  const cloth = guard ? 0x344d73 : 0xf09b45;
  const shadow = guard ? 0x182b48 : 0x9d5425;

  const leftLeg = new Graphics().roundRect(-9, 0, 17, 51, 5).fill(shadow);
  const rightLeg = new Graphics().roundRect(-9, 0, 17, 51, 5).fill(cloth);
  leftLeg.position.set(-12, -49);
  rightLeg.position.set(12, -49);
  root.addChild(leftLeg, rightLeg);

  const body = new Graphics()
    .roundRect(-28, -122, 56, 78, 11).fill(cloth)
    .roundRect(-22, -112, 44, 9, 4).fill(guard ? 0x587395 : 0xffb265);
  if (guard) {
    body.roundRect(-9, -98, 18, 25, 2).fill(0x162740);
    body.circle(14, -106, 5).fill(0xdce8f6);
  } else {
    body.rect(-18, -97, 36, 4).fill(0x9d5425);
    body.rect(-18, -80, 36, 4).fill(0x9d5425);
    body.rect(-18, -63, 36, 4).fill(0x9d5425);
  }
  root.addChild(body);

  const leftArm = new Graphics().roundRect(-8, 0, 16, 66, 8).fill(shadow);
  const rightArm = new Graphics().roundRect(-8, 0, 16, 66, 8).fill(cloth);
  leftArm.position.set(-30, -116);
  rightArm.position.set(30, -116);
  root.addChild(leftArm, rightArm);

  const head = new Graphics()
    .roundRect(-19, -165, 38, 44, 13).fill(guard ? 0xd5a076 : 0xeeb789)
    .roundRect(-20, -169, 40, 14, 4).fill(guard ? 0x20334e : 0x382d33)
    .roundRect(-8, -143, 5, 4, 1).fill(0x1f222c)
    .roundRect(7, -143, 5, 4, 1).fill(0x1f222c);
  if (guard) head.roundRect(-25, -159, 50, 8, 2).fill(0x20334e);
  root.addChild(head);

  return { root, leftLeg, rightLeg, leftArm, rightArm };
}

function buildCorridorTile(): Container {
  const tile = new Container();
  const wall = new Graphics()
    .rect(0, 0, SCENE_WIDTH, 345).fill(0x18283c)
    .rect(0, 0, SCENE_WIDTH, 21).fill(0x263c54)
    .rect(0, 308, SCENE_WIDTH, 16).fill(0x293f53)
    .rect(0, 324, SCENE_WIDTH, 21).fill(0x0d1c30);
  tile.addChild(wall);

  for (let x = 50; x < SCENE_WIDTH; x += 238) {
    const door = new Graphics()
      .roundRect(x, 99, 132, 225, 6).fill(0x0c1727)
      .roundRect(x + 9, 107, 114, 209, 4).fill(0x16283b)
      .rect(x + 19, 114, 5, 197).fill(0x527084)
      .rect(x + 49, 114, 5, 197).fill(0x527084)
      .rect(x + 79, 114, 5, 197).fill(0x527084)
      .rect(x + 108, 114, 5, 197).fill(0x527084)
      .rect(x + 13, 154, 106, 6).fill(0x415d71)
      .rect(x + 13, 261, 106, 6).fill(0x415d71);
    tile.addChild(door);
    const number = label(`CELL ${String(Math.floor(x / 238) + 1).padStart(2, '0')}`, 13, 0x819bb4);
    number.position.set(x + 13, 73);
    tile.addChild(number);
  }

  const lamp = new Graphics().roundRect(390, 28, 220, 12, 5).fill(0xb4e7d9);
  const lampGlow = new Graphics().roundRect(357, 40, 286, 23, 10).fill({ color: 0x52c7b8, alpha: 0.12 });
  tile.addChild(lampGlow, lamp);
  return tile;
}

export class PrisonScene {
  private readonly background: Graphics;
  private readonly tiles: [Container, Container];
  private readonly prisoner: Runner;
  private readonly guard: Runner;
  private readonly floorMarks: Graphics[] = [];
  private readonly crashTint: Graphics;
  private readonly resultLabel: Text;
  private progress = 0;
  private animationTime = 0;

  constructor(private readonly app: Application) {
    const background = new Graphics()
      .rect(0, 0, SCENE_WIDTH, SCENE_HEIGHT).fill(0x0a1626)
      .rect(0, 342, SCENE_WIDTH, 218).fill(0x243345)
      .rect(0, 342, SCENE_WIDTH, 8).fill(0x3b5062)
      .rect(0, 522, SCENE_WIDTH, 38).fill(0x1a2736);
    this.background = background;
    this.app.stage.addChild(background);

    const first = buildCorridorTile();
    const second = buildCorridorTile();
    this.tiles = [first, second];
    this.app.stage.addChild(first, second);

    // The floor renders in front of the moving corridor, with scrolling lane marks.
    const floor = new Graphics()
      .rect(0, 342, SCENE_WIDTH, 218).fill(0x243345)
      .rect(0, 342, SCENE_WIDTH, 8).fill(0x405c70)
      .rect(0, 522, SCENE_WIDTH, 38).fill(0x1a2736)
      .rect(0, 452, SCENE_WIDTH, 2).fill({ color: 0x93a7b8, alpha: 0.17 });
    this.app.stage.addChild(floor);
    for (let index = 0; index < 12; index++) {
      const mark = new Graphics().roundRect(0, 0, 58, 5, 2).fill({ color: 0xa5b3bb, alpha: 0.27 });
      mark.y = 497;
      this.floorMarks.push(mark);
      this.app.stage.addChild(mark);
    }

    const title = label('BLOCK 07  /  SECURITY LEVEL: HIGH', 14, 0x97b5c8);
    title.position.set(28, 20);
    this.app.stage.addChild(title);
    const exitSign = new Graphics().roundRect(817, 19, 151, 35, 6).fill(0x183e39);
    const exitText = label('←  EXIT', 18, 0x65efb2);
    exitText.position.set(839, 25);
    this.app.stage.addChild(exitSign, exitText);

    this.guard = makeRunner(true);
    this.guard.root.position.set(240, 462);
    this.prisoner = makeRunner(false);
    this.prisoner.root.position.set(574, 462);
    const shadow = new Graphics().ellipse(574, 472, 52, 11).fill({ color: 0x000000, alpha: 0.2 });
    const guardShadow = new Graphics().ellipse(240, 472, 44, 9).fill({ color: 0x000000, alpha: 0.2 });
    this.app.stage.addChild(guardShadow, shadow, this.guard.root, this.prisoner.root);

    this.crashTint = new Graphics().rect(0, 0, SCENE_WIDTH, SCENE_HEIGHT).fill({ color: 0xff455f, alpha: 0.22 });
    this.crashTint.visible = false;
    this.app.stage.addChild(this.crashTint);
    this.resultLabel = label('', 64, 0xffffff);
    this.resultLabel.anchor.set(0.5);
    this.resultLabel.position.set(500, 274);
    this.app.stage.addChild(this.resultLabel);
  }

  resize(): void {
    const { width, height } = this.app.screen;
    const scale = Math.min(width / SCENE_WIDTH, height / SCENE_HEIGHT);
    this.app.stage.scale.set(scale);
    this.app.stage.position.set((width - SCENE_WIDTH * scale) / 2, (height - SCENE_HEIGHT * scale) / 2);
  }

  update(deltaMs: number, game: GameState): void {
    const running = game.phase === 'running';
    const move = running ? deltaMs * 0.34 : 0;
    this.animationTime += running ? deltaMs : 0;
    this.progress = (this.progress + move) % SCENE_WIDTH;
    this.tiles[0].x = -this.progress;
    this.tiles[1].x = SCENE_WIDTH - this.progress;
    this.floorMarks.forEach((mark, i) => {
      mark.x = ((i * 104 - this.progress * 1.75) % (SCENE_WIDTH + 104) + SCENE_WIDTH + 104) % (SCENE_WIDTH + 104) - 60;
    });

    const stride = running ? Math.sin(this.animationTime * 0.016) : 0;
    for (const actor of [this.prisoner, this.guard]) {
      actor.leftLeg.rotation = stride * 0.52;
      actor.rightLeg.rotation = -stride * 0.52;
      actor.leftArm.rotation = -stride * 0.38;
      actor.rightArm.rotation = stride * 0.38;
      actor.root.y = 462 - (running ? Math.abs(stride) * 5 : 0);
    }

    this.prisoner.root.x = game.phase === 'cashed-out' ? 765 : 574;
    this.guard.root.x = game.phase === 'crashed' ? 515 : running ? 240 + Math.min(140, Math.log(game.multiplier) * 38) : 240;
    this.crashTint.visible = game.phase === 'crashed';
    this.resultLabel.visible = game.phase === 'crashed' || game.phase === 'cashed-out';
    this.resultLabel.text = game.phase === 'crashed' ? 'CAUGHT!' : 'ESCAPED!';
    this.resultLabel.style.fill = game.phase === 'crashed' ? 0xff7282 : 0x75edb5;
  }
}