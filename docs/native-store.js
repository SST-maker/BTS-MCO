const DB_NAME='mco-native-v10';
const DB_VERSION=1;
const CACHE_STORE='rpc-cache';
const QUEUE_STORE='rpc-queue';
let dbPromise=null;

function openDb(){
  if(!('indexedDB' in window)) return Promise.resolve(null);
  if(dbPromise) return dbPromise;
  dbPromise=new Promise((resolve,reject)=>{
    const req=indexedDB.open(DB_NAME,DB_VERSION);
    req.onupgradeneeded=()=>{
      const db=req.result;
      if(!db.objectStoreNames.contains(CACHE_STORE)) db.createObjectStore(CACHE_STORE,{keyPath:'key'});
      if(!db.objectStoreNames.contains(QUEUE_STORE)) db.createObjectStore(QUEUE_STORE,{keyPath:'id',autoIncrement:true});
    };
    req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>reject(req.error);
  }).catch(()=>null);
  return dbPromise;
}

async function tx(store,mode,fn){
  const db=await openDb(); if(!db) return null;
  return new Promise((resolve,reject)=>{
    const t=db.transaction(store,mode); const s=t.objectStore(store); let value;
    try{value=fn(s)}catch(e){reject(e);return}
    t.oncomplete=()=>resolve(value?.result ?? value ?? null);
    t.onerror=()=>reject(t.error);
    t.onabort=()=>reject(t.error);
  }).catch(()=>null);
}

export async function cacheSet(key,value,ttlMs=7*24*60*60*1000){
  return tx(CACHE_STORE,'readwrite',s=>s.put({key,value,at:Date.now(),expiresAt:Date.now()+ttlMs}));
}
export async function cacheGet(key){
  const db=await openDb(); if(!db) return null;
  return new Promise(resolve=>{
    const t=db.transaction(CACHE_STORE,'readonly'); const r=t.objectStore(CACHE_STORE).get(key);
    r.onsuccess=()=>{const x=r.result;if(!x||x.expiresAt<Date.now())resolve(null);else resolve(x.value)};
    r.onerror=()=>resolve(null);
  });
}
export async function queueRpc(name,params){return tx(QUEUE_STORE,'readwrite',s=>s.add({name,params,createdAt:Date.now(),tries:0}));}
export async function listRpcQueue(){
  const db=await openDb(); if(!db) return [];
  return new Promise(resolve=>{const t=db.transaction(QUEUE_STORE,'readonly');const r=t.objectStore(QUEUE_STORE).getAll();r.onsuccess=()=>resolve(r.result||[]);r.onerror=()=>resolve([])});
}
export async function deleteQueuedRpc(id){return tx(QUEUE_STORE,'readwrite',s=>s.delete(id));}
export async function queueCount(){const a=await listRpcQueue();return a.length;}
export async function clearNativeCache(){
  const db=await openDb(); if(!db) return;
  await Promise.all([tx(CACHE_STORE,'readwrite',s=>s.clear()),tx(QUEUE_STORE,'readwrite',s=>s.clear())]);
}
export async function nativeDbReady(){return !!(await openDb());}
