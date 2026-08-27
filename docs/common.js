import { avatarMarkup } from './avatar.js';

export const $ = (s,root=document) => root.querySelector(s);
export const $$ = (s,root=document) => [...root.querySelectorAll(s)];
export const esc = (v='') => String(v).replace(/[&<>'"]/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;' }[c]));
export const qs = (k) => new URLSearchParams(location.search).get(k);
export const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function teacherKey(){ let k=localStorage.getItem('mco_teacher_key'); if(!k){ k=crypto.randomUUID(); localStorage.setItem('mco_teacher_key',k); } return k; }
export function playerStore(code,data){ localStorage.setItem(`mco_player_${code}`,JSON.stringify(data)); }
export function playerLoad(code){ try{return JSON.parse(localStorage.getItem(`mco_player_${code}`)||'null')}catch{return null} }
export function toast(msg,type='ok'){ const n=document.createElement('div');n.className=`toast ${type}`;n.innerHTML=`<span class="toast-dot"></span><span>${esc(msg)}</span>`;document.body.appendChild(n);requestAnimationFrame(()=>n.classList.add('show'));setTimeout(()=>{n.classList.remove('show');setTimeout(()=>n.remove(),250)},3000); }
export function fmtDate(v){ try{return new Intl.DateTimeFormat('fr-FR',{dateStyle:'short',timeStyle:'short'}).format(new Date(v))}catch{return ''} }
export function modeLabel(m){return({class:'Mode classe',battle:'Battle',revision:'Révision',bts:'Mode BTS',duel:'Duel'}[m]||m||'Classe')}
export async function loadCurriculum(){return fetch('./data/curriculum.json').then(r=>r.json())}

const ICONS={
  home:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 10.7 12 3.8l8.5 6.9v8.1a1.7 1.7 0 0 1-1.7 1.7H5.2a1.7 1.7 0 0 1-1.7-1.7z"/><path d="M9.3 20.5v-6.2h5.4v6.2"/></svg>',
  users:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="3.1"/><path d="M3.8 19.5v-1.3A4.8 4.8 0 0 1 8.6 13h.8a4.8 4.8 0 0 1 4.8 5.2v1.3"/><path d="M15.5 5.7a3 3 0 0 1 0 5.7M16.5 13.4a4.8 4.8 0 0 1 3.7 4.7v1.4"/></svg>',
  progression:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19V9M12 19V5M19 19v-7"/><path d="m4 6 4-2 4 2 4-2 4 2"/></svg>',
  insight:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M8.4 14.8 11 12l2 1.8 3.4-4.3"/><path d="M16.4 9.5v3.2h-3.2"/></svg>',
  sheet:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3.5h9l3 3v14H6z"/><path d="M15 3.5v4h4M9 12h6M9 16h6M9 8h2"/></svg>',
  case:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="4.5" width="14" height="16" rx="2.5"/><path d="M9 4.5V3h6v1.5M8.5 9h7M8.5 13h4M8.5 17h6"/></svg>',
  bank:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="2.5"/><path d="M8 9h8M8 13h8M8 17h5"/></svg>',
  live:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.2 2.8 6.7 13h4.4l-.4 8.2L17.3 11h-4.4z"/></svg>',
  chevron:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>',
  menu:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
  search:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/></svg>',
  plus:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
  logout:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 5H6.5A1.5 1.5 0 0 0 5 6.5v11A1.5 1.5 0 0 0 6.5 19H10"/><path d="m14 8 4 4-4 4M18 12H9"/></svg>',
  play:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l10-6.5z"/></svg>',
  qr:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 14h2v2h-2zM14 18h2v2h-2zM18 18h2v2h-2z"/></svg>',
  remote:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="3" width="14" height="18" rx="4"/><circle cx="12" cy="8" r="2.2"/><path d="M9 13h6M12 10v6"/></svg>',
  arrow:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M14 7l5 5-5 5"/></svg>',
  spark:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2 1.7 6.3L20 10l-6.3 1.7L12 18l-1.7-6.3L4 10l6.3-1.7z"/></svg>',
  calendar:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5.5" width="16" height="14" rx="2"/><path d="M8 3v5M16 3v5M4 10h16"/></svg>',
  trophy:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 4h8v4.5A4 4 0 0 1 12 12.5 4 4 0 0 1 8 8.5z"/><path d="M8 6H4v1.5A4.5 4.5 0 0 0 8.5 12M16 6h4v1.5a4.5 4.5 0 0 1-4.5 4.5M12 12.5V17M8.5 20h7M10 17h4"/></svg>',
  clock:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3.5 2"/></svg>',
  close:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>',
  pulse:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12h4l2-5 4 10 2-5h6"/><circle cx="12" cy="12" r="9"/></svg>'
};
export const uiIcon=(name,cls='')=>`<span class="ui-icon ${cls}">${ICONS[name]||''}</span>`;

