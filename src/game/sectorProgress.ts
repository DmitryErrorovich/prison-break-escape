/** Distances control scenery only, never crash outcomes. */
export const SECTORS = [
  { id:'cells', name:'CELL BLOCK', description:'THE BREAKOUT BEGINS', start:0, wall:0x18283c, accent:0x65efb2 },
  { id:'maintenance', name:'MAINTENANCE', description:'STEAM & MACHINERY', start:900, wall:0x272c3a, accent:0xffbf68 },
  { id:'security', name:'SECURITY HUB', description:'UNDER SURVEILLANCE', start:2100, wall:0x202640, accent:0x7ecbff },
  { id:'tunnel', name:'EXIT TUNNEL', description:'ALMOST OUTSIDE', start:3500, wall:0x182f35, accent:0x84f5b2 },
] as const;
export type Sector = (typeof SECTORS)[number];
export function getSectorIndex(distance:number):number {
  if(!Number.isFinite(distance)||distance<=0) return 0;
  for(let i=SECTORS.length-1;i>=0;i--) if(distance>=SECTORS[i].start) return i;
  return 0;
}
export function getSector(distance:number):Sector { return SECTORS[getSectorIndex(distance)]; }
