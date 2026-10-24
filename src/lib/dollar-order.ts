export function sizeDollarOrder({amount,leverage,priceTicks,priceDecimals,quoteMinorPerIndexUnitPerLot}:{amount:number;leverage:number;priceTicks:string;priceDecimals:string;quoteMinorPerIndexUnitPerLot:string}) {
    const cents=Math.round(amount*100);
    if(!Number.isSafeInteger(cents)||cents<100||Math.abs(amount*100-cents)>0.000001||!Number.isInteger(leverage)||leverage<1
      || !/^[1-9][0-9]*$/.test(priceTicks) || !/^(?:0|[1-9][0-9]*)(?:\.[0-9]{1,6})?$/.test(quoteMinorPerIndexUnitPerLot) || !/^[0-9]+$/.test(priceDecimals) || Number(priceDecimals)>12)return 0;
    const [whole,fraction='']=quoteMinorPerIndexUnitPerLot.split('.'),quote=BigInt(whole+fraction);
    if(quote<=0n)return 0;
    const units=BigInt(cents)*BigInt(leverage)*10n**BigInt(priceDecimals)*10n**BigInt(fraction.length)/(BigInt(priceTicks)*quote);
    return units<=BigInt(Number.MAX_SAFE_INTEGER)?Number(units):0;
  }