const teacherNav=[
  ['dashboard','./teacher.html','home','Dashboard','Vue d’ensemble'],
  ['students','./students.html','users','Élèves & accès','Comptes et suivi'],
  ['progression','./progression.html','progression','Progression classes','Ouvrir les leçons'],
  ['portals','./class-portals.html','qr','QR permanents','Portails de classe'],
  ['pedagogy','./pedagogy.html','insight','Pilotage pédagogique','Analyser la classe'],
  ['buzzer','./buzzer.html','live','Buzzer oral','Interroger la classe'],
  ['cases','./cases.html','case','Cas pratiques','Classe, maison, PDF'],
  ['revisions','./revisions.html','sheet','Fiches de révision','Préparer les révisions'],
  ['open','./open-questions.html','spark','Questions ouvertes','Calculs & réponses libres'],
  ['bank','./bank.html','bank','Banque de questions','Explorer le contenu']
];
const teacherMeta=Object.fromEntries(teacherNav.map(([k,,ico,label,desc])=>[k,{ico,label,desc}]));

export function appShell(active='dashboard',profile=null){
  const name=profile?.displayName||profile?.email||'Professeur';
  const initial=String(name).trim().charAt(0).toUpperCase()||'P';
  queueMicrotask(()=>installGlobalUX(active));
  return `<aside class="sidebar premium-sidebar v8-sidebar" data-sidebar>
    <div class="v8-side-brand"><a href="./teacher.html" class="v8-brand-lockup"><img src="./assets/icons/icon-96.png" alt=""><span><b>MCO Quiz Arena</b><small>NCR • BTS MCO</small></span></a><button id="sidebarToggle" class="sidebar-toggle" type="button" aria-label="Réduire le menu">${uiIcon('menu')}</button></div>
    <div class="v8-side-context"><span class="v8-live-dot"></span><span>ESPACE ENSEIGNANT</span></div>
    <nav class="side-nav v8-side-nav">${teacherNav.map(([key,href,ico,label,desc])=>`<a class="${active===key?'active':''}" href="${href}" data-nav-key="${key}">${uiIcon(ico)}<span class="nav-copy"><b>${label}</b><small>${desc}</small></span><span class="nav-arrow">${ICONS.chevron}</span></a>`).join('')}</nav>
    <div class="v8-side-spacer"></div>
    <div class="v8-side-actions"><a href="./teacher.html#create" class="v8-new-live">${uiIcon('plus')}<span><b>Nouveau live</b><small>Créer une session</small></span></a><button class="v8-command-btn" id="openCommandPalette" type="button">${uiIcon('search')}<span>Navigation rapide</span><kbd>⌘K</kbd></button></div>
    <div class="teacher-card v8-teacher-card"><div class="teacher-avatar">${esc(initial)}</div><div class="teacher-card-copy"><b>${esc(name)}</b><small>${esc((profile?.role||'teacher').toUpperCase())}</small></div><button id="logoutBtn" class="logout-mini" title="Se déconnecter" aria-label="Se déconnecter">${uiIcon('logout')}</button></div>
  </aside>`;
}

