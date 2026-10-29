type Row = Record<string, unknown>;
export type PendingCommand = {fingerprint: string; path: string; body: Row};
export type CommandOutcome = {state: 'complete'; receipt: Row} | {state: 'pending'};

/** A transport failure says nothing about whether a financial command executed. */
export function isDefinitiveCommandError(error: unknown): boolean {
  return error instanceof Error && 'status' in error && [400, 403, 404, 409, 422].includes(Number(error.status));
}

export async function resolveTradingCommand(request: PendingCommand, send: (path: string, body: Row) => Promise<Row>): Promise<CommandOutcome> {
  try {
    const response = await send(request.path, request.body);
    const rawReceipt = (response.order ?? response) as Row;
    // The live engine calls a confirmed partial fill PARTIAL. Normalize it
    // before deciding whether this durable command still needs recovery.
    const receipt = rawReceipt?.status === 'PARTIAL'
      ? {...rawReceipt, status: 'PARTIALLY_FILLED'} : rawReceipt;
    if (!receipt || !['FILLED', 'PARTIALLY_FILLED', 'RESTING', 'CANCELLED', 'REJECTED'].includes(String(receipt.status))) return {state: 'pending'};
    return {state: 'complete', receipt};
  } catch (error) {
    if (isDefinitiveCommandError(error)) throw error;
    return {state: 'pending'};
  }
}

export function closePositionCommand(position: Row, book: Row, commandId: string, orderId: string): Row {
  if (typeof position.positionId !== 'string' || !/^[0-9a-f-]{36}$/i.test(position.positionId)) throw new Error('Refresh this position before closing.');
  const lots = BigInt(String(position.positionLots));
  if (lots === 0n) throw new Error('This position is already closed.');
  if (position.lastTradeSequence === undefined) throw new Error('Wait for the latest position before closing.');
  return {commandId, orderId, marketId: position.marketId, positionId: position.positionId, side: lots > 0n ? 'ASK' : 'BID', type: 'MARKET', timeInForce: 'IOC', quantityLots: (lots < 0n ? -lots : lots).toString(), expectedMarketVersion: book.marketVersion, expectedMarketHash: book.marketHash, reduceOnly: true, expectedPositionSequence: String(position.lastTradeSequence)};
}

