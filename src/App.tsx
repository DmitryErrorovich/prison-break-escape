import { useEffect, useState } from 'react';
import { PrisonCanvas } from './components/PrisonCanvas';
import { DemoCrashEngine, type GameState } from './game/DemoCrashEngine';

const engine = new DemoCrashEngine();
const wagers = [10, 25, 50, 100] as const;

function amount(value: number): string {
  return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function multiplier(value: number): string {
  return `${value.toFixed(2)}×`;
}

function gameMessage(state: GameState): string {
  switch (state.phase) {
    case 'ready': return 'THE GATES ARE WAITING';
    case 'running': return 'THE CHASE IS ON';
    case 'cashed-out': return `ESCAPED WITH ${amount(state.payout ?? 0)} CREDITS`;
    case 'crashed': return `CAUGHT AT ${multiplier(state.revealedCrash ?? 1)}`;
  }
}

export default function App() {
  const [game, setGame] = useState<GameState>(engine.getState());
  useEffect(() => engine.subscribe(setGame), []);

  const playing = game.phase === 'running';
  const canAfford = game.balance >= game.wager;
  const potentialPayout = game.wager * game.multiplier;

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark"><span>PB</span><small>07</small></div>
          <div className="brand-type"><strong>PRISON BREAK</strong><span>ESCAPE PROTOCOL</span></div>
        </div>
        <div className="topbar-right">
          <span className="live-indicator"><i /> LOCAL SIMULATION</span>
          <span className="version-label">ALPHA / 0.1</span>
        </div>
      </header>

      <main className="workspace">
        <section className="game-section" aria-label="Game scene and status">
          <div className="scene-heading">
            <div><div className="eyebrow">PRISON SECTOR / 07</div><h1>THE ESCAPE</h1></div>
            <span className={`phase-pill ${playing ? 'active' : ''}`}>{playing ? '● RUNNING' : '● STANDBY'}</span>
          </div>
          <div className="game-window">
            <PrisonCanvas engine={engine} />
            <div className="scene-hud" aria-live="off">
              <div className="hud-kicker">CURRENT MULTIPLIER</div>
              <div className={`multiplier ${game.phase === 'crashed' ? 'lost' : ''}`}>{multiplier(game.multiplier)}</div>
              <div className={`status-line ${game.phase}`}>{gameMessage(game)}</div>
            </div>
            <div className="scene-edge scene-edge-top" aria-hidden="true" />
            <div className="scene-edge scene-edge-bottom" aria-hidden="true" />
          </div>
          <div className="scene-footer">
            <span><span className="legend-dot teal" /> ENGINE: PIXIJS 8</span>
            <span>ROUND: #{String(game.round).padStart(4, '0')}</span>
            <span><span className="legend-dot orange" /> VIRTUAL CREDITS ONLY</span>
          </div>
          <div className="history-panel">
            <div className="section-label">RECENT CAPTURES</div>
            <div className="history-list" aria-label="Previous crash multipliers">
              {game.history.length === 0 ? (
                <span className="empty-history">Complete your first round to see results.</span>
              ) : game.history.map((crash, index) => (
                <span className={`history-chip ${crash >= 2 ? 'high' : 'low'}`} key={`${game.round}-${index}`}>{multiplier(crash)}</span>
              ))}
            </div>
          </div>
        </section>

        <aside className="controls" aria-label="Demo game controls">
          <div className="control-top"><span className="section-label">CONTROL STATION</span><span className="top-code">// 001</span></div>
          <div className="balance-card">
            <div className="small-caption">YOUR BALANCE</div>
            <div className="balance-value">{amount(game.balance)} <span>CR</span></div>
            <div className="balance-subtitle">DEMO CREDITS · NO CASH VALUE</div>
          </div>
          <div className="bet-header"><label htmlFor="wager-25">ENTRY STAKE</label><span>SELECT AMOUNT</span></div>
          <div className="wager-grid" role="group" aria-label="Choose entry stake">
            {wagers.map((wager) => (
              <button
                type="button"
                id={`wager-${wager}`}
                key={wager}
                disabled={playing}
                className={`wager-button ${game.wager === wager ? 'selected' : ''}`}
                onClick={() => engine.setWager(wager)}
                aria-pressed={game.wager === wager}
              >
                {wager} <small>CR</small>
              </button>
            ))}
          </div>
          <div className="payout-card">
            <div className="small-caption">{playing ? 'AVAILABLE TO CASH OUT' : 'POTENTIAL PAYOUT'}</div>
            <div className="payout-value">{amount(playing ? potentialPayout : game.wager)} <span>CR</span></div>
          </div>
          {playing ? (
            <button className="action-button cashout" onClick={() => engine.cashOut()}>
              CASH OUT <span>↗</span>
            </button>
          ) : (
            <button className="action-button start" disabled={!canAfford} onClick={() => engine.startRound()}>
              START ESCAPE <span>→</span>
            </button>
          )}
          {!canAfford && !playing && (
            <button className="reset-button" onClick={() => engine.resetDemoCredits()}>REFILL DEMO CREDITS</button>
          )}
          <p className="control-helper">
            {playing ? 'Cash out before the guards catch you.' :
              game.phase === 'cashed-out' ? 'You made it out. Start another round.' :
              game.phase === 'crashed' ? 'The guards got you. Try another run.' :
              'Start a round. The multiplier rises until you cash out or get caught.'}
          </p>
          <div className="control-notice"><span>ⓘ</span><p>This is a learning prototype. Outcomes are simulated locally and are not suitable for real-money betting.</p></div>
        </aside>
      </main>
      <footer className="site-footer"><span>© PRISON BREAK: ESCAPE</span><span>BUILT WITH REACT + TYPESCRIPT + PIXIJS</span></footer>
    </div>
  );
}