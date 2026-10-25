import { useEffect, useRef, useState } from 'react';
import { Application } from 'pixi.js';
import { DemoCrashEngine } from '../game/DemoCrashEngine';
import { PrisonScene } from '../game/PrisonScene';

interface PrisonCanvasProps {
  engine: DemoCrashEngine;
}

export function PrisonCanvas({ engine }: PrisonCanvasProps) {
  const host = useRef<HTMLDivElement>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const element = host.current;
    if (!element) return;

    const app = new Application();
    let disposed = false;
    let initialized = false;
    let destroyed = false;
    let resizeObserver: ResizeObserver | null = null;
    let scene: PrisonScene | null = null;

    async function initialize() {
      try {
        await app.init({
          resizeTo: element,
          background: 0x0a1626,
          antialias: true,
          autoDensity: true,
          resolution: Math.min(window.devicePixelRatio || 1, 2),
          preference: 'webgl',
        });
        initialized = true;
        if (disposed) {
          scene?.destroy();
          app.destroy({ removeView: true }, { children: true });
          destroyed = true;
          return;
        }

        element.appendChild(app.canvas);
        scene = new PrisonScene(app);
        scene.resize();
        resizeObserver = new ResizeObserver(() => {
          app.resize();
          scene?.resize();
        });
        resizeObserver.observe(element);
        app.ticker.add((ticker) => {
          engine.tick(ticker.deltaMS);
          scene?.update(ticker, engine.getState());
        });
        scene.update(undefined, engine.getState());
      } catch (reason) {
        if (initialized && !destroyed) {
          resizeObserver?.disconnect();
          scene?.destroy();
          app.destroy({ removeView: true }, { children: true });
          destroyed = true;
        }
        console.error('Failed to initialize PixiJS scene:', reason);
        if (!disposed) setError(true);
      }
    }

    void initialize();

    return () => {
      disposed = true;
      resizeObserver?.disconnect();
      if (initialized && !destroyed) {
        scene?.destroy();
        app.destroy({ removeView: true }, { children: true });
        destroyed = true;
      }
    };
  }, [engine]);

  return (
    <div className="canvas-host" ref={host} aria-label="Animated prison escape game scene" role="img">
      {error && <div className="canvas-error">Unable to start PixiJS. Try a browser with WebGL enabled.</div>}
    </div>
  );
}