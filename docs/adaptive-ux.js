/* MCO Quiz Arena V11 — Adaptive UX runtime
   Progressive enhancement only. No backend/data contract changes. */
const V11={focusKey:'mco_v11_focus',pop:null};
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];

function bootClass(){
  document.documentElement.classList.add('v11-adaptive');
  if(document.body.classList.contains('teacher-body')&&new URLSearchParams(location.search).get('code'))document.body.classList.add('v11-live-mode');
  if(localStorage.getItem(V11.focusKey)==='1')document.documentElement.classList.add('v11-focus-mode');
}

function wireFocus(){
  if(!document.body.classList.contains('teacher-body'))return false;
  const actions=$('.teacher-utility-actions');
  if(actions&&!$('#v11FocusToggle')){
    const b=document.createElement('button');b.id='v11FocusToggle';b.type='button';b.className='v11-focus-toggle';b.innerHTML='<span aria-hidden="true">◎</span><span>Mode cours</span>';
    b.title='Réduire l’interface pour enseigner';actions.insertBefore(b,actions.firstChild);
    b.addEventListener('click',()=>{const on=!document.documentElement.classList.contains('v11-focus-mode');document.documentElement.classList.toggle('v11-focus-mode',on);localStorage.setItem(V11.focusKey,on?'1':'0');b.querySelector('span:last-child').textContent=on?'Quitter focus':'Mode cours'});
    if(document.documentElement.classList.contains('v11-focus-mode'))b.querySelector('span:last-child').textContent='Quitter focus';
  }
  return !!actions;
}

