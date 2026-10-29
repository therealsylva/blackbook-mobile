import {test} from 'node:test';
import assert from 'node:assert/strict';
import {unavailablePositions} from '../src/lib/unavailable-positions.ts';

test('positions without market details remain visible until the catalog supplies them', () => {
 const rows = [{positionId:'barca-entry',marketId:'barca',positionLots:'12'},{positionId:'bayern-entry',marketId:'bayern',positionLots:'-3'}];
 assert.deepEqual(unavailablePositions(rows,[{marketId:'barca'}]),[{positionId:'bayern-entry',marketId:'bayern',positionLots:'-3'}]);
 assert.deepEqual(unavailablePositions(rows,[{marketId:'barca'},{marketId:'bayern'}]),[]);
});


test("unresolved entry history stays visible even when its market is known",()=>{assert.equal(unavailablePositions([{marketId:"LIV",positionLots:"10",positionId:null}],[{marketId:"LIV"}]).length,1);});