export function studentTopbar(student,active='home'){
  queueMicrotask(()=>installStudentUX());
  const nav=[['home','./student.html','home','Accueil'],['revisions','./student-revisions.html','sheet','Fiches'],['open','./student-open.html','spark','Ouvertes'],['live','./join.html','live','Live'],['profile','./student-profile.html','users','Avatar']];
  const links=nav.map(([key,href,ico,label])=>`<a class="${active===key?'active':''}" href="${href}">${uiIcon(ico)}<span>${label}</span></a>`).join('');
  return `<header class="student-topbar v8-student-topbar"><a class="student-brand v8-student-brand" href="./student.html"><img src="./assets/icons/icon-64.png" alt=""><span><b>MCO Quiz Arena</b><small>${esc(student?.className||'BTS MCO')}</small></span></a><nav class="student-main-nav v8-student-nav">${links}</nav><div class="student-profile-zone"><button class="native-system-btn" type="button" data-native-center aria-label="Centre de l’application" title="État de l’app">${uiIcon('pulse')}</button><a class="student-mini student-profile-chip v8-profile-chip" href="./student-profile.html" aria-label="Personnaliser mon avatar"><span class="student-mini-avatar">${avatarMarkup(student?.avatar||{},'avatar-svg avatar-topbar-svg',`Avatar de ${student?.displayName||'élève'}`)}</span><span class="student-mini-copy"><span>${esc(student?.displayName||'Élève')}</span><small>Mon profil</small></span></a><button id="studentLogout" class="student-logout v8-student-logout" type="button" aria-label="Se déconnecter">${uiIcon('logout')}</button></div></header><nav class="student-mobile-dock v8-student-dock" aria-label="Navigation élève">${links}</nav>`;
}

export function configWarning(){ return `<div class="config-warning"><b>Configuration Supabase requise</b><br>Ouvre <code>docs/config.js</code> et renseigne ton URL Supabase + ta clé publishable. La clé <b>service_role</b> ne doit jamais être utilisée ici.</div>`; }

let uxInstalled=false;
function teacherUtility(active){
  const meta=teacherMeta[active]||teacherMeta.dashboard;
  const date=new Intl.DateTimeFormat('fr-FR',{weekday:'long',day:'numeric',month:'long'}).format(new Date());
  return `<header class="teacher-utility v8-utility"><div class="teacher-utility-left"><button class="utility-menu" id="mobileMenuToggle" type="button" aria-label="Ouvrir le menu">${uiIcon('menu')}</button><div class="v8-utility-page"><span>${meta.label}</span><small>${date}</small></div></div><div class="teacher-utility-actions"><button class="native-system-btn" type="button" data-native-center aria-label="Centre de l’application" title="État de l’app">${uiIcon('pulse')}</button><button class="utility-search v8-search-command" id="openCommandPaletteTop" type="button">${uiIcon('search')}<span>Rechercher ou aller à…</span><kbd>⌘K</kbd></button><a class="utility-live v8-top-live" href="./teacher.html#create">${uiIcon('plus')}<span>Nouveau live</span></a></div></header>`;
}
function teacherMobileDock(active){const keys=['dashboard','students','progression','cases','revisions'];const nav=teacherNav.filter(([key])=>keys.includes(key));return `<nav class="teacher-mobile-dock" aria-label="Navigation professeur">${nav.map(([key,href,ico,label])=>`<a href="${href}" class="${active===key?'active':''}">${uiIcon(ico)}<span>${label.replace(' & accès','').replace('Progression classes','Progression').replace('Fiches de révision','Fiches').replace('Cas pratiques','Cas')}</span></a>`).join('')}</nav>`}

