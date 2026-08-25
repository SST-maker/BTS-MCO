import { queueCount, nativeDbReady, clearNativeCache } from './native-store.js';

const Native={installPrompt:null,reloading:false,wakeLock:null,reg:null};
const $=(s,r=document)=>r.querySelector(s);
const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

function toast(message,kind='info',action=null){
  let host=$('#nativeToastHost'); if(!host){host=document.createElement('div');host.id='nativeToastHost';host.className='native-toast-host';document.body.appendChild(host)}
  const el=document.createElement('div');el.className=`native-toast ${kind}`;el.innerHTML=`<span class="native-toast-dot"></span><div><b>${kind==='update'?'MCO Quiz Arena':kind==='offline'?'Mode hors ligne':'MCO Quiz Arena'}</b><span>${esc(message)}</span></div>${action?`<button type="button">${esc(action.label)}</button>`:''}`;host.appendChild(el);requestAnimationFrame(()=>el.classList.add('show'));
  el.querySelector('button')?.addEventListener('click',()=>action.fn?.());
  if(!action)setTimeout(()=>{el.classList.remove('show');setTimeout(()=>el.remove(),250)},3200);
  return el;
}

async function registerSW(){
  if(!('serviceWorker' in navigator))return;
  try{
    const reg=await navigator.serviceWorker.register('./service-worker.js',{updateViaCache:'none'});Native.reg=reg;
    if(reg.waiting)showUpdate(reg);
    reg.addEventListener('updatefound',()=>{const worker=reg.installing;if(!worker)return;worker.addEventListener('statechange',()=>{if(worker.state==='installed'&&navigator.serviceWorker.controller)showUpdate(reg)})});
    navigator.serviceWorker.addEventListener('controllerchange',()=>{if(Native.reloading)return;Native.reloading=true;location.reload()});
    setInterval(()=>reg.update().catch(()=>{}),30*60*1000);
  }catch{}
}
function showUpdate(reg){
  const existing=$('.native-toast.update');if(existing)return;
  toast('Une nouvelle version est prête. Ton écran actuel sera restauré après la mise à jour.','update',{label:'Mettre à jour',fn:()=>{savePageState();reg.waiting?.postMessage({type:'SKIP_WAITING'})}});
}

function savePageState(){try{sessionStorage.setItem(`mco-state:${location.pathname}${location.search}`,JSON.stringify({scrollY,at:Date.now()}))}catch{}}
function restorePageState(){try{const k=`mco-state:${location.pathname}${location.search}`;const s=JSON.parse(sessionStorage.getItem(k)||'null');if(s&&Date.now()-s.at<10*60*1000){requestAnimationFrame(()=>scrollTo({top:s.scrollY||0,behavior:'instant'}));sessionStorage.removeItem(k)}}catch{}}
function wireHistory(){window.addEventListener('pagehide',savePageState,{capture:true});restorePageState()}

function wireNetwork(){
  const update=()=>{document.documentElement.classList.toggle('is-offline',!navigator.onLine);if(!navigator.onLine)toast('Les leçons et fiches déjà consultées restent accessibles. Les lives nécessitent Internet.','offline');else window.dispatchEvent(new CustomEvent('mco:back-online'))};
  addEventListener('online',update);addEventListener('offline',update);update();
}

function wirePrefetch(){
  const seen=new Set();const prefetch=a=>{if(!a||seen.size>=10)return;let u;try{u=new URL(a.href,location.href)}catch{return}if(u.origin!==location.origin||u.pathname===location.pathname)return;if(seen.has(u.href))return;seen.add(u.href);const l=document.createElement('link');l.rel='prefetch';l.href=u.href;document.head.appendChild(l)};
  document.addEventListener('pointerover',e=>{if(e.pointerType==='mouse')prefetch(e.target.closest?.('a[href]'))},{passive:true});
  document.addEventListener('touchstart',e=>prefetch(e.target.closest?.('a[href]')),{passive:true});
}

async function requestWakeLock(){
  if(!('wakeLock' in navigator)||document.visibilityState!=='visible')return false;
  try{Native.wakeLock=await navigator.wakeLock.request('screen');return true}catch{return false}
}
function wireWakeLock(){
  const projection=document.body.classList.contains('projection-body')||document.body.classList.contains('case-projection-body');if(!projection)return;
  requestWakeLock();document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')requestWakeLock()});
}

