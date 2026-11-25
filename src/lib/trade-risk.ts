/** Isolated position estimate: only entry collateral backs this market position. */
export function estimateLiquidation({margin,entry,addedUnits,maintenanceRate,existingUnits=0,existingEntry=0,existingMargin=0}:{margin:number;entry:number;addedUnits:number;maintenanceRate:number;existingUnits?:number;existingEntry?:number;existingMargin?:number}) {
 if(![margin,entry,addedUnits,maintenanceRate,existingUnits,existingEntry,existingMargin].every(Number.isFinite)||margin<=0||entry<=0||!addedUnits||maintenanceRate<=0||maintenanceRate>=1||existingMargin<0)return NaN;
 const net=existingUnits+addedUnits;if(!net)return NaN;
 let collateral=margin,averageEntry=entry;
 if(existingUnits){
  if(existingEntry<=0||existingMargin<=0)return NaN;
  if(Math.sign(existingUnits)===Math.sign(addedUnits)){
   collateral+=existingMargin;averageEntry=(Math.abs(existingUnits)*existingEntry+Math.abs(addedUnits)*entry)/Math.abs(net);
  }else if(Math.sign(net)===Math.sign(existingUnits)){
   // A reduction releases existing margin; the entered order amount is not added.
   collateral=existingMargin*Math.abs(net/existingUnits);averageEntry=existingEntry;
  }else collateral=margin*Math.abs(net/addedUnits);
 }
 const price=(net*averageEntry-collateral)/(net-Math.abs(net)*maintenanceRate);
 if(net>0&&price<=0)return Infinity;
 return price>0?price:NaN;
}

/** Use one entry quote for sizing, fees, submission and liquidation. */
export function orderEntryPrice({side,type,targetPrice,priceDecimals,referenceTicks,book}:{side:'long'|'short';type:string;targetPrice?:number;priceDecimals:string;referenceTicks:string;book:{bids:{priceTicks:string}[];asks:{priceTicks:string}[];lastTradePriceTicks?:string}}){
 const scale=10**Number(priceDecimals);
 if(type!=='market')return targetPrice??NaN;
 const ticks=(side==='long'?book.asks:book.bids)[0]?.priceTicks??book.lastTradePriceTicks??referenceTicks;
 const price=Number(ticks)/scale;
 return Number.isFinite(price)&&price>0?price:NaN;
}

export function estimateBameEntry({side, leverage, assessmentTicks, upperTicks, lowerTicks, capTicks, quote, priceDecimals, lots, reservedFee, feeRatePpm}: {
  side: 'long' | 'short'; leverage: number; assessmentTicks: string; upperTicks: string; lowerTicks: string;
  capTicks: string; quote: string; priceDecimals: string; lots: number; reservedFee: number; feeRatePpm: number;
}) {
  const inputs = [assessmentTicks, upperTicks, lowerTicks, capTicks, quote, priceDecimals];
  if (!inputs.every(value => typeof value === 'string')
    || ![assessmentTicks, upperTicks, lowerTicks, capTicks].every(value => /^[1-9][0-9]*$/.test(value))
    || !/^[0-9]+(?:\.[0-9]{1,6})?$/.test(quote) || !/^[0-9]+$/.test(priceDecimals)
    || Number(priceDecimals) > 12 || !Number.isSafeInteger(lots) || lots < 1
    || !Number.isInteger(leverage) || leverage < 1 || leverage > 2000 || !Number.isFinite(reservedFee)
    || !Number.isSafeInteger(feeRatePpm) || feeRatePpm < 0 || feeRatePpm > 1000000) return null;
  const [whole, decimals = ''] = quote.split('.');
  const units = BigInt(whole + decimals);
  const scale = 10n ** BigInt(priceDecimals);
  const quoteScale = scale * 10n ** BigInt(decimals.length);
  const quantity = BigInt(lots);
  const upper = BigInt(upperTicks);
  const lower = BigInt(lowerTicks);
  if (upper < lower || units <= 0n) return null;
  const unbounded = BigInt(assessmentTicks);
  const price = unbounded < lower ? lower : unbounded > upper ? upper : unbounded;
  const reservePrice = BigInt(capTicks) > upper ? upper : BigInt(capTicks);
  const ceil = (value: bigint, divisor: bigint) => (value + divisor - 1n) / divisor;
  const initial = ceil(price * quantity * units, quoteScale * BigInt(leverage));
  const loss = ceil((side === 'long' ? price - lower : upper - price) * quantity * units, quoteScale);
  const covered = initial >= loss;
  const reserve = ceil(reservePrice * quantity * units, quoteScale * BigInt(leverage));
  const fractionalExitFee = units < 10n ** BigInt(decimals.length)
      && (upper * units * BigInt(feeRatePpm)) % (quoteScale * 1000000n) !== 0n;
    const roundingHold = lots > 1 ? (fractionalExitFee ? 3 : 1) : 0;
  const equityRate = leverage <= 60 ? 100000
    : leverage <= 100 ? 100000 + (leverage - 60) * 1250
    : leverage <= 500 ? 150000 + (leverage - 100) * 500
    : 350000 + (leverage - 500) * 100;
  const lossBudget = initial - initial * BigInt(equityRate) / 1000000n;
  const lossInIndexPoints = Number(lossBudget) * Number(quoteScale) / (Number(quantity * units) * Number(scale));
  const trigger = Number(price) / Number(scale) + (side === 'long' ? -lossInIndexPoints : lossInIndexPoints);
  return {covered, liquidation:covered ? NaN : trigger > 0 ? trigger : Infinity,
    requiredBalance:(Number(reserve) + 2 * Math.round(reservedFee * 100) + roundingHold) / 100};
}
