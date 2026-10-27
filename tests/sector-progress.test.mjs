import assert from 'node:assert/strict';
import test from 'node:test';
import { getSector, getSectorIndex, SECTORS } from '../src/game/sectorProgress.ts';

test('starts in cells for invalid or negative distance', () => {
  assert.equal(getSectorIndex(0),0);
  assert.equal(getSector(-3).id,'cells');
  assert.equal(getSectorIndex(NaN),0);
  assert.equal(getSectorIndex(Infinity),0);
});
test('changes sectors at visual distance thresholds', () => {
  assert.deepEqual(SECTORS.map(s=>getSector(s.start).id),['cells','maintenance','security','tunnel']);
  assert.deepEqual(SECTORS.map(s=>getSector(s.start-(s.start?1:0)).id),['cells','cells','maintenance','security']);
});
test('long runs stay inside the final exit tunnel', () => {
  assert.equal(getSector(100000).id,'tunnel');
  assert.equal(getSectorIndex(3600),SECTORS.length-1);
});
