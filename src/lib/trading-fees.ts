export interface FeePolicy {policyVersion:string;makerRatePpm:string;takerRatePpm:string;rounding:string}
export function estimateTradingFees({policy,quantityLots,priceTicks,upperTicks,quoteMinorPerIndexUnitPerLot,priceDecimals}:{policy:FeePolicy|undefined;quantityLots:number;priceTicks:string;upperTicks:string;quoteMinorPerIndexUnitPerLot:string;priceDecimals:string}) {
    if(!policy||!['ceil_per_fill','ceil_per_order'].includes(policy.rounding)||!Number.isSafeInteger(quantityLots)||quantityLots<1
      ||![policy.makerRatePpm,policy.takerRatePpm,priceTicks,upperTicks,priceDecimals].every(v=>/^\d+$/.test(v))) return {fee:NaN,reservedFee:NaN};
    if(!/^(?:0|[1-9][0-9]*)(?:\.[0-9]{1,6})?$/.test(quoteMinorPerIndexUnitPerLot))return {fee:NaN,reservedFee:NaN};
    const [whole,fraction='']=quoteMinorPerIndexUnitPerLot.split('.');
    const rate=BigInt(policy.takerRatePpm),maxRate=BigInt(policy.makerRatePpm)>rate?BigInt(policy.makerRatePpm):rate;
    if(maxRate>1000000n||Number(priceDecimals)>18)return {fee:NaN,reservedFee:NaN};
    const divisor=10n**BigInt(priceDecimals)*1000000n*10n**BigInt(fraction.length),quote=BigInt(whole+fraction),lots=BigInt(quantityLots);
    const ceil=(value:bigint)=>(value+divisor-1n)/divisor;
    return {fee:Number(ceil(lots*BigInt(priceTicks)*quote*rate))/100,
      reservedFee:Number(policy.rounding==='ceil_per_order'?ceil(lots*BigInt(upperTicks)*quote*maxRate):lots*ceil(BigInt(upperTicks)*quote*maxRate))/100};
  }
