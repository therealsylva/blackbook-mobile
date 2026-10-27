export type MarketExecution = 'IOC' | 'FOK' | 'GTC';
export const marketExecutionOptions: readonly MarketExecution[] = ['IOC', 'FOK', 'GTC'];
export const executionLabel = (mode: MarketExecution) => ({
  IOC: 'Fill available, cancel rest',
  FOK: 'Fill all or cancel',
  GTC: 'Keep remainder open',
})[mode];

/** Translate the chosen execution into an engine order; a resting remainder needs a price. */
export function orderExecutionPlan(type: 'market'|'limit'|'stop', mode: MarketExecution, targetPrice?: number, limitDuration: MarketExecution = 'GTC') {
  if (!marketExecutionOptions.includes(mode) || !marketExecutionOptions.includes(limitDuration)) throw new Error('Choose a valid execution preference.');
  if (type === 'stop') return {type:'stop' as const,timeInForce:'GTC' as const,targetPrice};
  if (type === 'limit') return {type:'limit' as const,timeInForce:limitDuration,targetPrice};
  if (targetPrice !== undefined && (!Number.isFinite(targetPrice) || targetPrice <= 0)) throw new Error('Enter a valid price limit.');
  if (mode === 'GTC' && targetPrice === undefined) throw new Error('Enter a maximum buy price or minimum sell price to keep the remainder open.');
  return targetPrice === undefined
    ? {type:'market' as const,timeInForce:mode,targetPrice:undefined}
    : {type:'limit' as const,timeInForce:mode,targetPrice};
}
