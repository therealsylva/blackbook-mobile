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
