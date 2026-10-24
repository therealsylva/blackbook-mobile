// Cross-margin estimate with other positions held at their current marks.
export function estimateLiquidation({equity,maintenance,existingUnits=0,existingMark=0,entry,addedUnits,maintenanceRate}:{equity:number;maintenance:number;existingUnits?:number;existingMark?:number;entry:number;addedUnits:number;maintenanceRate:number}) {
 if(![equity,maintenance,existingUnits,existingMark,entry,addedUnits,maintenanceRate].every(Number.isFinite)||equity<=0||entry<=0||maintenanceRate<=0||maintenanceRate>=1)return NaN;
 const net=existingUnits+addedUnits;if(!net)return NaN;
 const equityAtEntry=equity+existingUnits*(entry-existingMark),otherMaintenance=Math.max(0,maintenance-Math.abs(existingUnits)*existingMark*maintenanceRate);
 const price=(net*entry+otherMaintenance-equityAtEntry)/(net-Math.abs(net)*maintenanceRate);
 // A fully collateralized long may have no liquidation point above zero.
 if(net>0&&price<=0)return Infinity;
 return price>0&&(net>0?price<entry:price>entry)?price:NaN;
}


/** Use one entry quote for sizing, fees, submission and liquidation. */
export function orderEntryPrice({side,type,targetPrice,priceDecimals,referenceTicks,book}:{side:'long'|'short';type:string;targetPrice?:number;priceDecimals:string;referenceTicks:string;book:{bids:{priceTicks:string}[];asks:{priceTicks:string}[];lastTradePriceTicks?:string}}){
 const scale=10**Number(priceDecimals);
 if(type!=='market')return targetPrice??NaN;
 const ticks=(side==='long'?book.asks:book.bids)[0]?.priceTicks??book.lastTradePriceTicks??referenceTicks;
 const price=Number(ticks)/scale;
 return Number.isFinite(price)&&price>0?price:NaN;
}