export function installGlobalUX(active='dashboard'){
  const isTeacher=!!document.querySelector('.teacher-body');
  if(isTeacher){
    const main=document.querySelector('.premium-main');
    if(main&&!main.querySelector('.teacher-utility')) main.insertAdjacentHTML('afterbegin',teacherUtility(active));
    if(!document.querySelector('.teacher-mobile-dock')) document.body.insertAdjacentHTML('beforeend',teacherMobileDock(active));
  }
  if(uxInstalled)return;uxInstalled=true;
  const applyCollapsed=()=>document.documentElement.classList.toggle('sidebar-collapsed',localStorage.getItem('mco_sidebar_collapsed')==='1');
  applyCollapsed();
  document.addEventListener('click',e=>{
    const collapse=e.target.closest?.('#sidebarToggle');
    if(collapse){const next=!document.documentElement.classList.contains('sidebar-collapsed');localStorage.setItem('mco_sidebar_collapsed',next?'1':'0');document.documentElement.classList.toggle('sidebar-collapsed',next);return}
    if(e.target.closest?.('#mobileMenuToggle')){document.documentElement.classList.toggle('sidebar-mobile-open');return}
    if(e.target.closest?.('.mobile-sidebar-backdrop')){document.documentElement.classList.remove('sidebar-mobile-open');return}
    if(e.target.closest?.('#openCommandPalette,#openCommandPaletteTop'))openCommandPalette();
    if(e.target.closest?.('[data-command-close]'))closeCommandPalette();
    if(e.target.closest?.('.side-nav a'))document.documentElement.classList.remove('sidebar-mobile-open');
  });
  if(isTeacher&&!document.querySelector('.mobile-sidebar-backdrop'))document.body.insertAdjacentHTML('beforeend','<div class="mobile-sidebar-backdrop" aria-hidden="true"></div>');
  document.addEventListener('keydown',e=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();openCommandPalette()}if(e.key==='Escape'){closeCommandPalette();document.documentElement.classList.remove('sidebar-mobile-open')}});
  window.addEventListener('resize',()=>{if(innerWidth>900)document.documentElement.classList.remove('sidebar-mobile-open')},{passive:true});
}
function installStudentUX(){document.body.dataset.studentUx='1'}

function openCommandPalette(){
  if(document.querySelector('#commandPalette'))return;
  const items=teacherNav.map(([key,href,ico,label,desc])=>`<a href="${href}" class="command-item" data-command-item data-search="${esc(`${label} ${desc}`.toLowerCase())}">${uiIcon(ico)}<span><b>${label}</b><small>${desc}</small></span><kbd>↵</kbd></a>`).join('');
  document.body.insertAdjacentHTML('beforeend',`<div class="command-backdrop" id="commandPalette"><div class="command-palette command-palette-v10" role="dialog" aria-modal="true" aria-label="Spotlight MCO"><div class="command-search">${uiIcon('search')}<input id="commandSearch" autocomplete="off" placeholder="Leçon, chapitre, fiche, cas, action…"><kbd>ESC</kbd></div><div class="command-section-label">NAVIGATION</div><div class="command-list" id="commandBaseList">${items}<a href="./teacher.html#create" class="command-item command-live" data-command-item data-search="nouveau live créer session">${uiIcon('live')}<span><b>Nouveau live</b><small>Créer une session maintenant</small></span><kbd>↵</kbd></a><button type="button" class="command-item" data-native-center data-command-item data-search="diagnostic pwa cache notifications installation">${uiIcon('pulse')}<span><b>Centre de l’application</b><small>PWA, cache, notifications et diagnostic</small></span><kbd>↵</kbd></button></div><div id="commandDynamic"></div><div class="command-foot"><span><kbd>↑</kbd><kbd>↓</kbd> naviguer</span><span><kbd>↵</kbd> ouvrir</span><span>Recherche dans les 156 leçons</span></div></div></div>`);
  const backdrop=$('#commandPalette');backdrop.addEventListener('click',e=>{if(e.target===backdrop)closeCommandPalette()});
  const input=$('#commandSearch');input?.focus();let index=0;let curriculumCache=null;
  const visible=()=>$$('[data-command-item]',backdrop).filter(a=>!a.hidden);
  const mark=()=>{const list=visible();if(index>=list.length)index=0;list.forEach((a,i)=>a.classList.toggle('selected',i===index));list[index]?.scrollIntoView({block:'nearest'})};
  const renderDynamic=async q=>{
    const host=$('#commandDynamic');if(!host)return;if(q.length<2){host.innerHTML='';return}
    try{curriculumCache ||= await loadCurriculum();const lessons=(curriculumCache.lessons||[]).filter(l=>`${l.year} ${l.subject} ${l.chapter} ${l.chapterTitle} ${l.lesson} ${l.lessonTitle}`.toLowerCase().includes(q)).slice(0,8);host.innerHTML=lessons.length?`<div class="command-section-label">CONTENU PÉDAGOGIQUE</div><div class="command-list">${lessons.map(l=>`<a href="./teacher.html?year=${encodeURIComponent(l.year)}&subject=${encodeURIComponent(l.subject)}&chapter=${encodeURIComponent(l.chapter)}&lesson=${encodeURIComponent(l.lesson)}#create" class="command-item command-curriculum" data-command-item><span class="command-subject ${String(l.subject).toLowerCase()}">${esc(l.subject)}</span><span><b>${esc(l.lessonTitle)}</b><small>${esc(l.year)} • ${esc(l.chapter)} • Leçon ${esc(l.lesson)}</small></span><kbd>↵</kbd></a><a href="./revisions.html?key=${encodeURIComponent(`${l.year}|${l.subject}|${l.chapter}|${l.lesson}`)}" class="command-item command-compact" data-command-item>${uiIcon('sheet')}<span><b>Fiche • ${esc(l.lessonTitle)}</b><small>Ouvrir la fiche de révision</small></span></a><a href="./cases.html?lesson=${encodeURIComponent(`${l.year}|${l.subject}|${l.chapter}|${l.lesson}`)}" class="command-item command-compact" data-command-item>${uiIcon('case')}<span><b>Cas pratique • ${esc(l.lessonTitle)}</b><small>Ouvrir le Studio pédagogique</small></span></a>`).join('')}</div>`:'';index=0;mark()}catch{host.innerHTML=''}
  };
  let t;input?.addEventListener('input',()=>{const q=input.value.trim().toLowerCase();$$('#commandBaseList [data-command-item]',backdrop).forEach(a=>a.hidden=!!q&&!String(a.dataset.search||a.textContent).toLowerCase().includes(q));clearTimeout(t);t=setTimeout(()=>renderDynamic(q),80);index=0;mark()});
  input?.addEventListener('keydown',e=>{const list=visible();if(!list.length)return;if(e.key==='ArrowDown'){e.preventDefault();index=(index+1)%list.length;mark()}else if(e.key==='ArrowUp'){e.preventDefault();index=(index-1+list.length)%list.length;mark()}else if(e.key==='Enter'){e.preventDefault();list[index]?.click()}});mark();
}
function closeCommandPalette(){document.querySelector('#commandPalette')?.remove()}



