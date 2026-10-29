export interface CandlePoint {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number | null;
  source?: 'history' | 'trades';
  breakBefore?: boolean;
  intervalMs?: number;
}

export function aggregateCandles(rows: CandlePoint[], step: number): CandlePoint[] {
 const buckets=new Map<number,CandlePoint>();
 for(const row of rows){
  const width=Math.max(step,row.intervalMs??step),time=Math.floor(row.time/width)*width,old=buckets.get(time);
  buckets.set(time,old?{...old,high:Math.max(old.high,row.high),low:Math.min(old.low,row.low),close:row.close,
   volume:old.volume===null&&row.volume===null?null:(old.volume??0)+(row.volume??0)}:{...row,time,intervalMs:width});
 }
 return [...buckets.values()].sort((a,b)=>a.time-b.time).slice(-200);
}

export function candleGeometry(rows:CandlePoint[], width:number, padding=8){
 const first=rows[0]?.time??0,last=rows.at(-1)?.time??first;
 const intervals=[...rows.map(r=>r.intervalMs??Infinity),...rows.slice(1).map((r,i)=>r.time-rows[i]!.time).filter(n=>n>0)];
 const minimum=Math.min(...intervals),step=Number.isFinite(minimum)?minimum:3600000;
 const span=Math.max(step,last-first+step),x=(index:number)=>padding+((rows[index]!.time-first+step/2)/span)*(width-padding*2);
 return {x,step,span};
}

/** Select a visible time window without changing the selected candle interval. */
export function selectCandles(rows:CandlePoint[],windowMs:number,intervalMs:number):CandlePoint[]{
 if(!rows.length)return [];
 const latest=rows.at(-1)!.time;
 return aggregateCandles(rows.filter(row=>row.time>=latest-windowMs),intervalMs);
}

/** Mobile controls are history windows; candle widths keep each window readable. */
export const MOBILE_CHART_RANGES = ['1D', '7D', '1M'] as const;
export type MobileChartRange = typeof MOBILE_CHART_RANGES[number];
export const MOBILE_HISTORY_INTERVAL = '1h';
export const MOBILE_HISTORY_LIMIT = 744; // 31 days, including a partial current hour.
const HOUR_MS = 3_600_000;
const MOBILE_CHART_WINDOWS: Record<MobileChartRange, { windowMs: number; intervalMs: number }> = {
  '1D': { windowMs: 24 * HOUR_MS, intervalMs: HOUR_MS },
  '7D': { windowMs: 7 * 24 * HOUR_MS, intervalMs: HOUR_MS },
  '1M': { windowMs: 30 * 24 * HOUR_MS, intervalMs: 4 * HOUR_MS },
};

export function isMobileChartRange(range: string): range is MobileChartRange {
  return range === '1D' || range === '7D' || range === '1M';
}

export function selectMobileCandles(rows: CandlePoint[], range: MobileChartRange): CandlePoint[] {
  const { windowMs, intervalMs } = MOBILE_CHART_WINDOWS[range];
  return selectCandles(rows, windowMs, intervalMs);
}
