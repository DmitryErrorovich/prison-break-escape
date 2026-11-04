/** Scripted demonstration outcomes for creative footage, not actual odds. */
export const DEMO_SCENARIOS = {
  random: { label: 'Random demo', crashAt: null, autoCashOutAt: null },
  quick: { label: 'Quick escape', crashAt: 2.75, autoCashOutAt: 1.85 },
  close: { label: 'Close call', crashAt: 3.28, autoCashOutAt: 3.08 },
  crash: { label: 'Instant capture', crashAt: 1.01, autoCashOutAt: null },
  big: { label: 'Big escape', crashAt: 10.2, autoCashOutAt: 8.42 },
} as const;
export type DemoScenario = keyof typeof DEMO_SCENARIOS;
export const AUTO_SEQUENCE: readonly DemoScenario[] = ['quick', 'close', 'crash', 'big'];
/** Fiat-style labels apply to imaginary credits, never real balances or FX. */
export const DEMO_CURRENCIES = {EUR: '€', USD: '$', RON: 'lei'} as const;
export type DemoCurrency = keyof typeof DEMO_CURRENCIES;
export function formatDemoAmount(amount:number,currency:DemoCurrency):string{
  const value=amount.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
  return currency==='RON'?value+' lei':DEMO_CURRENCIES[currency]+value;
}