function viewTransitions(){
  const reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
  const crossDocument=('onpageswap' in window)||('onpagereveal' in window);

  // Keep the app chrome visually anchored while only the working area changes.
  $('.v8-brand-lockup img,.student-brand img,.projection-brand img')?.style.setProperty('view-transition-name','mco-app-icon');
  $('.v8-brand-lockup span,.student-brand span')?.style.setProperty('view-transition-name','mco-brand-copy');
  $('.v8-sidebar')?.style.setProperty('view-transition-name','mco-sidebar');
  $('.v8-utility,.v8-student-topbar')?.style.setProperty('view-transition-name','mco-topbar');
  $('#root')?.style.setProperty('view-transition-name','mco-page-content');
  const av=$('.student-mini-avatar,.v8-avatar-render,.v11-student-avatar');if(av)av.style.setProperty('view-transition-name','mco-student-avatar');

  // Morph the selected section instead of flashing a brand-new active state.
  let active=null;
  if(document.body.classList.contains('teacher-body'))active=$('.v8-side-nav a.active');
  else if(document.body.classList.contains('student-body'))active=matchMedia('(max-width:900px)').matches?$('.student-mobile-dock a.active'):$('.v8-student-nav a.active');
  active?.style.setProperty('view-transition-name','mco-active-section');

  // Fallback for browsers without cross-document View Transitions: a very short
  // opacity/translate handoff removes the raw white flash without making navigation slow.
  if(!crossDocument&&!reduced){
    document.documentElement.classList.add('mco-route-fallback');
    requestAnimationFrame(()=>requestAnimationFrame(()=>document.documentElement.classList.add('mco-route-ready')));
    document.addEventListener('click',e=>{
      if(e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
      const a=e.target.closest?.('a[href]');if(!a||a.target==='_blank'||a.hasAttribute('download'))return;
      let u;try{u=new URL(a.href,location.href)}catch{return}
      if(u.origin!==location.origin||u.href===location.href||u.hash&&u.pathname===location.pathname&&u.search===location.search)return;
      if(!/\.html$|\/$/.test(u.pathname))return;
      e.preventDefault();
      document.documentElement.classList.add('mco-route-leaving');
      setTimeout(()=>location.href=u.href,90);
    },true);
  }

  // Same-document anchors keep the same continuity.
  document.addEventListener('click',e=>{
    const a=e.target.closest?.('a[href^="#"]');if(!a)return;const id=a.getAttribute('href').slice(1);const target=id&&document.getElementById(id);if(!target)return;e.preventDefault();
    const go=()=>target.scrollIntoView({behavior:reduced?'auto':'smooth',block:'start'});
    if(document.startViewTransition&&!reduced)document.startViewTransition(go);else go();
    history.replaceState(null,'',`#${id}`);
  });
}

function contentProgress(){
  const reading=document.body.classList.contains('student-body')&&(/lesson\.html$/.test(location.pathname)||/student-revisions\.html$/.test(location.pathname));
  if(!reading)return;
  const bar=document.createElement('div');bar.className='v11-reading-progress';bar.setAttribute('aria-hidden','true');bar.innerHTML='<i></i>';document.body.appendChild(bar);
  const fill=bar.firstElementChild;
  const update=()=>{const max=Math.max(1,document.documentElement.scrollHeight-innerHeight);fill.style.transform=`scaleX(${Math.max(0,Math.min(1,scrollY/max))})`};
  addEventListener('scroll',update,{passive:true});addEventListener('resize',update,{passive:true});update();
}

function motionFeedback(){
  if(matchMedia('(prefers-reduced-motion:reduce)').matches)return;
  document.addEventListener('pointerdown',e=>{const el=e.target.closest?.('.btn,.mode-btn,.v8-lesson-row,.v11-current-card,.v11-action-link,.student-mobile-dock a');if(!el)return;el.animate([{transform:'scale(1)'},{transform:'scale(.982)'},{transform:'scale(1)'}],{duration:180,easing:'cubic-bezier(.2,.8,.2,1)'})},{passive:true});
  const observer=new MutationObserver(records=>{
    const seen=new Set();for(const rec of records)for(const node of rec.addedNodes){if(!(node instanceof HTMLElement)||seen.has(node))continue;seen.add(node);if(node.matches?.('.v8-answer.correct,.projection-answer.correct,.rank:first-child,.v8-current-lesson,.v11-current-card'))node.animate([{opacity:.65,transform:'translateY(5px) scale(.99)'},{opacity:1,transform:'none'}],{duration:300,easing:'cubic-bezier(.2,.8,.2,1)'});}
  });observer.observe(document.body,{childList:true,subtree:true});
}

function scrollAwareChrome(){
  let last=scrollY;const header=$('.v8-utility,.v8-student-topbar');if(!header)return;
  addEventListener('scroll',()=>{const y=scrollY;header.classList.toggle('v11-scrolled',y>12);if(document.body.classList.contains('student-body')&&innerWidth<900)header.classList.toggle('v11-hide-chrome',y>last&&y>90);last=y},{passive:true});
}

function contextualMenus(){
  if(!matchMedia('(hover:hover) and (pointer:fine)').matches)return;
  const close=()=>{V11.pop?.remove();V11.pop=null};
  document.addEventListener('click',e=>{
    const trigger=e.target.closest?.('[data-v11-more]');if(!trigger){if(V11.pop&&!e.target.closest('.v11-popover'))close();return}
    e.preventDefault();e.stopPropagation();close();
    const href=trigger.dataset.href||trigger.closest('a')?.href||'';
    const pop=document.createElement('div');pop.className='v11-popover';pop.innerHTML=`${href?`<a href="${href}">Ouvrir</a><button type="button" data-new>Ouvrir dans un nouvel onglet</button><button type="button" data-copy>Copier le lien</button>`:'<button type="button" disabled>Aucune action disponible</button>'}`;document.body.appendChild(pop);V11.pop=pop;
    const r=trigger.getBoundingClientRect(),w=230;pop.style.left=`${Math.max(8,Math.min(innerWidth-w-8,r.right-w))}px`;pop.style.top=`${Math.min(innerHeight-160,r.bottom+7)}px`;
    pop.querySelector('[data-new]')?.addEventListener('click',()=>window.open(href,'_blank','noopener'));
    pop.querySelector('[data-copy]')?.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(href)}catch{}close()});
  });
  addEventListener('resize',close,{passive:true});addEventListener('scroll',close,{passive:true});
}

function emptyStatePolish(){
  const observer=new MutationObserver(()=>{
    $$('.notice').forEach(n=>{if(!n.dataset.v11&&/aucun|vide|pas encore|indisponible/i.test(n.textContent||'')){n.dataset.v11='1';n.classList.add('v11-empty-notice')}});
  });observer.observe(document.body,{childList:true,subtree:true});
}

function liveKeyboardHint(){
  if(!document.body.classList.contains('teacher-body')||!document.body.classList.contains('v11-live-mode'))return false;
  const utility=$('.v8-utility-page');if(utility&&!utility.querySelector('.v11-live-pill'))utility.insertAdjacentHTML('afterbegin','<span class="v11-live-pill"><i></i> LIVE</span>');
  return !!utility;
}
function lateDecorations(){wireFocus();liveKeyboardHint();viewTransitions()}

function init(){bootClass();lateDecorations();contentProgress();motionFeedback();scrollAwareChrome();contextualMenus();emptyStatePolish();const late=new MutationObserver(()=>lateDecorations());late.observe(document.body,{childList:true,subtree:true});setTimeout(()=>late.disconnect(),6000)}
init();
