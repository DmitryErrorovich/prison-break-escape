import assert from 'node:assert/strict';
import test from 'node:test';
import { DemoCrashEngine } from '../src/game/DemoCrashEngine.ts';
import { AUTO_SEQUENCE, formatDemoAmount } from '../src/game/CaptureScenarios.ts';
function advance(e,n){for(let i=0;i<n;i++)e.tick(100)}
test('scripted win credits balance once',()=>{
 const e=new DemoCrashEngine(()=>0.01); e.startRound('quick');advance(e,30);
 assert.equal(e.getState().phase,'cashed-out');assert.ok(e.getState().multiplier>=1.85);
 const b=e.getState().balance;advance(e,40);assert.equal(e.getState().balance,b);
});
test('scripted capture ignores random seed',()=>{
 const e=new DemoCrashEngine(()=>0.99);e.startRound('crash');advance(e,10);
 assert.equal(e.getState().phase,'crashed');assert.equal(e.getState().revealedCrash,1.01);
});
test('autoplay cycles and can be stopped',()=>{
 const e=new DemoCrashEngine();e.setAutoPlay(true);advance(e,6);
 assert.equal(e.getState().activeScenario,AUTO_SEQUENCE[0]);advance(e,30);
 assert.equal(e.getState().phase,'cashed-out');advance(e,14);
 assert.equal(e.getState().activeScenario,AUTO_SEQUENCE[1]);
 e.setAutoPlay(false);advance(e,100);assert.equal(e.getState().round,2);
});
test('currency labels do not convert amounts',()=>{
 assert.equal(formatDemoAmount(1250.5,'EUR'),'€1,250.50');
 assert.equal(formatDemoAmount(1250.5,'RON'),'1,250.50 lei');
});
