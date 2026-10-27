import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveTradingCommand, closePositionCommand} from '../src/lib/trading-command.ts';
const request = {path:'/v1/orders',fingerprint:'real-close-rmd',body:{commandId:'same-command',orderId:'same-order',reduceOnly:true,quantityLots:'10'}};
const filled = {status:'FILLED',filledQuantityLots:'10',orderId:'same-order'};

test('503 processing becomes pending, then replays the identical financial command', async()=>{
  const seen=[];
  const send=async(path,body)=>{seen.push({path,body});if(seen.length===1)throw Object.assign(new Error('order_pending_retry_same_command'),{status:503});return {order:filled};};
  assert.deepEqual(await resolveTradingCommand(request,send),{state:'pending'});
  assert.deepEqual(await resolveTradingCommand(request,send),{state:'complete',receipt:filled});
  assert.equal(seen[0].body,seen[1].body);
  assert.equal(seen[1].body.commandId,'same-command');
});
test('lost response preserves unknown outcome without claiming rejection',async()=>{
  assert.deepEqual(await resolveTradingCommand(request,async()=>{throw new Error('connection timed out');}),{state:'pending'});
});
test('session expiry keeps the command for recovery after authentication',async()=>{
  assert.deepEqual(await resolveTradingCommand(request,async()=>{throw Object.assign(new Error('invalid_session'),{status:401});}),{state:'pending'});
});
test('definitive rejection can release the pending action',async()=>{
  for(const status of [400,403,404,409,422])await assert.rejects(resolveTradingCommand(request,async()=>{throw Object.assign(new Error('position_changed'),{status});}),{message:'position_changed'});
});
test('flat and wrapped receipts both resolve, unknown status does not unlock another order',async()=>{
  assert.deepEqual(await resolveTradingCommand(request,async()=>filled),{state:'complete',receipt:filled});
  assert.deepEqual(await resolveTradingCommand(request,async()=>({order:{status:'PENDING'}})),{state:'pending'});
});
test('a cancelled IOC with a partial fill remains a completed financial command',async()=>{
  const receipt={status:'CANCELLED',filledQuantityLots:'4',remainingQuantityLots:'0'};
  assert.deepEqual(await resolveTradingCommand(request,async()=>({order:receipt})),{state:'complete',receipt});
});
test('live PARTIAL receipts release recovery for both new orders and position closes',async()=>{
  for(const reduceOnly of [false,true]){
    const saved={...request,body:{...request.body,reduceOnly}};
    const receipt={...filled,status:'PARTIAL',filledQuantityLots:'4',remainingQuantityLots:'6'};
    for(const response of [receipt,{order:receipt}]){
      assert.deepEqual(await resolveTradingCommand(saved,async()=>response),{
        state:'complete',receipt:{...receipt,status:'PARTIALLY_FILLED'},
      });
      assert.equal(receipt.status,'PARTIAL');
    }
  }
});
test('a persisted partial-fill command recovers after a lost response using the same IDs',async()=>{
  const saved=JSON.parse(JSON.stringify(request));
  assert.deepEqual(await resolveTradingCommand(saved,async()=>{throw new Error('timeout');}),{state:'pending'});
  let submitted;
  const outcome=await resolveTradingCommand(JSON.parse(JSON.stringify(saved)),async(path,body)=>{
    submitted={path,body};return {order:{...filled,status:'PARTIAL',filledQuantityLots:'4'}};
  });
  assert.deepEqual(submitted,{path:request.path,body:request.body});
  assert.equal(outcome.state,'complete');
  assert.equal(outcome.receipt.filledQuantityLots,'4');
});
test('close commands use the latest signed position size and sequence, with reduce-only IOC',()=>{
  for(const [lots,side] of [['12','ASK'],['-8','BID']]){
    const body=closePositionCommand({marketId:'rmd',positionLots:lots,lastTradeSequence:'109'},{marketVersion:'7',marketHash:'hash'},'command','order');
    assert.equal(body.side,side);assert.equal(body.quantityLots,lots.replace('-',''));
    assert.equal(body.expectedPositionSequence,'109');assert.equal(body.expectedMarketVersion,'7');
    assert.equal(body.timeInForce,'IOC');assert.equal(body.reduceOnly,true);
  }
});
test('zero positions and missing sequence are not sent as close orders',()=>{
  assert.throws(()=>closePositionCommand({positionLots:'0'},{},'c','o'),/already closed/);
  assert.throws(()=>closePositionCommand({positionLots:'1'},{},'c','o'),/latest position/);
});
