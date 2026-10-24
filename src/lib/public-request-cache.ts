type Entry={expires:number;value:unknown};
export class PublicRequestCache {
 private values=new Map<string,Entry>();private pending=new Map<string,Promise<unknown>>();
 private readonly now:()=>number;private readonly maxEntries:number;
 constructor(now=()=>Date.now(),maxEntries=64){this.now=now;this.maxEntries=maxEntries;}
 async get<T>(key:string,ttl:number,load:()=>Promise<T>,fresh=false):Promise<T>{
  const hit=this.values.get(key);if(!fresh&&hit&&hit.expires>this.now())return hit.value as T;
  if(!fresh&&this.pending.has(key))return this.pending.get(key) as Promise<T>;
  const job=load();if(!fresh)this.pending.set(key,job);
  try{const value=await job;if(ttl>0){this.values.delete(key);this.values.set(key,{expires:this.now()+ttl,value});while(this.values.size>this.maxEntries)this.values.delete(this.values.keys().next().value!);}return value;}
  finally{if(this.pending.get(key)===job)this.pending.delete(key);}
 }
}
