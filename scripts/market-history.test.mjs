import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
// Pure chart helpers are compiled independently of the native UI runtime.
const source=readFileSync(new URL('../src/lib/market-series.ts',import.meta.url),'utf8');
const output=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const exports={};new Function('exports',output)(exports);
const {aggregateCandles,candleGeometry,selectCandles}=exports;
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
