import { rpc, isConfigured, studentMe, loadStudentAuth } from './supabase-client.js';
import { $, qs, playerStore, toast, esc, configWarning, modeLabel } from './common.js';
import { avatarMarkup } from './avatar.js';

const root=$('#root');
let code=(qs('code')||'').toUpperCase();
let student=null,studentAuth=null,currentPreview=null;

const MODE_JOIN={
  class:{icon:'◉',tag:'MODE CLASSE',text:'Quiz classique : points individuels, vitesse et séries.'},
  battle:{icon:'⚡',tag:'BATTLE',text:'Tu seras automatiquement placé dans l’équipe Bleu ou Or pour garder des équipes équilibrées.'},
  revision:{icon:'↻',tag:'RÉVISION',text:'Pas de pression de vitesse ni de classement. L’objectif est de comprendre chaque correction.'},
  bts:{icon:'BTS',tag:'MODE EXAMEN',text:'Simulation stricte : pas de correction entre les questions. Ton résultat arrive à la fin.'},
  duel:{icon:'VS',tag:'DUEL',text:'Face-à-face à deux joueurs. Une manche va au joueur correct le plus rapide.'}
};
function modeJoin(mode){return MODE_JOIN[mode]||MODE_JOIN.class}
function loginNext(){return encodeURIComponent(`join.html${code?`?code=${encodeURIComponent(code)}`:''}`)}

function previewCard(preview){
  if(!preview)return '<div class="join-preview-placeholder">Entre le code à 5 caractères pour afficher les règles de la session.</div>';
  const m=modeJoin(preview.mode);
  return `<div class="join-mode-preview mode-${esc(preview.mode)}"><span class="join-mode-symbol">${m.icon}</span><div><small>${m.tag}</small><b>${esc(preview.title)}</b><p>${m.text}</p><span>${preview.players} connecté${preview.players>1?'s':''}${preview.mode==='duel'?` • ${Math.max(0,2-preview.players)} place${Math.max(0,2-preview.players)>1?'s':''} restante${Math.max(0,2-preview.players)>1?'s':''}`:''}</span></div></div>`;
}
function identityBlock(){
  if(student)return `<div class="student-live-identity"><div class="student-admin-avatar vector-avatar">${avatarMarkup(student.avatar||{},'avatar-svg avatar-admin-svg',`Avatar de ${student.displayName}`)}</div><div><span>Tu rejoins en tant que</span><b>${esc(student.displayName)}</b><small>${esc(student.className||'BTS MCO')}</small></div></div>`;
  return `<label class="muted" for="name">Ton pseudo</label><input id="name" maxlength="24" placeholder="TeamNCR 🚀"><div class="join-account-choice"><span>Tu as un compte élève ?</span><a href="./student-login.html?next=${loginNext()}">Se connecter</a></div>`;
}
function view(){
  root.innerHTML=`<div class="join-wrap premium-join"><section class="join-brand premium-join-brand"><img src="./assets/icons/icon-192.png" alt=""><span class="join-brand-live">LIVE CLASSROOM</span><h1>Rejoins le Quiz Arena !</h1><p>Scanne le QR du professeur ou saisis le code de session. Le mode de jeu s’affiche avant de rejoindre.</p><div class="eyebrow" style="background:rgba(255,255,255,.12);color:#fff">NCR SOLUTIONS BTS MCO</div></section><section class="join-panel"><div class="join-card premium-join-card"><div class="join-lock">● LIVE</div><h2>Rejoindre une partie</h2><p class="muted">Code affiché sur l’écran de projection.</p>${!isConfigured?configWarning():''}<label class="muted" for="code">Code de partie</label><input id="code" maxlength="5" value="${esc(code)}" placeholder="7B3K2" autocomplete="off" inputmode="text" style="text-transform:uppercase;letter-spacing:.18em;font-weight:900;text-align:center"><div id="preview">${previewCard(currentPreview)}</div>${identityBlock()}<button class="btn primary join-main-cta" id="join" style="width:100%" ${currentPreview?.status==='ended'?'disabled':''}>${currentPreview?.status==='ended'?'Session terminée':currentPreview?.status&&currentPreview.status!=='lobby'?'Rejoindre la session en cours':student?'Rejoindre avec mon compte':'Rejoindre en invité'}</button><div class="toolbar"><a class="btn soft" href="./index.html" style="width:100%">Retour à l’accueil</a></div></div></section></div>`;
  wire();
}
async function loadPreview(repaint=true){
  if(!isConfigured||code.length!==5){currentPreview=null;if(repaint)view();return null}
  try{currentPreview=await rpc('mco_session_preview',{p_code:code});if(repaint)view();return currentPreview}catch(e){currentPreview=null;if(repaint){view();toast(e.message,'bad')}return null}
}
function wire(){
  const codeEl=$('#code');
  codeEl.oninput=()=>{code=codeEl.value.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,5);codeEl.value=code;if(code.length<5){currentPreview=null;const p=$('#preview');if(p)p.innerHTML=previewCard(null)}};
  codeEl.onblur=async()=>{if(code.length===5)await loadPreview(true)};
  codeEl.onkeydown=e=>{if(e.key==='Enter'&&code.length===5){e.preventDefault();loadPreview(true)}};
  $('#join').onclick=join;
}
async function join(){
  if(!isConfigured){toast('Configure d’abord Supabase dans config.js','bad');return}
  code=$('#code').value.trim().toUpperCase();
  if(code.length!==5){toast('Code de partie requis','bad');return}
  if(!currentPreview||currentPreview.code!==code){const p=await loadPreview(false);if(!p){toast('Partie introuvable','bad');return}}
  if(currentPreview.status==='ended'){toast('Cette session est terminée','bad');return}
  try{
    $('#join').disabled=true;
    let data;
    if(student&&studentAuth?.token){
      data=await rpc('mco_join_session_student',{p_code:code,p_student_token:studentAuth.token,p_team:null});
    }else{
      const name=$('#name')?.value.trim();if(!name){toast('Pseudo requis','bad');$('#join').disabled=false;return}
      data=await rpc('mco_join_session',{p_code:code,p_name:name,p_team:null});
    }
    playerStore(code,{playerId:data.playerId,playerToken:data.playerToken,name:data.name||student?.displayName,avatar:data.avatar||student?.avatar||null,team:data.team||null,mode:data.mode||currentPreview?.mode||'class'});
    location.href=`./play.html?code=${encodeURIComponent(code)}`;
  }catch(e){toast(e.message,'bad');$('#join').disabled=false}
}
async function boot(){
  student=await studentMe();studentAuth=loadStudentAuth();
  if(code.length===5)await loadPreview(false);
  view();
}
boot();
