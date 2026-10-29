import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
// Pure chart helpers are compiled independently of the native UI runtime.
const source=readFileSync(new URL('../src/lib/market-series.ts',import.meta.url),'utf8');
const output=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const exports={};new Function('exports',output)(exports);
const {aggregateCandles,candleGeometry,selectCandles,MOBILE_CHART_RANGES,MOBILE_HISTORY_INTERVAL,MOBILE_HISTORY_LIMIT,selectMobileCandles}=exports;
const hour=3600000;
const rows=[{time:0,open:1,high:3,low:1,close:2,volume:null,intervalMs:hour},{time:hour,open:2,high:5,low:2,close:4,volume:null,intervalMs:hour},{time:hour*5,open:4,high:6,low:3,close:5,volume:2,intervalMs:hour}];
test('aggregate OHLC without inventing volume or finer historical resolution',()=>{
 const day=aggregateCandles(rows,24*hour);assert.equal(day.length,1);assert.deepEqual([day[0].open,day[0].high,day[0].low,day[0].close,day[0].volume],[1,6,1,5,2]);assert.equal(day[0].intervalMs,24*hour);
 assert.equal(aggregateCandles(rows.slice(0,2),24*hour)[0].volume,null);assert.equal(aggregateCandles(rows,60000).length,3);
});
test('geometry preserves missing periods and uses the aggregated interval',()=>{
 const g=candleGeometry(rows,360);assert.ok(g.x(2)-g.x(1)>g.x(1)-g.x(0));
 const daily=aggregateCandles([...rows,{...rows[0],time:24*hour}],24*hour);assert.equal(candleGeometry(daily,360).step,24*hour);
});

test('one-day window preserves one-minute candles',()=>{
 const mins=Array.from({length:3},(_,i)=>({time:i*60000,open:1,high:2,low:1,close:2,volume:1,intervalMs:60000}));
 assert.equal(selectCandles(mins,24*hour,60000).length,3);
 assert.equal(selectCandles(mins,60000,60000).length,2);
});

const monthRows=Array.from({length:744},(_,i)=>({
 time:i*hour,open:100+i,high:102+i,low:99+i,close:101+i,volume:null,intervalMs:hour,
}));
test('mobile offers daily, weekly and monthly windows backed by enough hourly history',()=>{
 assert.deepEqual(MOBILE_CHART_RANGES,['1D','7D','1M']);
 assert.equal(MOBILE_HISTORY_INTERVAL,'1h');
 assert.ok(MOBILE_HISTORY_LIMIT>=24*31);
 const daily=selectMobileCandles(monthRows,'1D'),weekly=selectMobileCandles(monthRows,'7D'),monthly=selectMobileCandles(monthRows,'1M');
 assert.ok(daily.length>=24&&daily.length<=25);
 assert.ok(weekly.length>=168&&weekly.length<=169);
 assert.ok(monthly.length<=200);
 assert.ok(monthly.at(-1).time-monthly[0].time>=29*24*hour,'month must not truncate to the last 200 hours');
 assert.equal(monthly[0].open,monthRows[23].open);
 assert.equal(monthly.at(-1).close,monthRows.at(-1).close);
 assert.ok(monthly.every(row=>row.intervalMs===4*hour&&row.volume===null));
});
test('mobile ranges preserve missing periods and do not invent candles or volume',()=>{
 const sparse=[monthRows[0],monthRows[240],monthRows[720]];
 for(const range of MOBILE_CHART_RANGES){
  const selected=selectMobileCandles(sparse,range);
  assert.ok(selected.length<=sparse.length);
  assert.ok(selected.every(row=>row.volume===null));
 }
 assert.deepEqual(selectMobileCandles([], '1M'),[]);
});
