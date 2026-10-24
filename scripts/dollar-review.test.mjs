import test from 'node:test';
import assert from 'node:assert/strict';
import {sizeDollarOrder} from '../src/lib/dollar-order.ts';
import {estimateTradingFees} from '../src/lib/trading-fees.ts';
import {estimateLiquidation} from '../src/lib/trade-risk.ts';
import {formatMoney,formatPrice} from '../src/lib/format.ts';
test('a $1 amount at 6000 points sizes exactly and fractional fees remain tradeable',()=>{
 const base={amount:1,leverage:5,priceTicks:'6000000000',priceDecimals:'6',quoteMinorPerIndexUnitPerLot:'0.0001'};
 const lots=sizeDollarOrder(base);assert.equal(lots,833);
 const result=estimateTradingFees({...base,upperTicks:'6720000000',quantityLots:lots,policy:{policyVersion:'2',makerRatePpm:'200',takerRatePpm:'600',rounding:'ceil_per_order'}});
 assert.equal(result.fee,.01);assert.equal(result.reservedFee,.01);
 assert.equal(sizeDollarOrder({...base,amount:.99}),0);assert.equal(sizeDollarOrder({...base,amount:1.001}),0);
 const free=estimateTradingFees({...base,upperTicks:'6720000000',quantityLots:lots,policy:{policyVersion:'1',makerRatePpm:'0',takerRatePpm:'0',rounding:'ceil_per_order'}});assert.equal(free.fee,0);
});
test('liquidation solves equity equal to maintenance in index-price units',()=>{
 for(const units of [2,-2]){const equity=100,entry=100,maintenanceRate=.1;const price=estimateLiquidation({equity,maintenance:0,entry,addedUnits:units,maintenanceRate});assert.ok(Math.abs(equity+units*(price-entry)-Math.abs(units)*price*maintenanceRate)<1e-9);}
 assert.equal(formatMoney(1000),'$1,000.00');assert.equal(formatPrice(6122.936879),'6,122.9369');
});

test('fully collateralized longs have no positive liquidation threshold; shorts still have an index-price threshold',()=>{
 assert.equal(estimateLiquidation({equity:10000,maintenance:0,entry:6000,addedUnits:5000/6000,maintenanceRate:.01}),Infinity);
 const short=estimateLiquidation({equity:1000,maintenance:0,entry:6000,addedUnits:-5000/6000,maintenanceRate:.01});assert.ok(short>6000);assert.ok(Math.abs(1000-5000/6000*(short-6000)-5000/6000*short*.01)<1e-8);
});
