import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const cfg = window.MCO_CONFIG || {};
export const isConfigured = Boolean(
  cfg.SUPABASE_URL && cfg.SUPABASE_PUBLISHABLE_KEY &&
  !cfg.SUPABASE_URL.includes('TON-PROJET') && !cfg.SUPABASE_PUBLISHABLE_KEY.includes('XXXXX')
);

export const supabase = isConfigured
  ? createClient(cfg.SUPABASE_URL, cfg.SUPABASE_PUBLISHABLE_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
      realtime: { params: { eventsPerSecond: 20 } }
    })
  : null;

export async function rpc(name, params = {}) {
  if (!supabase) throw new Error('Supabase n’est pas configuré. Renseigne docs/config.js.');
  const { data, error } = await supabase.rpc(name, params);
  if (error) throw new Error(error.message || 'Erreur Supabase');
  return data;
}

export async function getSession(){
  if(!supabase) return null;
  const {data,error}=await supabase.auth.getSession();
  if(error) throw error;
  return data.session || null;
}
export async function signInTeacher(email,password){
  if(!supabase) throw new Error('Supabase n’est pas configuré.');
  const {data,error}=await supabase.auth.signInWithPassword({email,password});
  if(error) throw new Error(error.message||'Connexion impossible');
  return data.session;
}
export async function signOutTeacher(){
  if(supabase) await supabase.auth.signOut();
}
export async function requestPasswordReset(email){
  if(!supabase) throw new Error('Supabase n’est pas configuré.');
  const redirectTo=new URL('./reset.html',location.href).href;
  const {error}=await supabase.auth.resetPasswordForEmail(email,{redirectTo});
  if(error) throw new Error(error.message||'Impossible d’envoyer le lien');
}
export async function updateTeacherPassword(password){
  if(!supabase) throw new Error('Supabase n’est pas configuré.');
  const {error}=await supabase.auth.updateUser({password});
  if(error) throw new Error(error.message||'Impossible de changer le mot de passe');
}
export async function teacherMe(){ return rpc('mco_teacher_me',{}); }
export async function requireTeacher(){
  if(!isConfigured){ location.href='./login.html'; return null; }
  const s=await getSession();
  if(!s){
    const next=encodeURIComponent(location.pathname.split('/').pop()+location.search);
    location.href=`./login.html?next=${next}`; return null;
  }
  try{return await teacherMe();}
  catch(e){
    await signOutTeacher();
    const msg=encodeURIComponent('Ce compte n’a pas d’accès professeur MCO Quiz Arena.');
    location.href=`./login.html?error=${msg}`; return null;
  }
}

export function liveChannel(code, onRefresh) {
  if (!supabase || !code) return { broadcast: async()=>{}, close: async()=>{} };
  const channel = supabase.channel(`mco:${String(code).toUpperCase()}`, { config: { broadcast: { self: false } } });
  channel.on('broadcast', { event: 'refresh' }, () => onRefresh?.());
  channel.subscribe();
  return {
    broadcast: async (reason='refresh') => { try { await channel.send({ type:'broadcast', event:'refresh', payload:{ reason, at:Date.now() } }); } catch {} },
    close: async () => { try { await supabase.removeChannel(channel); } catch {} }
  };
}
