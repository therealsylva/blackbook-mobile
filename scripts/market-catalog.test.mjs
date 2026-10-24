import {test} from 'node:test';
import assert from 'node:assert/strict';
import {normalizeMarketCatalog} from '../src/lib/market-catalog.ts';
const known=[{entityId:'club:barcelona',symbol:'FCB',name:'FC Barcelona',category:'Clubs'}];
const index={entityId:'club:barcelona',symbol:'BAR',aliases:['FCB'],referenceMicros:1200000000,lowerMicros:1100000000,upperMicros:1300000000,indexChangePct:2.4};
test('public index data retains app identity and observed change without inventing a trading contract',()=>{
 const [row]=normalizeMarketCatalog([], [index],known);assert.equal(row.symbol,'FCB');assert.equal(row.referenceTicks,'1200000000');assert.equal(row.indexChangePct,2.4);assert.equal(row.tradable,false);assert.equal(row.marketId,'');
});
test('legacy runtime catalogue without symbol or economics remains browseable and cannot enable orders',()=>{
 const [row]=normalizeMarketCatalog([{entityId:'club:barcelona',marketId:'football:barcelona',referenceTicks:'1250000000',marketVersion:'2',marketHash:'hash'}],[index],known);
 assert.equal(row.symbol,'FCB');assert.equal(row.referenceTicks,'1250000000');assert.equal(row.tradable,false);assert.equal(row.indexChangePct,2.4);
});
test('published runtime economics and identity override public display projections',()=>{
 const market={...index,marketId:'football:barcelona',marketVersion:'2',marketHash:'hash',referenceTicks:'1250000000',terms:{priceDecimals:'6',minimumOrderLots:'1',quoteMinorPerIndexUnitPerLot:'100',feePolicyVersion:'2'},marginPolicy:{initialMarginPpm:'200000',maintenanceMarginPpm:'100000'},feePolicy:{policyVersion:'2',makerRatePpm:'200',takerRatePpm:'600'}};
 const [row]=normalizeMarketCatalog([market],[index],known);assert.equal(row.tradable,true);assert.equal(row.terms,market.terms);assert.equal(row.marketHash,'hash');
});


test('BAR/RMD joins legacy FCB/RMD display but retains the backend entity ID for history',()=>{
 const known=[{entityId:'fcb-rmd',symbol:'FCB/RMD',name:'FCB/RMD',category:'Pairs'}];
 const [pair]=normalizeMarketCatalog([{entityId:'pair:bar-rmd',symbol:'BAR/RMD',marketId:'pair:live'}],[],known);
 assert.equal(pair.symbol,'FCB/RMD');assert.equal(pair.entityId,'pair:bar-rmd');assert.equal(pair.marketId,'pair:live');
});
