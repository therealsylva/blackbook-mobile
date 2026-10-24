import {test} from 'node:test';import assert from 'node:assert/strict';
import {PublicRequestCache} from '../src/lib/public-request-cache.ts';import {formatMoney,configureDisplay} from '../src/lib/format.ts';
test('USD always uses a plain dollar sign across supported locales',()=>{for(const locale of ['en-GB','en-US','en-NG','de-DE']){configureDisplay(locale,'UTC');assert.match(formatMoney(12.5),/^\$/);assert.doesNotMatch(formatMoney(12.5),/US|USD/);assert.match(formatMoney(-12.5),/^-\$/);}});
test('public cache coalesces concurrent reads, expires, bypasses on demand and does not cache errors',async()=>{
 let now=0,calls=0;const cache=new PublicRequestCache(()=>now,2),load=async()=>++calls;
 assert.deepEqual(await Promise.all([cache.get('a',100,load),cache.get('a',100,load)]),[1,1]);assert.equal(calls,1);
 assert.equal(await cache.get('a',100,load),1);now=101;assert.equal(await cache.get('a',100,load),2);
 assert.equal(await cache.get('a',100,load,true),3);let failed=0;const bad=()=>{failed++;return Promise.reject(Error('offline'));};await assert.rejects(cache.get('bad',100,bad));await assert.rejects(cache.get('bad',100,bad));assert.equal(failed,2);
 await cache.get('b',100,load);await cache.get('c',100,load);await cache.get('a',100,load);assert.equal(calls,6);
});
