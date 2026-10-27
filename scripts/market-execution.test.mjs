import test from 'node:test';
import assert from 'node:assert/strict';
import {orderExecutionPlan,executionLabel} from '../src/lib/market-execution.ts';
import {orderEntryPrice} from '../src/lib/trade-risk.ts';
test('three market execution choices map to the supported matching engine types',()=>{
 assert.deepEqual(orderExecutionPlan('market','IOC'),{type:'market',timeInForce:'IOC',targetPrice:undefined});
 assert.deepEqual(orderExecutionPlan('market','FOK'),{type:'market',timeInForce:'FOK',targetPrice:undefined});
 assert.deepEqual(orderExecutionPlan('market','GTC',1234),{type:'limit',timeInForce:'GTC',targetPrice:1234});
});
test('resting remainder requires a valid trader price limit',()=>{
 for(const price of [undefined,0,-1,NaN,Infinity])assert.throws(()=>orderExecutionPlan('market','GTC',price),/price/);
});
test('optional price protection makes immediate orders priced limit IOC/FOK',()=>{
 for(const mode of ['IOC','FOK'])assert.deepEqual(orderExecutionPlan('market',mode,1250),{type:'limit',timeInForce:mode,targetPrice:1250});
 assert.throws(()=>orderExecutionPlan('market','BAD'),/valid execution/);
});
test('sizing, fee and liquidation estimates use the same chosen protected price',()=>{
 const plan=orderExecutionPlan('market','GTC',110);
 assert.equal(orderEntryPrice({side:'long',...plan,priceDecimals:'0',referenceTicks:'100',book:{asks:[{priceTicks:'101'}],bids:[{priceTicks:'99'}]}}),110);
 assert.equal(orderEntryPrice({side:'long',...orderExecutionPlan('market','FOK'),priceDecimals:'0',referenceTicks:'100',book:{asks:[{priceTicks:'101'}],bids:[{priceTicks:'99'}]}}),101);
});
test('limit and stop behaviour remains distinct from the market preference',()=>{
 assert.deepEqual(orderExecutionPlan('limit','FOK',100,'IOC'),{type:'limit',timeInForce:'IOC',targetPrice:100});
 assert.deepEqual(orderExecutionPlan('stop','FOK',105),{type:'stop',timeInForce:'GTC',targetPrice:105});
 assert.equal(executionLabel('GTC'),'Keep remainder open');
});
