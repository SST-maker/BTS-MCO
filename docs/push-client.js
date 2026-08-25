import { rpc, loadStudentAuth, supabase } from './supabase-client.js';

function base64ToUint8Array(base64String){
  const padding='='.repeat((4-base64String.length%4)%4);
  const base64=(base64String+padding).replace(/-/g,'+').replace(/_/g,'/');
  const rawData=atob(base64); return Uint8Array.from([...rawData].map(c=>c.charCodeAt(0)));
}
export function pushSupported(){return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;}
export async function pushStatus(){
  if(!pushSupported())return {supported:false,permission:'unsupported',subscribed:false,configured:false};
  const reg=await navigator.serviceWorker.ready; const sub=await reg.pushManager.getSubscription();
  return {supported:true,permission:Notification.permission,subscribed:!!sub,configured:!!window.MCO_CONFIG?.WEB_PUSH_VAPID_PUBLIC_KEY};
}
export async function subscribePush(){
  if(!pushSupported())throw new Error('Les notifications push ne sont pas prises en charge sur ce navigateur.');
  const key=window.MCO_CONFIG?.WEB_PUSH_VAPID_PUBLIC_KEY;
  if(!key)throw new Error('Ajoute WEB_PUSH_VAPID_PUBLIC_KEY dans config.js pour activer le Web Push.');
  const permission=await Notification.requestPermission();
  if(permission!=='granted')throw new Error('Autorisation de notifications refusée.');
  const reg=await navigator.serviceWorker.ready;
  let sub=await reg.pushManager.getSubscription();
  if(!sub)sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:base64ToUint8Array(key)});
  const json=sub.toJSON(); const student=loadStudentAuth();
  await rpc('mco_push_subscribe',{p_student_token:student?.token||null,p_endpoint:json.endpoint,p_p256dh:json.keys?.p256dh||'',p_auth:json.keys?.auth||'',p_user_agent:navigator.userAgent.slice(0,500)});
  return true;
}
export async function unsubscribePush(){
  if(!pushSupported())return false;
  const reg=await navigator.serviceWorker.ready; const sub=await reg.pushManager.getSubscription();
  if(!sub)return true;
  const endpoint=sub.endpoint; const student=loadStudentAuth();
  try{await rpc('mco_push_unsubscribe',{p_student_token:student?.token||null,p_endpoint:endpoint})}catch{}
  await sub.unsubscribe(); return true;
}
export async function sendNativePush(kind,payload={}){
  if(!supabase)return false;
  try{const {error}=await supabase.functions.invoke('mco-push',{body:{kind,...payload}});if(error)throw error;return true}catch{return false}
}
