import {test} from 'node:test';
import assert from 'node:assert/strict';
import {unavailablePositions} from '../src/lib/unavailable-positions.ts';

test('positions without market details remain visible until the catalog supplies them', () => {
 const rows = [{marketId:'barca',positionLots:'12'},{marketId:'bayern',positionLots:'-3'}];
 assert.deepEqual(unavailablePositions(rows,[{marketId:'barca'}]),[{positionId:'bayern',marketId:'bayern',positionLots:'-3'}]);
 assert.deepEqual(unavailablePositions(rows,[{marketId:'barca'},{marketId:'bayern'}]),[]);
});

