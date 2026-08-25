export function localLiveChannel(code,onRefresh){
  const safe=String(code||'').trim().toUpperCase();
  if(!safe||!('BroadcastChannel' in window)) return {broadcast:()=>{},close:()=>{}};
  const bc=new BroadcastChannel(`mco-live-v10:${safe}`);
  bc.onmessage=e=>{if(e.data?.type==='refresh')onRefresh?.(e.data)};
  return {
    broadcast(reason='refresh'){try{bc.postMessage({type:'refresh',reason,at:Date.now()})}catch{}},
    close(){try{bc.close()}catch{}}
  };
}
