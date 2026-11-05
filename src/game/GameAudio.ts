import type { GameState, RoundPhase } from './DemoCrashEngine';

/** Lightweight original Web Audio effects; no samples or third-party assets. */
export class GameAudio {
  private context: AudioContext | null = null;
  private output: GainNode | null = null;
  private enabled = false;
  private lastPhase: RoundPhase | null = null;
  private lastRound = -1;
  private lastStepAt = -Infinity;
  private lastSirenAt = -Infinity;
  private stepIndex = 0;
  private lastState: GameState | null = null;

  /** Must be invoked from a user gesture to unlock audio on iOS/Android. */
  async enable(): Promise<boolean> {
    if (typeof window === 'undefined' || typeof window.AudioContext === 'undefined') return false;
    try {
      const ctx = this.context ?? new window.AudioContext();
      this.context = ctx;
      if (!this.output) {
        this.output = ctx.createGain();
        this.output.gain.value = 0.28;
        this.output.connect(ctx.destination);
      }
      // resume() is called before the first await, preserving the tap gesture.
      await ctx.resume();
      if (ctx.state !== 'running') return false;
      this.enabled = true;
      this.output.gain.setValueAtTime(0.28, ctx.currentTime);
      this.lastStepAt = ctx.currentTime;
      this.lastSirenAt = ctx.currentTime;
      this.chime();
      if (this.lastState?.phase === 'running') this.startChase();
      return true;
    } catch {
      return false;
    }
  }

  disable(): void {
    this.enabled = false;
    if (this.context && this.output) {
      // Cut off scheduled tails without destroying the context.
      this.output.gain.cancelScheduledValues(this.context.currentTime);
      this.output.gain.setValueAtTime(0, this.context.currentTime);
    }
  }

  /** Called from game subscriptions, not React renders. */
  sync(state: GameState): void {
    this.lastState = state;
    if (state.phase !== this.lastPhase || state.round !== this.lastRound) {
      this.lastPhase = state.phase;
      this.lastRound = state.round;
      if (this.enabled) {
        switch (state.phase) {
          case 'running': this.startChase(); break;
          case 'cashed-out': this.escape(); break;
          case 'crashed': this.caught(); break;
          default: break;
        }
      }
    }
    const ctx = this.context;
    if (!this.enabled || !ctx || ctx.state !== 'running' || state.phase !== 'running') return;
    const now = ctx.currentTime;
    if (now - this.lastStepAt >= 0.29) {
      this.lastStepAt = now;
      this.footstep();
    }
    if (now - this.lastSirenAt >= 2.5) {
      this.lastSirenAt = now;
      this.siren();
    }
  }

  dispose(): void {
    this.disable();
    const ctx = this.context;
    this.context = null;
    this.output = null;
    if (ctx && ctx.state !== 'closed') void ctx.close().catch(() => {});
  }

  private tone(
    frequency: number,
    seconds: number,
    loudness: number,
    wave: OscillatorType = 'sine',
    delay = 0,
    sweepTo?: number,
  ): void {
    const ctx = this.context;
    const output = this.output;
    if (!this.enabled || !ctx || !output || ctx.state !== 'running') return;
    const start = ctx.currentTime + delay;
    const oscillator = ctx.createOscillator();
    const envelope = ctx.createGain();
    oscillator.type = wave;
    oscillator.frequency.setValueAtTime(frequency, start);
    if (sweepTo) oscillator.frequency.exponentialRampToValueAtTime(sweepTo, start + seconds);
    envelope.gain.setValueAtTime(0.0001, start);
    envelope.gain.exponentialRampToValueAtTime(Math.max(0.0002, loudness), start + 0.014);
    envelope.gain.exponentialRampToValueAtTime(0.0001, start + seconds);
    oscillator.connect(envelope);
    envelope.connect(output);
    oscillator.onended = () => { oscillator.disconnect(); envelope.disconnect(); };
    oscillator.start(start);
    oscillator.stop(start + seconds + 0.025);
  }

  private chime(): void {
    this.tone(560, 0.09, 0.09, 'sine');
    this.tone(840, 0.13, 0.06, 'sine', 0.09);
  }

  private startChase(): void {
    const now = this.context?.currentTime ?? 0;
    this.lastStepAt = now;
    this.lastSirenAt = now;
    this.tone(180, 0.18, 0.14, 'triangle', 0, 315);
    this.tone(540, 0.12, 0.08, 'square', 0.11);
  }

  private footstep(): void {
    this.stepIndex++;
    this.tone(this.stepIndex % 2 === 0 ? 92 : 110, 0.075, 0.085, 'triangle', 0, 58);
  }

  private siren(): void {
    this.tone(410, 0.32, 0.035, 'sawtooth', 0, 710);
    this.tone(710, 0.34, 0.035, 'sawtooth', 0.33, 410);
  }

  private escape(): void {
    [440, 555, 740, 990].forEach((frequency, index) => {
      this.tone(frequency, 0.2, 0.12, 'sine', index * 0.11);
    });
  }

  private caught(): void {
    this.tone(620, 0.44, 0.15, 'sawtooth', 0, 145);
    this.tone(168, 0.31, 0.2, 'triangle', 0.12, 48);
  }
}
