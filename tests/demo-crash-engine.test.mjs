import assert from 'node:assert/strict';
import test from 'node:test';
import { DemoCrashEngine } from '../src/game/DemoCrashEngine.ts';

// Run with Node 22.16+ (built-in experimental TypeScript transformation).
test('cash out credits the player only once and freezes the round', () => {
  const engine = new DemoCrashEngine(() => 0.5);
  assert.equal(engine.startRound(), true);
  const afterStake = engine.getState();
  assert.equal(afterStake.balance, 975);
  engine.tick(100);
  const current = engine.getState().multiplier;
  assert.ok(current > 1);
  assert.equal(engine.cashOut(), true);
  const afterCashOut = engine.getState();
  assert.equal(afterCashOut.phase, 'cashed-out');
  assert.equal(afterCashOut.balance, Math.round((975 + 25 * current) * 100) / 100);
  assert.equal(engine.cashOut(), false);
  engine.tick(5000);
  assert.deepEqual(engine.getState(), afterCashOut);
});

test('instant crash records the outcome, not a payout', () => {
  const engine = new DemoCrashEngine(() => 0.01);
  assert.equal(engine.startRound(), true);
  assert.equal(engine.getState().phase, 'crashed');
  assert.equal(engine.getState().balance, 975);
  assert.deepEqual(engine.getState().history, [1]);
  assert.equal(engine.cashOut(), false);
});

test('running round cannot be restarted or have its wager changed', () => {
  const engine = new DemoCrashEngine(() => 0.7);
  engine.setWager(50);
  assert.equal(engine.startRound(), true);
  assert.equal(engine.startRound(), false);
  engine.setWager(100);
  assert.equal(engine.getState().wager, 50);
  assert.equal(engine.getState().balance, 950);
  assert.equal(engine.getState().round, 1);
});

test('time advances only up to 100 ms per tick', () => {
  const engine = new DemoCrashEngine(() => 0.7);
  engine.startRound();
  engine.tick(10_000);
  assert.equal(engine.getState().phase, 'running');
  assert.ok(engine.getState().multiplier < 1.03);
});