function applyTheme(theme=localStorage.getItem('mco_theme_v10')||'auto'){
  document.documentElement.dataset.mcoTheme=theme;localStorage.setItem('mco_theme_v10',theme);
  const dark=theme==='dark'||(theme==='auto'&&matchMedia('(prefers-color-scheme: dark)').matches);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content',dark?'#061429':'#F6F8FC');
}
function wireTheme(){applyTheme();matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change',()=>{if((localStorage.getItem('mco_theme_v10')||'auto')==='auto')applyTheme('auto')})}

function deepLinkLabel(){
  const p=location.pathname.split('/').pop();if(p==='join.html')return 'Partager ce live';if(p==='lesson.html')return 'Partager cette leçon';if(p?.includes('revision'))return 'Partager cette fiche';if(p==='case-projection.html'||p==='cases.html')return 'Partager ce cas';return 'Partager cette page';
}
async function shareCurrent(){
  const data={title:document.title,text:'MCO Quiz Arena',url:location.href};
  if(navigator.share){try{await navigator.share(data);return}catch(e){if(e?.name==='AbortError')return}}
  try{await navigator.clipboard.writeText(location.href);toast('Lien copié.') }catch{prompt('Copie ce lien :',location.href)}
}

function installInstructions(){
  const ios=/iPad|iPhone|iPod/.test(navigator.userAgent);const mac=/Macintosh/.test(navigator.userAgent);const standalone=matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
  if(standalone)return '<p class="native-ok">✓ L’application est déjà installée.</p>';
  if(Native.installPrompt)return '<button class="native-action primary" id="nativeInstallNow">Installer MCO Quiz Arena</button>';
  if(ios)return '<p>Sur iPhone/iPad : <b>Partager</b> → <b>Sur l’écran d’accueil</b> → Ajouter.</p>';
  if(mac)return '<p>Sur Safari : <b>Fichier</b> → <b>Ajouter au Dock</b> (si proposé), ou utilise Chrome/Edge pour l’installation PWA.</p>';
  return '<p>Utilise le menu du navigateur puis <b>Installer l’application</b> / <b>Ajouter à l’écran d’accueil</b>.</p>';
}

async function diagnostics(){
  let ps={supported:false,permission:'unknown',subscribed:false,configured:false};
  try{const mod=await import('./push-client.js');ps=await mod.pushStatus()}catch{}
  const queue=await queueCount();const idb=await nativeDbReady();
  return {online:navigator.onLine,standalone:matchMedia('(display-mode: standalone)').matches||navigator.standalone===true,sw:!!navigator.serviceWorker?.controller,idb,queue,wake:'wakeLock'in navigator,push:ps,badge:'setAppBadge'in navigator,share:'share'in navigator,viewTransitions:CSS.supports?.('view-transition-name: none')||'startViewTransition'in document,supabase:!!window.MCO_CONFIG?.SUPABASE_URL};
}

async function openNativeCenter(){
  $('#nativeCenterModal')?.remove();const d=await diagnostics();
  const modal=document.createElement('div');modal.id='nativeCenterModal';modal.className='native-center-backdrop';modal.innerHTML=`<section class="native-center" role="dialog" aria-modal="true" aria-label="Centre application"><header><div><span class="native-kicker">NATIVE EXPERIENCE V10</span><h2>Centre de l’application</h2><p>Installation, notifications, thème et diagnostic en un seul endroit.</p></div><button type="button" data-native-close aria-label="Fermer">×</button></header><div class="native-center-grid"><article><h3>App installée</h3>${installInstructions()}</article><article><h3>Apparence</h3><div class="native-segment"><button data-theme="auto">Auto</button><button data-theme="light">Clair</button><button data-theme="dark">Sombre</button></div></article><article><h3>Notifications</h3><p>${d.push.supported?(d.push.configured?(d.push.subscribed?'Notifications activées.':'Active les notifications de leçons et de lives.'):'Web Push prêt : ajoute la clé VAPID publique dans config.js.'):'Non disponible sur ce navigateur.'}</p>${d.push.supported&&d.push.configured?`<button class="native-action" id="nativePushToggle">${d.push.subscribed?'Désactiver':'Activer'} les notifications</button>`:''}</article><article><h3>Actions rapides</h3><button class="native-action" id="nativeShare">${esc(deepLinkLabel())}</button><button class="native-action" id="nativeCheckUpdate">Rechercher une mise à jour</button></article></div><div class="native-diagnostics"><div class="native-diag-title"><span>DIAGNOSTIC</span><button id="nativeClearCache" type="button">Réinitialiser le cache local</button></div><div class="native-diag-grid">${[['Internet',d.online],['PWA',d.standalone],['Service Worker',d.sw],['Cache hors ligne',d.idb],['View Transitions',d.viewTransitions],['Wake Lock',d.wake],['Partage natif',d.share],['Badging',d.badge],['Supabase',d.supabase]].map(([l,v])=>`<div><span>${esc(l)}</span><b class="${v?'ok':'muted'}">${v?'✓':'—'}</b></div>`).join('')}<div><span>Sync en attente</span><b>${d.queue}</b></div></div></div></section>`;
  document.body.appendChild(modal);
  modal.addEventListener('click',e=>{if(e.target===modal||e.target.closest('[data-native-close]'))modal.remove()});
  modal.querySelectorAll('[data-theme]').forEach(b=>{b.classList.toggle('active',b.dataset.theme===(localStorage.getItem('mco_theme_v10')||'auto'));b.onclick=()=>{applyTheme(b.dataset.theme);modal.querySelectorAll('[data-theme]').forEach(x=>x.classList.toggle('active',x===b))}});
  $('#nativeInstallNow')?.addEventListener('click',async()=>{await Native.installPrompt?.prompt();Native.installPrompt=null;modal.remove()});
  $('#nativeShare')?.addEventListener('click',shareCurrent);
  $('#nativeCheckUpdate')?.addEventListener('click',async()=>{await Native.reg?.update();toast('Vérification terminée.')});
  $('#nativePushToggle')?.addEventListener('click',async e=>{e.currentTarget.disabled=true;try{const mod=await import('./push-client.js');d.push.subscribed?await mod.unsubscribePush():await mod.subscribePush();toast(d.push.subscribed?'Notifications désactivées.':'Notifications activées.');modal.remove()}catch(err){toast(err.message,'offline');e.currentTarget.disabled=false}});
  $('#nativeClearCache')?.addEventListener('click',async()=>{if(!confirm('Réinitialiser le cache local et les données hors ligne ? Tes données Supabase ne seront pas supprimées.'))return;await clearNativeCache();const keys=await caches.keys();await Promise.all(keys.filter(k=>k.startsWith('mco-quiz-')).map(k=>caches.delete(k)));toast('Cache local réinitialisé.');modal.remove()});
}

function wireNativeCenter(){
  const homeNav=document.querySelector('.v8-home-nav nav');if(homeNav&&!homeNav.querySelector('[data-native-center]'))homeNav.insertAdjacentHTML('afterbegin','<button type="button" class="v10-home-app" data-native-center>Installer l’app</button>');
  document.addEventListener('click',e=>{if(e.target.closest?.('[data-native-center]'))openNativeCenter();if(e.target.closest?.('[data-native-share]'))shareCurrent()});
  addEventListener('beforeinstallprompt',e=>{e.preventDefault();Native.installPrompt=e;window.dispatchEvent(new CustomEvent('mco:install-ready'))});
}

function wireContextMenu(){
  if(!matchMedia('(hover:hover) and (pointer:fine)').matches)return;
  document.addEventListener('contextmenu',e=>{
    const a=e.target.closest?.('a[href]');if(!a||a.origin!==location.origin)return;e.preventDefault();document.querySelector('.native-context-menu')?.remove();
    const m=document.createElement('div');m.className='native-context-menu';m.style.left=`${Math.min(e.clientX,innerWidth-230)}px`;m.style.top=`${Math.min(e.clientY,innerHeight-170)}px`;m.innerHTML=`<button data-open>Ouvrir</button><button data-new>Ouvrir dans un nouvel onglet</button><button data-share>Partager</button><button data-copy>Copier le lien</button>`;document.body.appendChild(m);
    m.querySelector('[data-open]').onclick=()=>location.href=a.href;m.querySelector('[data-new]').onclick=()=>window.open(a.href,'_blank','noopener');m.querySelector('[data-share]').onclick=async()=>{m.remove();if(navigator.share)await navigator.share({title:a.textContent.trim()||document.title,url:a.href});else await navigator.clipboard.writeText(a.href)};m.querySelector('[data-copy]').onclick=async()=>{await navigator.clipboard.writeText(a.href);toast('Lien copié.');m.remove()};
    setTimeout(()=>document.addEventListener('pointerdown',()=>m.remove(),{once:true,capture:true}),0);
  });
}

function wireBadge(){
  window.MCONative={
    setBadge:async n=>{try{if('setAppBadge'in navigator){n?await navigator.setAppBadge(Number(n)):await navigator.clearAppBadge()}}catch{}},
    clearBadge:async()=>{try{await navigator.clearAppBadge?.()}catch{}},
    openCenter:openNativeCenter,
    share:shareCurrent
  };
  if(document.body.classList.contains('student-body'))window.MCONative.clearBadge();
}


function wireSkeleton(){
  const root=$('#root');if(!root||document.body.classList.contains('home-v8')||document.body.classList.contains('projection-body')||document.body.classList.contains('case-projection-body'))return;
  setTimeout(()=>{if(root.childElementCount||root.textContent.trim())return;root.innerHTML='<div class="native-loading-shell"><div class="native-skeleton sk-title"></div><div class="native-skeleton sk-sub"></div><div class="native-skeleton sk-hero"></div><div class="native-sk-grid"><div class="native-skeleton"></div><div class="native-skeleton"></div><div class="native-skeleton"></div></div></div>'},110);
}
async function init(){
  document.documentElement.classList.add('native-v10');
  wireTheme();wireNetwork();wireHistory();wirePrefetch();wireWakeLock();wireNativeCenter();wireContextMenu();wireBadge();wireSkeleton();await registerSW();
}
init();
