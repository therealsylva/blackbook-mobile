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
