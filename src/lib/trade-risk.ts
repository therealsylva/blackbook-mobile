// Cross-margin estimate with other positions held at their current marks.
export function estimateLiquidation({equity,maintenance,existingUnits=0,existingMark=0,entry,addedUnits,maintenanceRate}:{equity:number;maintenance:number;existingUnits?:number;existingMark?:number;entry:number;addedUnits:number;maintenanceRate:number}) {
 if(![equity,maintenance,existingUnits,existingMark,entry,addedUnits,maintenanceRate].every(Number.isFinite)||equity<=0||entry<=0||maintenanceRate<=0||maintenanceRate>=1)return NaN;
 const net=existingUnits+addedUnits;if(!net)return NaN;
 const equityAtEntry=equity+existingUnits*(entry-existingMark),otherMaintenance=Math.max(0,maintenance-Math.abs(existingUnits)*existingMark*maintenanceRate);
 const price=(net*entry+otherMaintenance-equityAtEntry)/(net-Math.abs(net)*maintenanceRate);
 return price>0&&(net>0?price<entry:price>entry)?price:NaN;
}
