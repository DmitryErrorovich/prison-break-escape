import assert from 'node:assert/strict';
import test from 'node:test';
import { GameAudio } from '../src/game/GameAudio.ts';

class FakeParam {
  value = 0;
  setValueAtTime(value) { this.value = value; }
  exponentialRampToValueAtTime(value) { this.value = value; }
  cancelScheduledValues() {}
}
class FakeNode { connect() {} disconnect() {} }
class FakeGain extends FakeNode { gain = new FakeParam(); }
class FakeOscillator extends FakeNode {
  frequency = new FakeParam();
  type = 'sine';
  onended = null;
  start() {}
  stop() {}
}
class FakeContext {
  constructor() {
    this.currentTime = 0;
    this.state = 'suspended';
    this.destination = {};
    this.oscillatorCount = 0;
    FakeContext.last = this;
  }
  createGain() { return new FakeGain(); }
  createOscillator() { this.oscillatorCount += 1; return new FakeOscillator(); }
  async resume() { this.state = 'running'; }
  async close() { this.state = 'closed'; }
}
const sample = (phase, round = 0) => ({
  phase, round, wager: 25, balance: 1000, multiplier: 1, payout: null,
  revealedCrash: null, history: [], autoPlay: false, scenario: 'quick', activeScenario: 'quick',
});

test('audio is silent until opt-in, and plays transitions just once', async () => {
  globalThis.window = { AudioContext: FakeContext };
  const audio = new GameAudio();
  audio.sync(sample('ready'));
  assert.equal(FakeContext.last, undefined);
  assert.equal(await audio.enable(), true);
  const context = FakeContext.last;
  const initial = context.oscillatorCount;
  audio.sync(sample('running', 1));
  assert.ok(context.oscillatorCount > initial);
  const started = context.oscillatorCount;
  audio.sync(sample('running', 1));
  assert.equal(context.oscillatorCount, started);
  context.currentTime += 3;
  audio.sync(sample('running', 1));
  assert.ok(context.oscillatorCount > started);
  audio.sync(sample('cashed-out', 1));
  const winCount = context.oscillatorCount;
  audio.sync(sample('cashed-out', 1));
  assert.equal(context.oscillatorCount, winCount);
  audio.disable();
  audio.sync(sample('crashed', 1));
  assert.equal(context.oscillatorCount, winCount);
  audio.dispose();
  assert.equal(context.state, 'closed');
  delete globalThis.window;
});

test('unsupported Web Audio returns false instead of throwing', async () => {
  const audio = new GameAudio();
  assert.equal(await audio.enable(), false);
  audio.dispose();
});
