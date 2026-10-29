import test from 'node:test';
import assert from 'node:assert/strict';
import {groupOrderFills} from '../src/lib/group-order-fills.ts';

test('ten fills form one journal entry with exact quantity, weighted price, fees and P&L',()=>{
 const rows=Array.from({length:10},(_,i)=>({orderId:'first',fillId:String(i),marketId:'LIV',side:'BID',quantityLots:'100',priceTicks:String(1000+i),feeMinor:'1',realizedPnlMinor:'2'}));
 const result=groupOrderFills(rows);assert.equal(result.length,1);
 assert.equal(result[0].quantityLots,'1000');assert.equal(result[0].priceTicks,'1004');assert.equal(result[0].feeMinor,'10');assert.equal(result[0].realizedPnlMinor,'20');assert.equal(result[0].fillCount,10);
 assert.equal(rows[0].quantityLots,'100');
});
test('different same-market entry orders never merge',()=>{
 const fill={marketId:'LIV',side:'BID',quantityLots:'10',priceTicks:'1000'};
 assert.equal(groupOrderFills([{...fill,orderId:'a'},{...fill,orderId:'b'},{...fill,side:'ASK',orderId:'c'}]).length,3);
});
