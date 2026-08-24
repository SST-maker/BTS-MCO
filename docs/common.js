import { avatarMarkup } from './avatar.js';
export const $ = (s,root=document) => root.querySelector(s);
export const $$ = (s,root=document) => [...root.querySelectorAll(s)];
export const esc = (v='') => String(v).replace(/[&<>'"]/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;' }[c]));
export const qs = (k) => new URLSearchParams(location.search).get(k);
export const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function teacherKey(){ let k=localStorage.getItem('mco_teacher_key'); if(!k){ k=crypto.randomUUID(); localStorage.setItem('mco_teacher_key',k); } return k; }
export function playerStore(code,data){ localStorage.setItem(`mco_player_${code}`,JSON.stringify(data)); }
export function playerLoad(code){ try{return JSON.parse(localStorage.getItem(`mco_player_${code}`)||'null')}catch{return null} }
export function toast(msg,type='ok'){ const n=document.createElement('div');n.className=`toast ${type}`;n.textContent=msg;document.body.appendChild(n);requestAnimationFrame(()=>n.classList.add('show'));setTimeout(()=>{n.classList.remove('show');setTimeout(()=>n.remove(),250)},2600); }
export function fmtDate(v){ try{return new Intl.DateTimeFormat('fr-FR',{dateStyle:'short',timeStyle:'short'}).format(new Date(v))}catch{return ''} }
export function modeLabel(m){return({class:'Mode classe',battle:'Battle',revision:'Révision',bts:'Mode BTS',duel:'Duel'}[m]||m||'Classe')}
export async function loadCurriculum(){return fetch('./data/curriculum.json').then(r=>r.json())}
export function appShell(active='home',profile=null){
  const name=profile?.displayName||profile?.email||'Professeur'; const initial=String(name).trim().charAt(0).toUpperCase()||'P';
  return `<aside class="sidebar premium-sidebar">
    <a class="brand-mini" href="./index.html"><img src="./assets/icons/icon-96.png"><span><b>MCO</b><small>QUIZ ARENA</small></span></a>
    <div class="side-section-label">ESPACE PROFESSEUR</div>
    <nav>
      <a class="${active==='dashboard'?'active':''}" href="./teacher.html"><span class="nav-icon">⌂</span><span>Dashboard</span></a>
      <a class="${active==='students'?'active':''}" href="./students.html"><span class="nav-icon">♙</span><span>Élèves & accès</span></a>
      <a class="${active==='progression'?'active':''}" href="./progression.html"><span class="nav-icon">◫</span><span>Progression classes</span></a>
      <a class="${active==='pedagogy'?'active':''}" href="./pedagogy.html"><span class="nav-icon">◉</span><span>Pilotage pédagogique</span></a>
      <a class="${active==='revisions'?'active':''}" href="./revisions.html"><span class="nav-icon">▤</span><span>Fiches de révision</span></a>
      <a class="${active==='bank'?'active':''}" href="./bank.html"><span class="nav-icon">▣</span><span>Banque de questions</span></a>
      <a href="./join.html"><span class="nav-icon">⚡</span><span>Rejoindre un live</span></a>
    </nav>
    <div class="teacher-card"><div class="teacher-avatar">${esc(initial)}</div><div><b>${esc(name)}</b><small>${esc(profile?.role||'teacher')}</small></div><button id="logoutBtn" class="logout-mini" title="Se déconnecter">↗</button></div>
    <div class="side-foot"><img src="./assets/icons/icon-64.png"><span>NCR SOLUTIONS<br><b>BTS MCO</b></span></div>
  </aside>`;
}
export function studentTopbar(student,active='home'){
  return `<header class="student-topbar"><a class="student-brand" href="./student.html"><img src="./assets/icons/icon-64.png"><span><b>MCO Quiz Arena</b><small>NCR Solutions • BTS MCO</small></span></a><nav><a class="${active==='home'?'active':''}" href="./student.html">Mon espace</a><a class="${active==='revisions'?'active':''}" href="./student-revisions.html">Mes fiches</a><a class="${active==='live'?'active':''}" href="./join.html">Live</a><a class="${active==='profile'?'active':''}" href="./student-profile.html">Mon avatar</a><button id="studentLogout" type="button">Déconnexion</button></nav><a class="student-mini student-profile-chip" href="./student-profile.html" aria-label="Personnaliser mon avatar"><span class="student-mini-avatar">${avatarMarkup(student?.avatar||{},'avatar-svg avatar-topbar-svg',`Avatar de ${student?.displayName||'élève'}`)}</span><span class="student-mini-copy"><span>${esc(student?.displayName||'Élève')}</span><small>${esc(student?.className||'BTS MCO')}</small></span></a></header>`;
}
export function configWarning(){ return `<div class="config-warning"><b>Configuration Supabase requise</b><br>Ouvre <code>docs/config.js</code> et renseigne ton URL Supabase + ta clé publishable. La clé <b>service_role</b> ne doit jamais être utilisée ici.</div>`; }
