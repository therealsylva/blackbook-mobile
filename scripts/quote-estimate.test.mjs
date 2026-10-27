import test from 'node:test';import assert from 'node:assert/strict';
import {orderEntryPrice,estimateLiquidation} from '../src/lib/trade-risk.ts';
import {sizeDollarOrder} from '../src/lib/dollar-order.ts';
import {estimateTradingFees} from '../src/lib/trading-fees.ts';
test('empty-side books use the same indicative quote for dollar sizing, fees and liquidation',()=>{
 const input={side:'long',type:'market',priceDecimals:'6',referenceTicks:'6000000000',book:{asks:[],bids:[],lastTradePriceTicks:'6100000000'}};
 const entry=orderEntryPrice(input);assert.equal(entry,6100);
 const lots=sizeDollarOrder({amount:1000,leverage:5,priceTicks:String(entry*1e6),priceDecimals:'6',quoteMinorPerIndexUnitPerLot:'0.0001'});
 const fee=estimateTradingFees({policy:{policyVersion:'2',makerRatePpm:'200',takerRatePpm:'600',rounding:'ceil_per_order'},quantityLots:lots,priceTicks:String(entry*1e6),upperTicks:'6500000000',quoteMinorPerIndexUnitPerLot:'0.0001',priceDecimals:'6'}).fee;
 assert.equal(fee,3);assert.ok(Number.isFinite(estimateLiquidation({margin:1000,entry,addedUnits:lots*.000001,maintenanceRate:.01})));
 assert.equal(orderEntryPrice({...input,book:{asks:[{priceTicks:'6200000000'}],bids:[]}}),6200);
 assert.equal(orderEntryPrice({...input,type:'limit',targetPrice:5900}),5900);
});
