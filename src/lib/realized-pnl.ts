type Fill = Record<string, unknown>;
/** Settlement P&L is before fees. Entry and exit fees both count in realized results. */
export function netPnlMinor(fill: Fill): bigint {
  return BigInt(String(fill.realizedPnlMinor ?? '0')) - BigInt(String(fill.feeMinor ?? '0'));
}
export function realizedPnlMinor(fills: Fill[]): bigint {
  return fills.reduce((total, fill) => total + netPnlMinor(fill), 0n);
}
