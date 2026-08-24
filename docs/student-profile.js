import { rpc, requireStudent, signOutStudent, saveStudentAuth, loadStudentAuth } from './supabase-client.js';
import { $, esc, studentTopbar, toast } from './common.js';
import { AVATAR_OPTIONS, normalizeAvatar, avatarMarkup, avatarSummary } from './avatar.js';

const root=$('#root');
let student=null,auth=null,avatar=null,dirty=false;

const GROUP_META={
  background:{title:'1. Univers',subtitle:'Choisis l’ambiance générale de ton avatar.',icon:'🌌'},
  accent:{title:'2. Lumière',subtitle:'Couleur des yeux et des détails lumineux.',icon:'💡'},
  face:{title:'3. Expression',subtitle:'Donne une personnalité à ton robot.',icon:'🙂'},
  hair:{title:'4. Coiffure',subtitle:'Courts, boucles, afro, mèches, queue haute…',icon:'💇'},
  hairColor:{title:'5. Couleur des cheveux',subtitle:'Choisis la teinte qui correspond à ton style.',icon:'🎨'},
  glasses:{title:'6. Lunettes',subtitle:'Soleil, miroir, rondes, aviateur, gaming…',icon:'😎'},
  hat:{title:'7. Chapeau',subtitle:'Casquette, bonnet, bob, diplômé, cow-boy…',icon:'🧢'},
  accessory:{title:'8. Signature',subtitle:'Éclair, couronne, casque ou style minimal.',icon:'⚡'},
  frame:{title:'9. Cadre',subtitle:'La finition premium autour de ton avatar.',icon:'✨'}
};

function groupHtml(key){
  const m=GROUP_META[key];
  return `<section class="avatar-option-group" data-avatar-group="${key}">
    <div class="avatar-option-head"><div class="avatar-group-title"><span class="avatar-group-icon">${m.icon}</span><div><span>${esc(m.title)}</span><small>${esc(m.subtitle)}</small></div></div></div>
    <div class="avatar-option-grid ${key==='hairColor'?'compact-swatches':''}" data-group="${key}">
      ${AVATAR_OPTIONS[key].map(o=>`<button type="button" class="avatar-option" data-group="${key}" data-value="${o.id}" aria-label="${esc(o.label)}"><span class="avatar-option-swatch ${['background','accent','hairColor'].includes(key)?'color-swatch':''}" data-avatar-swatch="${key}:${o.id}"></span><b>${esc(o.label)}</b></button>`).join('')}
    </div>
  </section>`;
}

function render(){
  avatar=normalizeAvatar(student.avatar||{});
  root.innerHTML=`<div class="student-shell">${studentTopbar({...student,avatar},'profile')}
    <main class="student-main profile-main avatar-studio-plus">
      <section class="profile-hero-card avatar-plus-hero">
        <div class="profile-preview-wrap">
          <div id="avatarPreview" class="profile-avatar-preview avatar-preview-premium">${avatarMarkup(avatar,'avatar-svg profile-avatar-svg',`Avatar de ${student.displayName}`)}</div>
          <div class="profile-preview-meta"><div class="eyebrow">MON AVATAR</div><h1>${esc(student.displayName)}</h1><p>${esc(student.className||'BTS MCO')}</p><small id="avatarSummary">${esc(avatarSummary(avatar))}</small></div>
        </div>
        <div class="profile-hero-copy"><div class="eyebrow light">AVATAR STUDIO+</div><h2>Ton robot.<br><span>Ton style.</span></h2><p>Personnalise ta coiffure, tes lunettes, ton chapeau et chaque détail de ton profil. Ton avatar te suit dans les lives, les classements et le podium.</p><div class="avatar-combo-pill">✨ Plus de 12 millions de combinaisons</div><button class="btn glass" id="randomAvatar" type="button">🎲 Surprends-moi</button></div>
      </section>

      <section class="avatar-studio avatar-studio-v56">
        <div class="avatar-studio-head"><div><div class="eyebrow">STUDIO AVATAR+</div><h2>Crée un avatar vraiment unique</h2><p>Les éléments sont construits en SVG : ils restent nets sur mobile, Retina et vidéoprojecteur.</p></div><div class="avatar-save-wrap"><span id="saveStatus">Toutes les modifications sont enregistrées.</span><button class="btn primary" id="saveAvatar" disabled>Enregistrer mon avatar</button></div></div>
        ${['background','accent','face','hair','hairColor','glasses','hat','accessory','frame'].map(groupHtml).join('')}
        <div class="avatar-compat-note"><b>💡 Astuce</b><span>Un chapeau peut remplacer certains accessoires de tête pour garder un rendu propre. L’éclair reste automatiquement adapté.</span></div>
        <div class="avatar-studio-footer"><a class="btn soft" href="./student.html">← Retour à mon espace</a><button class="btn primary" id="saveAvatarBottom" disabled>Enregistrer</button></div>
      </section>
    </main></div>`;
  paintSwatches();syncSelection();wire();
}

