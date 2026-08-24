import { avatarMarkup } from './avatar.js';
export const $ = (s,root=document) => root.querySelector(s);
export const $$ = (s,root=document) => [...root.querySelectorAll(s)];
export const esc = (v='') => String(v).replace(/[&<>'"]/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;' }[c]));
export const qs = (k) => new URLSearchParams(location.search).get(k);
export const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function teacherKey(){ let k=localStorage.getItem('mco_teacher_key'); if(!k){ k=crypto.randomUUID(); localStorage.setItem('mco_teacher_key',k); } return k; }
export function playerStore(code,data){ localStorage.setItem(`mco_player_${code}`,JSON.stringify(data)); }
export function playerLoad(code){ try{return JSON.parse(localStorage.getItem(`mco_player_${code}`)||'null')}catch{return null} }
export function toast(msg,type='ok'){ const n=document.createElement('div');n.className=`toast ${type}`;n.innerHTML=`<span class="toast-dot"></span><span>${esc(msg)}</span>`;document.body.appendChild(n);requestAnimationFrame(()=>n.classList.add('show'));setTimeout(()=>{n.classList.remove('show');setTimeout(()=>n.remove(),250)},2800); }
export function fmtDate(v){ try{return new Intl.DateTimeFormat('fr-FR',{dateStyle:'short',timeStyle:'short'}).format(new Date(v))}catch{return ''} }
export function modeLabel(m){return({class:'Mode classe',battle:'Battle',revision:'Révision',bts:'Mode BTS',duel:'Duel'}[m]||m||'Classe')}
export async function loadCurriculum(){return fetch('./data/curriculum.json').then(r=>r.json())}

const ICONS={
  home:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 10.8 12 3.7l8.5 7.1v8.1a1.6 1.6 0 0 1-1.6 1.6H5.1a1.6 1.6 0 0 1-1.6-1.6z"/><path d="M9.2 20.5v-6.2h5.6v6.2"/></svg>',
  users:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="3.1"/><path d="M3.8 19.5v-1.4A4.8 4.8 0 0 1 8.6 13h.8a4.8 4.8 0 0 1 4.8 5.1v1.4"/><path d="M15.5 5.7a3 3 0 0 1 0 5.7M16.5 13.4a4.8 4.8 0 0 1 3.7 4.7v1.4"/></svg>',
  progression:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19V9M12 19V5M19 19v-7"/><path d="m4 5 4-2 4 2 4-2 4 2"/></svg>',
  insight:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M8.5 14.8 11 12l2 1.8 3.3-4.2"/><path d="M16.3 9.6v3.1h-3.1"/></svg>',
  sheet:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3.5h9l3 3v14H6z"/><path d="M15 3.5v4h4M9 12h6M9 16h6M9 8h2"/></svg>',
  bank:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 9h8M8 13h8M8 17h5"/></svg>',
  live:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.2 2.8 6.7 13h4.4l-.4 8.2L17.3 11h-4.4z"/></svg>',
  chevron:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>',
  menu:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
  search:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/></svg>'
};
const icon=(name)=>`<span class="ui-icon">${ICONS[name]||''}</span>`;

const teacherNav=[
  ['dashboard','./teacher.html','home','Dashboard','Vue d’ensemble'],
  ['students','./students.html','users','Élèves & accès','Comptes et suivi'],
  ['progression','./progression.html','progression','Progression classes','Ouvrir les leçons'],
  ['pedagogy','./pedagogy.html','insight','Pilotage pédagogique','Analyser la classe'],
  ['revisions','./revisions.html','sheet','Fiches de révision','Préparer les révisions'],
  ['bank','./bank.html','bank','Banque de questions','Explorer le contenu']
];

export function appShell(active='home',profile=null){
  const name=profile?.displayName||profile?.email||'Professeur'; const initial=String(name).trim().charAt(0).toUpperCase()||'P';
  queueMicrotask(installGlobalUX);
  return `<aside class="sidebar premium-sidebar" data-sidebar>
    <div class="sidebar-head"><a class="brand-mini" href="./index.html"><img src="./assets/icons/icon-96.png"><span class="brand-mini-copy"><b>MCO Quiz Arena</b><small>NCR SOLUTIONS • BTS MCO</small></span></a><button id="sidebarToggle" class="sidebar-toggle" type="button" aria-label="Réduire le menu">${icon('menu')}</button></div>
    <div class="side-section-label">ESPACE PROFESSEUR</div>
    <nav class="side-nav">${teacherNav.map(([key,href,ico,label,desc])=>`<a class="${active===key?'active':''}" href="${href}" data-nav-key="${key}">${icon(ico)}<span class="nav-copy"><b>${label}</b><small>${desc}</small></span><span class="nav-arrow">${ICONS.chevron}</span></a>`).join('')}</nav>
    <div class="sidebar-quick"><a href="./teacher.html#create" class="sidebar-live-btn">${icon('live')}<span><b>Nouveau live</b><small>Lancer une session</small></span></a><button class="sidebar-search-btn" id="openCommandPalette" type="button">${icon('search')}<span>Navigation rapide</span><kbd>⌘K</kbd></button></div>
    <div class="teacher-card"><div class="teacher-avatar">${esc(initial)}</div><div class="teacher-card-copy"><b>${esc(name)}</b><small>${esc((profile?.role||'teacher').toUpperCase())}</small></div><button id="logoutBtn" class="logout-mini" title="Se déconnecter" aria-label="Se déconnecter">↗</button></div>
    <div class="side-foot"><img src="./assets/icons/icon-64.png"><span>NCR SOLUTIONS<br><b>BTS MCO</b></span></div>
  </aside>`;
}

