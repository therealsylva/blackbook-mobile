type Row = Record<string, unknown>;
type Terms = {priceDecimals: string; quoteMinorPerIndexUnitPerLot: string};
const money = (value:number) => '$'+value.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});

/** Explain the completed command, including IOC quantity that never executed. */
export function executionNotice(body:Row, receipt:Row, terms?:Terms) {
  const filled=BigInt(String(receipt.filledQuantityLots??'0'));
  const requested=BigInt(String(body.quantityLots??'0'));
  const partial=filled>0n && requested>filled;
  const closing=body.reduceOnly===true;
  if(filled===0n) {
    const resting=receipt.status==='RESTING', rejected=receipt.status==='REJECTED';
    return {title:resting?'Order placed':rejected?'Order rejected':'Order cancelled',
      message:resting?'Your order is open.':'No quantity filled. Check Portfolio for the latest account state.',
      tone:rejected?'error' as const:'success' as const};
  }
  let detail='';
  const price=Number(receipt.averageFillPriceTicks);
  if(terms && price>0) {
    const exposure=Number(filled)*price/10**Number(terms.priceDecimals)*Number(terms.quoteMinorPerIndexUnitPerLot)/100;
    const leverage=Number(body.leverage);
    detail=money(exposure)+' exposure filled'+(!closing&&leverage>0?' · '+money(exposure/leverage)+' margin':'')+'. ';
  }
  const percent=requested>0n?Number(filled*10000n/requested)/100:100;
  const remainder=BigInt(String(receipt.remainingQuantityLots??'0'))>0n
    ? 'The remainder is still open.'
    : 'The unfilled remainder was cancelled; it will not fill automatically.';
  return {
    title:closing?(partial?'Position partly closed':'Position closed'):(partial?'Order partially filled':'Order filled'),
    message:detail+(partial?percent.toFixed(2)+'% of the requested quantity executed. '+remainder:'Your account has been updated.'),
    tone:'success' as const,
  };
}
