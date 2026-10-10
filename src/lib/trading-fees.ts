export interface FeePolicy {policyVersion:string;makerRatePpm:string;takerRatePpm:string;rounding:string}
export function estimateTradingFees(input:{policy:FeePolicy|undefined;quantityLots:number;priceTicks:string;upperTicks:string;quoteMinorPerIndexUnitPerLot:string;priceDecimals:string}) {
  const {policy,quantityLots}=input;
  if(!policy||policy.rounding!=='ceil_per_fill'||!Number.isSafeInteger(quantityLots)||quantityLots<1
    ||![policy.makerRatePpm,policy.takerRatePpm,input.priceTicks,input.upperTicks,input.quoteMinorPerIndexUnitPerLot,input.priceDecimals].every(v=>/^\d+$/.test(v))) return {fee:NaN,reservedFee:NaN};
  const rate=BigInt(policy.takerRatePpm),maxRate=BigInt(policy.makerRatePpm)>rate?BigInt(policy.makerRatePpm):rate;
  if(maxRate>1000000n||Number(input.priceDecimals)>18)return {fee:NaN,reservedFee:NaN};
  const divisor=10n**BigInt(input.priceDecimals)*1000000n,quote=BigInt(input.quoteMinorPerIndexUnitPerLot),lots=BigInt(quantityLots);
  const ceil=(value:bigint)=>(value+divisor-1n)/divisor;
  return {fee:Number(ceil(lots*BigInt(input.priceTicks)*quote*rate))/100,
    reservedFee:Number(lots*ceil(BigInt(input.upperTicks)*quote*maxRate))/100};
}
