import {strict as assert} from 'node:assert';
import {test} from 'node:test';
import {formatBand} from '../src/lib/format.ts';

test('band display uses the published index and preserves asymmetric limits', () => {
  assert.equal(formatBand(880, 1000, 'Index'), '880.0000');
  assert.equal(formatBand(880, 1000, 'Percentage'), '-12.00%');
  assert.equal(formatBand(1065, 1000, 'Percentage'), '+6.50%');
  assert.equal(formatBand(1000, 1000, 'Percentage'), '+0.00%');
  assert.equal(formatBand(880, 0, 'Percentage'), '—');
  assert.equal(formatBand(NaN, 1000, 'Percentage'), '—');
});
