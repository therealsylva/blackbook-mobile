import test from 'node:test';
import assert from 'node:assert/strict';
import {formatLeverage,formatPrice,formatMoney} from '../src/lib/format.ts';
test('portfolio display bounds leverage, price and dollar precision without changing the input',()=>{
 const leverage=4.999999999999991;
 assert.equal(formatLeverage(leverage),'5x');assert.equal(formatLeverage(12.3456789),'12.35x');
 assert.equal(formatLeverage(NaN),'—');assert.equal(formatPrice(6122.936879),'6,122.9369');assert.equal(formatMoney(1234.567891),'$1,234.57');assert.equal(leverage,4.999999999999991);
});
