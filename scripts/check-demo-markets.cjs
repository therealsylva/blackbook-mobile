const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const assert = require('node:assert/strict');
const cache = {};
function load(path) {
 if (cache[path]) return cache[path];
 const module = { exports: {} }; cache[path] = module.exports;
 const resolve = id => ({'./index-snapshot.json': './src/data/index-snapshot.json', './markets': './src/data/markets.ts', './football-markets': './src/data/football-markets.ts', './pairs': './src/data/pairs.ts'}[id]);
 vm.runInNewContext(ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{module,exports:module.exports,require:id=>{const p=resolve(id);if(p.endsWith('.json'))return JSON.parse(fs.readFileSync(p,'utf8'));return load(p);}});
 return module.exports;
}
const { MARKETS } = load('./src/data/markets.ts');
const { PAIR_MARKETS } = load('./src/data/pair-markets.ts');
const { makeSeries, makeCandles } = load('./src/lib/market-series.ts');
for (const market of [...MARKETS,...PAIR_MARKETS]) {
 assert.ok(Math.abs(market.change24h)>=1 && Math.abs(market.change24h)<=6,market.symbol+' daily movement');
 for (const range of ['15m','1H','4H','1D']) {
  const series = makeSeries(market,range);
  assert.ok(Math.abs(series.at(-1)-market.price)<1e-7,market.symbol+' chart endpoint');
  assert.ok(series.slice(1).filter((v,i)=>i>0&&(v-series[i])*(series[i]-series[i-1])<0).length>8,market.symbol+' chart variation');
  for(const candle of makeCandles(market,range)) assert.ok(candle.low<=Math.min(candle.open,candle.close)&&candle.high>=Math.max(candle.open,candle.close));
 }
 if(market.pairLegs){
  const [x,y]=market.pairLegs.map(symbol=>MARKETS.find(m=>m.symbol===symbol));
  assert.equal(market.price,x.price/y.price*1000);
  assert.ok(Math.abs(market.lowerBand/market.reference-1-Math.min(x.lowerBand/x.reference-1,y.lowerBand/y.reference-1))<1e-12);
  assert.ok(Math.abs(market.upperBand/market.reference-1-Math.max(x.upperBand/x.reference-1,y.upperBand/y.reference-1))<1e-12);
 }
}
console.log('38 markets: pair pricing, widest bands, 1–6% moves, jagged charts and valid candles passed.');