export function studentTopbar(student,active='home'){
  queueMicrotask(installGlobalUX);
  const nav=[['home','./student.html','home','Accueil'],['revisions','./student-revisions.html','sheet','Mes fiches'],['live','./join.html','live','Live'],['profile','./student-profile.html','users','Avatar']];
  return `<header class="student-topbar"><a class="student-brand" href="./student.html"><img src="./assets/icons/icon-64.png"><span><b>MCO Quiz Arena</b><small>NCR Solutions • BTS MCO</small></span></a><nav class="student-main-nav">${nav.map(([key,href,ico,label])=>`<a class="${active===key?'active':''}" href="${href}">${icon(ico)}<span>${label}</span></a>`).join('')}</nav><div class="student-profile-zone"><a class="student-mini student-profile-chip" href="./student-profile.html" aria-label="Personnaliser mon avatar"><span class="student-mini-avatar">${avatarMarkup(student?.avatar||{},'avatar-svg avatar-topbar-svg',`Avatar de ${student?.displayName||'élève'}`)}</span><span class="student-mini-copy"><span>${esc(student?.displayName||'Élève')}</span><small>${esc(student?.className||'BTS MCO')}</small></span></a><button id="studentLogout" class="student-logout" type="button">Déconnexion</button></div></header>`;
}

export function configWarning(){ return `<div class="config-warning"><b>Configuration Supabase requise</b><br>Ouvre <code>docs/config.js</code> et renseigne ton URL Supabase + ta clé publishable. La clé <b>service_role</b> ne doit jamais être utilisée ici.</div>`; }

let uxInstalled=false;
export function installGlobalUX(){
  if(uxInstalled)return;uxInstalled=true;
  const applyCollapsed=()=>document.documentElement.classList.toggle('sidebar-collapsed',localStorage.getItem('mco_sidebar_collapsed')==='1');
  applyCollapsed();
  document.addEventListener('click',e=>{
    const t=e.target.closest?.('#sidebarToggle');if(t){const next=!document.documentElement.classList.contains('sidebar-collapsed');localStorage.setItem('mco_sidebar_collapsed',next?'1':'0');document.documentElement.classList.toggle('sidebar-collapsed',next);return}
    if(e.target.closest?.('#openCommandPalette'))openCommandPalette();
    if(e.target.closest?.('[data-command-close]'))closeCommandPalette();
  });
  document.addEventListener('keydown',e=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();openCommandPalette()}if(e.key==='Escape')closeCommandPalette()});
}
function openCommandPalette(){
  if(document.querySelector('#commandPalette'))return;
  const items=teacherNav.map(([key,href,ico,label,desc])=>`<a href="${href}" class="command-item">${icon(ico)}<span><b>${label}</b><small>${desc}</small></span><kbd>↵</kbd></a>`).join('');
  document.body.insertAdjacentHTML('beforeend',`<div class="command-backdrop" id="commandPalette" data-command-close><div class="command-palette" role="dialog" aria-modal="true" aria-label="Navigation rapide"><div class="command-search">${icon('search')}<input id="commandSearch" autocomplete="off" placeholder="Aller vers…"><kbd>ESC</kbd></div><div class="command-list">${items}<a href="./teacher.html#create" class="command-item command-live">${icon('live')}<span><b>Nouveau live</b><small>Créer une session maintenant</small></span><kbd>↵</kbd></a></div></div></div>`);
  const box=$('#commandPalette');box.addEventListener('click',e=>e.stopPropagation());box.parentElement?.addEventListener?.('click',()=>{});
  const backdrop=document.querySelector('#commandPalette');backdrop.addEventListener('click',e=>{if(e.target===backdrop)closeCommandPalette()});
  const input=$('#commandSearch');input?.focus();input?.addEventListener('input',()=>{const q=input.value.trim().toLowerCase();$$('.command-item',backdrop).forEach(a=>a.hidden=!!q&&!a.textContent.toLowerCase().includes(q))});
}
function closeCommandPalette(){document.querySelector('#commandPalette')?.remove()}
