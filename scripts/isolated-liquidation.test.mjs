import test from 'node:test';
import assert from 'node:assert/strict';
import {estimateLiquidation} from '../src/lib/trade-risk.ts';
const entry=5974.3312,maintenanceRate=.008333;
test('$1 margin at 20x backs only $20 exposure, regardless of wallet balance',()=>{
 const short=estimateLiquidation({margin:1,entry,addedUnits:-20/entry,maintenanceRate});
 assert.ok(Math.abs(short-entry*1.05/(1+maintenanceRate))<1e-8);
 assert.ok(short>6200&&short<6250);
 for(const wallet of [80,60000])assert.equal(estimateLiquidation({margin:1,entry,addedUnits:-20/entry,maintenanceRate,wallet}),short);
 const long=estimateLiquidation({margin:1,entry,addedUnits:20/entry,maintenanceRate});
 assert.ok(Math.abs(long-entry*.95/(1-maintenanceRate))<1e-8);
});
test('same-direction entries combine allocated collateral; reductions release it; reversals allocate only the new side',()=>{
 const old={existingUnits:1,existingEntry:100,existingMargin:10};
 assert.equal(estimateLiquidation({...old,margin:10,entry:100,addedUnits:1,maintenanceRate:.01}),90/.99);
 assert.equal(estimateLiquidation({...old,margin:5,entry:110,addedUnits:-.5,maintenanceRate:.01}),90/.99);
 assert.ok(Number.isNaN(estimateLiquidation({...old,margin:10,entry:100,addedUnits:-1,maintenanceRate:.01})));
 assert.equal(estimateLiquidation({...old,margin:20,entry:100,addedUnits:-2,maintenanceRate:.01}),110/1.01);
});
