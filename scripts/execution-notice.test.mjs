
import test from 'node:test';
import assert from 'node:assert/strict';
import {executionNotice} from '../src/lib/execution-notice.ts';
import {sizeDollarOrder} from '../src/lib/dollar-order.ts';
const terms={priceDecimals:'6',quoteMinorPerIndexUnitPerLot:'0.0001'};
test('the reported 10k margin ticket requests 50k exposure but 10k liquidity fills with 2k margin',()=>{
  const requested=sizeDollarOrder({amount:10000,leverage:5,priceTicks:'2782102844',...terms});
  assert.equal(requested,17972017);
  const notice=executionNotice({quantityLots:String(requested),leverage:5},{status:'PARTIALLY_FILLED',filledQuantityLots:'3594404',remainingQuantityLots:'0',averageFillPriceTicks:'2782102844'},terms);
  assert.equal(notice.title,'Order partially filled');
  assert.match(notice.message,/\$10,000\.00 exposure filled/);
  assert.match(notice.message,/\$2,000\.00 margin/);
  assert.match(notice.message,/20\.00%/);
  assert.match(notice.message,/unfilled remainder was cancelled/);
});
test('partial limit fills describe the still-open remainder',()=>{
  const n=executionNotice({quantityLots:'10',leverage:5},{filledQuantityLots:'4',remainingQuantityLots:'6'});
  assert.equal(n.title,'Order partially filled');
  assert.match(n.message,/40\.00%.*remainder is still open/);
});
test('partial close and zero/full executions are not represented as full entry fills',()=>{
  assert.equal(executionNotice({quantityLots:'10',reduceOnly:true},{filledQuantityLots:'4'}).title,'Position partly closed');
  assert.equal(executionNotice({quantityLots:'10'},{filledQuantityLots:'10'}).title,'Order filled');
  assert.equal(executionNotice({quantityLots:'10'},{filledQuantityLots:'0',status:'CANCELLED'}).title,'Order cancelled');
});
