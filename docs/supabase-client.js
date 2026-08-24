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
export async function signOutTeacher(){ if(supabase) await supabase.auth.signOut(); }
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

// Portail élève : authentification par identifiant + mot de passe, sans exposer de clé sensible.
const STUDENT_KEY='mco_student_auth_v1';
export function loadStudentAuth(){ try{return JSON.parse(localStorage.getItem(STUDENT_KEY)||'null')}catch{return null} }
export function saveStudentAuth(data){ localStorage.setItem(STUDENT_KEY,JSON.stringify(data)); }
export function clearStudentAuth(){ localStorage.removeItem(STUDENT_KEY); }
export async function signInStudent(identifier,password){
  const data=await rpc('mco_student_login',{p_identifier:identifier,p_password:password});
  saveStudentAuth({token:data.token,student:data.student});
  return data;
}
export async function studentMe(){
  const auth=loadStudentAuth(); if(!auth?.token) return null;
  try{ const student=await rpc('mco_student_me',{p_token:auth.token}); saveStudentAuth({token:auth.token,student}); return student; }
  catch{ clearStudentAuth(); return null; }
}
export async function requireStudent(){
  if(!isConfigured){ location.href='./student-login.html'; return null; }
  const student=await studentMe();
  if(!student){
    const next=encodeURIComponent(location.pathname.split('/').pop()+location.search);
    location.href=`./student-login.html?next=${next}`; return null;
  }
  return {student,auth:loadStudentAuth()};
}
export async function signOutStudent(){
  const a=loadStudentAuth();
  try{ if(a?.token) await rpc('mco_student_logout',{p_token:a.token}); }catch{}
  clearStudentAuth();
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
