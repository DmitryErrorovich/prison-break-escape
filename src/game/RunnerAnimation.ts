import { AnimatedSprite, Container, Graphics, Rectangle, type Application } from 'pixi.js';

const FRAME_WIDTH = 140;
const FRAME_HEIGHT = 192;
const FEET_Y = 180;
const RUN_FRAMES = 8;

interface Puppet {
  root: Container;
  leftLeg: Graphics;
  rightLeg: Graphics;
  leftArm: Graphics;
  rightArm: Graphics;
}

/**
 * First draw a character with ordinary Pixi Graphics. Limbs are separate
 * child Graphics whose origins sit at the joints, making rotations easy.
 */
function makePuppet(guard: boolean): Puppet {
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

/**
 * A tiny procedural sprite sheet: render eight poses to GPU textures once.
 * AnimatedSprite swaps those textures rather than recreating Graphics at 60fps.
 * No image files or external sprite packs are required.
 */
export function createAnimatedRunner(app: Application, guard: boolean): AnimatedSprite {
  const textures = Array.from({ length: RUN_FRAMES }, (_, frameIndex) => {
    const puppet = makePuppet(guard);
    const phase = (frameIndex / RUN_FRAMES) * Math.PI * 2;
    const stride = Math.sin(phase);
    puppet.leftLeg.rotation = stride * 0.52;
    puppet.rightLeg.rotation = -stride * 0.52;
    puppet.leftArm.rotation = -stride * 0.38;
    puppet.rightArm.rotation = stride * 0.38;

    // Each frame has the SAME bounding box and foot origin, so it won't jitter.
    puppet.root.position.set(FRAME_WIDTH / 2, FEET_Y - Math.abs(stride) * 5);
    const frame = new Container();
    frame.addChild(puppet.root);
    const texture = app.renderer.generateTexture({
      target: frame,
      frame: new Rectangle(0, 0, FRAME_WIDTH, FRAME_HEIGHT),
      resolution: 1,
      antialias: true,
    });
    frame.destroy({ children: true });
    return texture;
  });

  const sprite = new AnimatedSprite({
    textures,
    animationSpeed: 0.19,
    autoUpdate: false, // Our application Ticker is the single animation clock.
    loop: true,
  });
  sprite.anchor.set(0.5, FEET_Y / FRAME_HEIGHT);
  sprite.gotoAndStop(0);
  return sprite;
}