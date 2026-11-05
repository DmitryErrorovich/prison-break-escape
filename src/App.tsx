import { useEffect, useMemo, useState } from 'react';
import { PrisonCanvas } from './components/PrisonCanvas';
import { GameAudio } from './game/GameAudio';
import { DemoCrashEngine, type GameState } from './game/DemoCrashEngine';
import { DEMO_CURRENCIES, DEMO_SCENARIOS, formatDemoAmount, type DemoCurrency, type DemoScenario } from './game/CaptureScenarios';

const engine = new DemoCrashEngine();
engine.setScenario('quick');
const wagers = [10,25,50,100] as const;
const multiplier = (value:number) => value.toFixed(2)+'×';
const status = (state:GameState) => ({
 ready:'YOUR ESCAPE STARTS HERE',running:'RUN! THE GUARDS ARE COMING',
 'cashed-out':'SUCCESSFUL ESCAPE',crashed:'YOU GOT CAUGHT'
})[state.phase];

export default function App(){
 const [game,setGame]=useState<GameState>(engine.getState());
 const [currency,setCurrency]=useState<DemoCurrency>('EUR');
 const [soundOn,setSoundOn]=useState(false);
 const [audioError,setAudioError]=useState(false);
 const audio=useMemo(()=>new GameAudio(),[]);
 useEffect(()=>{
   const unsubscribe=engine.subscribe(state=>{setGame(state);audio.sync(state);});
   return ()=>{unsubscribe();audio.dispose();};
 },[audio]);
 const toggleSound=()=>{
   if(soundOn){audio.disable();setSoundOn(false);return;}
   void audio.enable().then(enabled=>{setSoundOn(enabled);setAudioError(!enabled);});
 };
 const running=game.phase==='running';
 const afford=game.balance>=game.wager;
 const payout=running?game.wager*game.multiplier:(game.payout??game.wager);
 const scenario=DEMO_SCENARIOS[game.activeScenario];

 return <div className="app-shell"><div className="product-frame">
   <header className="topbar">
    <div className="brand">
     <div className="brand-mark" aria-hidden="true"><span>PB</span><small>07</small></div>
     <div className="brand-type"><strong>PRISON BREAK</strong><span>ESCAPE THE LIMITS</span></div>
    </div>
    <div className="wallet" aria-label="Simulated balance"><span>DEMO BALANCE</span><strong>{formatDemoAmount(game.balance,currency)}</strong></div>
   </header>
   <main className="workspace">
    <div className="session-strip"><span className="session-live"><i/> CREATIVE DEMO</span>
     <button type="button" className={'sound-toggle '+(soundOn?'enabled':'')}
      aria-pressed={soundOn} onClick={toggleSound}
      title={audioError?'Web Audio could not be started in this browser':'Tap once to enable sound on mobile'}>
      {soundOn?'🔊 SOUND ON':'🔇 SOUND OFF'}</button>
     <span>NO REAL MONEY OR PRIZES</span></div>
    <section className="game-section" aria-label="Prison escape demo game">
     <div className="scene-heading">
      <div><div className="eyebrow">ROUND #{String(game.round).padStart(4,'0')}</div><h1>THE ESCAPE</h1></div>
      <span className={'phase-pill '+game.phase}>{running?'● RUNNING':game.phase==='crashed'?'● CAUGHT':game.phase==='cashed-out'?'● ESCAPED':'● READY'}</span>
     </div>
     <div className="game-window">
      <PrisonCanvas engine={engine}/>
      <div className="scene-topline"><span>BLOCK 07</span><span>CCTV ACTIVE ●</span></div>
      <div className="scene-hud" aria-live="off">
       <div className="hud-kicker">ESCAPE MULTIPLIER</div>
       <div className={'multiplier '+(game.phase==='crashed'?'lost':'')}>{multiplier(game.multiplier)}</div>
       <div className={'status-line '+game.phase}>{status(game)}</div>
      </div>
      {(game.phase==='cashed-out'||game.phase==='crashed')&&<div className={'result-banner '+game.phase}>
       {game.phase==='cashed-out'?'DEMO WIN  '+formatDemoAmount(game.payout??0,currency):'CRASH AT '+multiplier(game.revealedCrash??1)}
      </div>}
      <div className="scene-bottomline"><span>BUILT WITH PIXIJS</span><span>SIMULATED GAMEPLAY</span></div>
     </div>
     <div className="history-panel"><div className="section-label">LAST CRASHES</div>
      <div className="history-list" aria-label="Simulated crash history">
       {game.history.length===0?<span className="empty-history">The chase starts here</span>:
        game.history.slice(0,7).map((point,i)=><span key={game.round+'-'+i} className={'history-chip '+(point>=2?'high':'low')}>{multiplier(point)}</span>)}
      </div>
     </div>
    </section>
    <section className="controls" aria-label="Demo betting controls">
     <div className="control-top"><span className="section-label">PLACE A DEMO BET</span><span className="top-code">AUTO / {game.autoPlay?'ON':'OFF'}</span></div>
     <div className="bet-header"><label htmlFor="wager-25">AMOUNT</label><span>{currency} · VIRTUAL</span></div>
     <div className="wager-grid" role="group" aria-label="Choose virtual stake">
      {wagers.map(wager=><button type="button" key={wager} id={'wager-'+wager}
       disabled={running||game.autoPlay} aria-pressed={game.wager===wager}
       onClick={()=>engine.setWager(wager)} className={'wager-button '+(game.wager===wager?'selected':'')}>
       {wager}<small>{currency}</small>
      </button>)}
     </div>
     <div className="payout-card"><div><span className="small-caption">{running?'CASH OUT VALUE':game.phase==='cashed-out'?'LAST DEMO WIN':'DEMO PAYOUT'}</span>
      <strong className="payout-value">{formatDemoAmount(payout,currency)}</strong></div>
      <span className="payout-multiplier">{multiplier(game.multiplier)}</span>
     </div>
     {running?<button type="button" className="action-button cashout" onClick={()=>engine.cashOut()}>
      <span>CASH OUT</span><span className="action-symbol">↗</span></button>:
      <button type="button" className="action-button start" disabled={!afford||game.autoPlay} onClick={()=>engine.startRound()}>
       <span>{game.autoPlay?'AUTO DEMO ACTIVE':'START ESCAPE'}</span><span className="action-symbol">→</span>
      </button>}
     <div className="helper-line">{game.autoPlay?'The demo sequence loops until stopped.':!afford?'Refill your virtual balance below.':'Cash out before the guards catch you.'}</div>
    </section>
    <details className="capture-panel">
     <summary><span>🎬 RECORDING SETTINGS</span><span className="capture-summary-note">{game.autoPlay?'AUTO ON':scenario.label}</span></summary>
     <div className="capture-body">
      <p className="capture-description">Prepare your screen recording: scripted outcomes, virtual balances, no real stakes.</p>
      <div className="settings-row"><label htmlFor="currency">DISPLAY CURRENCY</label>
       <select id="currency" value={currency} onChange={event=>setCurrency(event.target.value as DemoCurrency)}>
        {(Object.keys(DEMO_CURRENCIES) as DemoCurrency[]).map(code=><option value={code} key={code}>{code}</option>)}
       </select>
      </div>
      <div className="settings-row"><label htmlFor="scenario">MANUAL SCENARIO</label>
       <select id="scenario" value={game.scenario} disabled={running||game.autoPlay}
        onChange={event=>engine.setScenario(event.target.value as DemoScenario)}>
        {(Object.keys(DEMO_SCENARIOS) as DemoScenario[]).map(key=><option value={key} key={key}>{DEMO_SCENARIOS[key].label}</option>)}
       </select>
      </div>
      <label className="auto-row" htmlFor="autoplay"><span><strong>AUTO RECORD SEQUENCE</strong>
       <small>Quick → Close call → Crash → Big escape</small></span>
       <input id="autoplay" type="checkbox" checked={game.autoPlay} onChange={event=>engine.setAutoPlay(event.target.checked)}/>
      </label>
      <button className="reset-button" type="button" disabled={running} onClick={()=>engine.resetDemoCredits()}>REFILL DEMO BALANCE</button>
     </div>
    </details>
    <footer className="site-footer">SIMULATED GAMEPLAY · NO REAL DEPOSITS, WITHDRAWALS OR WINNINGS</footer>
   </main>
 </div></div>;
}
