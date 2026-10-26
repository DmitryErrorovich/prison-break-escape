/**
 * Local, virtual-credit-only game rules. No results are authoritative:
 * a real multiplayer or paid product must move this logic to a server.
 */
export type RoundPhase = 'ready' | 'running' | 'cashed-out' | 'crashed';

export interface GameState {
  phase: RoundPhase;
  multiplier: number;
  balance: number;
  wager: number;
  payout: number | null;
  revealedCrash: number | null;
  history: number[];
  round: number;
}

type Listener = (state: GameState) => void;

const INITIAL_CREDITS = 1_000;
const GROWTH_PER_SECOND = 0.22;
const EMIT_INTERVAL_MS = 70;

function roundCredits(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Demo-only random crash generation. Not a provably-fair algorithm. */
function chooseCrashPoint(random: () => number): number {
  const sample = random();
  if (sample < 0.025) return 1;
  return Math.min(30, Math.max(1.01, Math.floor((0.95 / (1 - sample)) * 100) / 100));
}

export class DemoCrashEngine {
  private listeners = new Set<Listener>();
  private elapsedMs = 0;
  private lastEmitMs = 0;
  private targetCrash = 1;

  private state: GameState = {
    phase: 'ready',
    multiplier: 1,
    balance: INITIAL_CREDITS,
    wager: 25,
    payout: null,
    revealedCrash: null,
    history: [],
    round: 0,
  };

  constructor(private readonly random: () => number = Math.random) {}

  getState(): GameState {
    return this.state;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  setWager(wager: number): void {
    if (this.state.phase === 'running' || ![10, 25, 50, 100].includes(wager)) return;
    this.state = { ...this.state, wager };
    this.emit();
  }

  startRound(): boolean {
    if (this.state.phase === 'running' || this.state.balance < this.state.wager) return false;

    this.elapsedMs = 0;
    this.lastEmitMs = 0;
    this.targetCrash = chooseCrashPoint(this.random);
    this.state = {
      ...this.state,
      phase: 'running',
      multiplier: 1,
      balance: roundCredits(this.state.balance - this.state.wager),
      payout: null,
      revealedCrash: null,
      round: this.state.round + 1,
    };
    this.emit();
    if (this.targetCrash === 1) this.crash();
    return true;
  }

  cashOut(): boolean {
    if (this.state.phase !== 'running') return false;
    const payout = roundCredits(this.state.wager * this.state.multiplier);
    this.state = {
      ...this.state,
      phase: 'cashed-out',
      balance: roundCredits(this.state.balance + payout),
      payout,
    };
    this.emit();
    return true;
  }

  tick(deltaMs: number): void {
    if (this.state.phase !== 'running') return;
    // A hidden tab should not cause a multi-second visual time jump in this demo.
    const step = Math.max(0, Math.min(deltaMs, 100));
    this.elapsedMs += step;
    this.lastEmitMs += step;
    const currentMultiplier = Math.exp((this.elapsedMs / 1000) * GROWTH_PER_SECOND);

    if (currentMultiplier >= this.targetCrash) {
      this.crash();
      return;
    }

    this.state = { ...this.state, multiplier: currentMultiplier };
    if (this.lastEmitMs >= EMIT_INTERVAL_MS) {
      this.lastEmitMs = 0;
      this.emit();
    }
  }

  resetDemoCredits(): void {
    if (this.state.phase === 'running') return;
    this.state = { ...this.state, balance: INITIAL_CREDITS };
    this.emit();
  }

  private crash(): void {
    this.state = {
      ...this.state,
      phase: 'crashed',
      multiplier: this.targetCrash,
      revealedCrash: this.targetCrash,
      history: [this.targetCrash, ...this.state.history].slice(0, 12),
    };
    this.emit();
  }

  private emit(): void {
    for (const listener of this.listeners) listener(this.state);
  }
}