// ============================================================
// V12.5 — Nettoyage typographique global
// Retire uniquement les points finaux des titres / sous-titres,
// sans casser le HTML interne ni les autres ponctuations.
// ============================================================
function v125TrimFinalDotsFromNode(el){
  if(!el) return;
  const isHeading=/^H[1-6]$/.test(el.tagName||'');
  const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);
  let node,last=null;
  while((node=walker.nextNode())) {
    if(node.nodeValue && node.nodeValue.trim()){
      if(isHeading) node.nodeValue=node.nodeValue.replace(/\./g,'');
      last=node;
    }
  }
  if(!isHeading && last) last.nodeValue=last.nodeValue.replace(/\s*\.+\s*$/u,'');
}

function v125CleanHeadingPunctuation(root=document){
  const selectors=[
    'h1','h2','h3','h4','h5','h6',
    '.dashboard-head p',
    '.v8-page-head p',
    '.v9-page-head p',
    '.v11-today-intro p',
    '.v11-next-main p',
    '.v11-create-intro p',
    '.v8-home-hero-copy > p',
    '.v124-experience-head p',
    '.v124-scene-copy p'
  ];
  root.querySelectorAll?.(selectors.join(',')).forEach(v125TrimFinalDotsFromNode);
}

function v125InstallTypographyObserver(){
  v125CleanHeadingPunctuation(document);
  const target=document.body||document.documentElement;
  if(!target||target.__v125Observer) return;
  target.__v125Observer=true;
  const observer=new MutationObserver((mutations)=>{
    for(const m of mutations){
      for(const n of m.addedNodes){
        if(n.nodeType===1){
          v125CleanHeadingPunctuation(n);
          if(n.matches?.('h1,h2,h3,h4,h5,h6,.dashboard-head p,.v8-page-head p,.v9-page-head p,.v11-today-intro p,.v11-next-main p,.v11-create-intro p')) {
            v125TrimFinalDotsFromNode(n);
          }
        }
      }
    }
  });
  observer.observe(target,{childList:true,subtree:true});
}

if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',v125InstallTypographyObserver,{once:true});
}else{
  v125InstallTypographyObserver();
}