function paintSwatches(){
  document.querySelectorAll('[data-avatar-swatch]').forEach(el=>{
    const [g,v]=el.dataset.avatarSwatch.split(':');
    if(g==='background'){
      const o=AVATAR_OPTIONS.background.find(x=>x.id===v);el.style.background=`linear-gradient(135deg,${o.base},${o.soft})`;
    }else if(g==='accent'){
      const o=AVATAR_OPTIONS.accent.find(x=>x.id===v);el.style.background=o.color;
    }else if(g==='hairColor'){
      const o=AVATAR_OPTIONS.hairColor.find(x=>x.id===v);el.style.background=o.color;
    }else{
      el.innerHTML=avatarMarkup({...avatar,[g]:v},'avatar-mini-svg','');
    }
  });
}

function syncSelection(){
  document.querySelectorAll('.avatar-option').forEach(b=>b.classList.toggle('selected',avatar[b.dataset.group]===b.dataset.value));
  const p=$('#avatarPreview');if(p)p.innerHTML=avatarMarkup(avatar,'avatar-svg profile-avatar-svg',`Avatar de ${student.displayName}`);
  const s=$('#avatarSummary');if(s)s.textContent=avatarSummary(avatar);
  ['#saveAvatar','#saveAvatarBottom'].forEach(sel=>{const b=$(sel);if(b)b.disabled=!dirty});
  const st=$('#saveStatus');if(st)st.textContent=dirty?'Modifications non enregistrées':'Toutes les modifications sont enregistrées.';
}

function choose(group,value){
  avatar={...avatar,[group]:value};
  if(group==='hat' && value!=='none' && ['crown','cap','headphones'].includes(avatar.accessory)) avatar.accessory='none';
  if(group==='accessory' && ['crown','cap','headphones'].includes(value)) avatar.hat='none';
  dirty=true;paintSwatches();syncSelection();
}

function randomize(){
  const pick=(key)=>AVATAR_OPTIONS[key][Math.floor(Math.random()*AVATAR_OPTIONS[key].length)].id;
  avatar={
    background:pick('background'),accent:pick('accent'),face:pick('face'),hair:pick('hair'),hairColor:pick('hairColor'),
    glasses:pick('glasses'),hat:pick('hat'),accessory:pick('accessory'),frame:pick('frame')
  };
  if(avatar.hat!=='none' && ['crown','cap','headphones'].includes(avatar.accessory)) avatar.accessory=Math.random()>.5?'bolt':'none';
  dirty=true;paintSwatches();syncSelection();
}

function wire(){
  document.querySelectorAll('.avatar-option').forEach(b=>b.onclick=()=>choose(b.dataset.group,b.dataset.value));
  $('#randomAvatar').onclick=randomize;
  $('#saveAvatar').onclick=save;$('#saveAvatarBottom').onclick=save;
  $('#studentLogout').onclick=async()=>{await signOutStudent();location.href='./student-login.html'};
}

async function save(){
  try{
    ['#saveAvatar','#saveAvatarBottom'].forEach(sel=>{const b=$(sel);if(b)b.disabled=true});
    const saved=await rpc('mco_student_update_avatar',{p_token:auth.token,p_avatar:avatar});
    student={...student,avatar:saved};const a=loadStudentAuth();if(a?.token)saveStudentAuth({token:a.token,student});
    dirty=false;toast('Avatar enregistré ✨');render();
  }catch(e){toast(e.message,'bad');dirty=true;syncSelection()}
}

async function boot(){const r=await requireStudent();if(!r)return;student=r.student;auth=r.auth;render()}
boot();
