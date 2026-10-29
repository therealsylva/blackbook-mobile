type Row = Record<string, unknown>;

/** An entry order can execute at several book levels without becoming several trades in the journal. */
export function groupOrderFills(fills: Row[]): Row[] {
  const groups = new Map<string, {row: Row; quantity: bigint; numerator: bigint; fee: bigint; pnl: bigint; count: number}>();
  for (const row of fills) {
    if (!row.priceTicks || !row.quantityLots) continue;
    const key = String(row.orderId ?? row.fillId ?? row.tradeId ?? row.id);
    const quantity = BigInt(String(row.quantityLots)), numerator = quantity * BigInt(String(row.priceTicks));
    const group = groups.get(key);
    if (group) {
      group.quantity += quantity; group.numerator += numerator;
      group.fee += BigInt(String(row.feeMinor ?? '0')); group.pnl += BigInt(String(row.realizedPnlMinor ?? '0')); group.count++;
    } else groups.set(key, {row, quantity, numerator, fee: BigInt(String(row.feeMinor ?? '0')), pnl: BigInt(String(row.realizedPnlMinor ?? '0')), count: 1});
  }
  return [...groups.values()].map(({row, quantity, numerator, fee, pnl, count}) => ({...row, quantityLots: quantity.toString(), priceTicks: (numerator / quantity).toString(), feeMinor: fee.toString(), realizedPnlMinor: pnl.toString(), fillCount: count}));
}
