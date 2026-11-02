import test from 'node:test';
import assert from 'node:assert/strict';
import { rankMarkets } from '../src/lib/market-rankings.ts';
import { netPnlMinor, realizedPnlMinor } from '../src/lib/realized-pnl.ts';
import { parseUpdate } from '../src/lib/update-policy.ts';
import { normalizeMarketCatalog } from '../src/lib/market-catalog.ts';

test('pairs outrank clubs on the same volume and volatility metrics; missing values stay out', () => {
  const markets = [{symbol:'RMD',volumeUsd24h:10,volatility24h:1}, {symbol:'BAR/RMD',volumeUsd24h:100,volatility24h:5}, {symbol:'ROD',volumeUsd24h:0,volatility24h:0}, {symbol:'UNKNOWN',volumeUsd24h:NaN}];
  const ranks = rankMarkets(markets, () => 0);
  assert.equal(ranks.volume[0].symbol,'BAR/RMD');
  assert.equal(ranks.volatility[0].symbol,'BAR/RMD');
  assert.equal(ranks.volume.at(-1).symbol,'ROD');
  assert.equal(ranks.volume.some(row => row.symbol==='UNKNOWN'),false);
});
test('net history counts both opening and closing fees, wins, losses and breakeven exits exactly', () => {
  const fills = [{realizedPnlMinor:'0',feeMinor:'6'}, {realizedPnlMinor:'100',feeMinor:'6'}, {realizedPnlMinor:'-50',feeMinor:'4'}, {realizedPnlMinor:'0',feeMinor:'3'}];
  assert.equal(netPnlMinor(fills[0]),-6n);
  assert.equal(realizedPnlMinor(fills),31n);
  assert.equal(netPnlMinor({realizedPnlMinor:'900719925474099300',feeMinor:'1'}),900719925474099299n);
});
test('updates compare installed build codes, reject foreign APK URLs and accept older manifests', () => {
  const update={version:'0.2.19',versionCode:21,url:'https://tradeblackbook.org/downloads/BlackBook-0.2.19.apk'};
  assert.equal(parseUpdate(update,'0.2.18',20).version,'0.2.19');
  assert.equal(parseUpdate(update,'0.2.19',21),null);
  assert.throws(() => parseUpdate({...update,url:'https://example.com/app.apk'},'0.2.18'),/Invalid/);
  assert.throws(() => parseUpdate({...update,sha256:'broken'},'0.2.18'),/Invalid/);
  assert.equal(parseUpdate({...update,versionCode:undefined},'0.2.18').version,'0.2.19');
});
test('Rodri retains published movement and volume when a trading row omits display fields', () => {
  const known=[{symbol:'ROD',entityId:'player:rodri',name:'Rodri',category:'Athletes'}];
  const result=normalizeMarketCatalog([{symbol:'ROD',entityId:'player:rodri',statistics:{volumeMinor24h:'2336243'},indexChangePct:null}],[{symbol:'ROD',entityId:'player:rodri',indexChangePct:0,statistics:{changePct24h:0.07}}],known);
  assert.equal(result[0].indexChangePct,0);
  assert.equal(result[0].statistics.volumeMinor24h,'2336243');
  assert.equal(result[0].statistics.changePct24h,0.07);
});
