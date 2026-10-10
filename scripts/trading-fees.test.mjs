import test from 'node:test';
import assert from 'node:assert/strict';
import {estimateTradingFees} from '../src/lib/trading-fees.ts';
test('mobile estimate matches settlement rounding and split-fill reserves',()=>{
  const input={policy:{policyVersion:'2',makerRatePpm:'200',takerRatePpm:'600',rounding:'ceil_per_fill'},quantityLots:10,priceTicks:'100000000',upperTicks:'112000000',quoteMinorPerIndexUnitPerLot:'100',priceDecimals:'6'};
  assert.deepEqual(estimateTradingFees(input),{fee:.60,reservedFee:.70});
  assert.equal(estimateTradingFees({...input,quantityLots:1,priceTicks:'1'}).fee,.01);
  assert.ok(Number.isNaN(estimateTradingFees({...input,policy:undefined}).fee));
  assert.ok(Number.isNaN(estimateTradingFees({...input,quantityLots:Infinity}).fee));
  assert.equal(estimateTradingFees({...input,policy:{...input.policy,makerRatePpm:'0',takerRatePpm:'0'}}).fee,0);
});
