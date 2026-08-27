import { rpc, isConfigured, liveChannel } from './supabase-client.js';
import { $, qs, playerLoad, esc, toast, uiIcon, modeLabel } from './common.js';
import { avatarMarkup } from './avatar.js';
import { playerInputHtml, bindPlayerInput, hasPlayerResponse, correctionResponseHtml, mediaHtml } from './question-ui.js';

const root=$('#root');
const code=(qs('code')||'').toUpperCase();
const auth=playerLoad(code);
let session=null,channel=null,poller=null,timer=null,last='',questionShownAt=Date.now();

const MODE_COPY={
  class:{tag:'MODE CLASSE',title:'Prêt à jouer ?',desc:'Bonne réponse + rapidité + séries = maximum de points.',icon:'◉'},
  battle:{tag:'BATTLE',title:'Ton équipe compte sur toi.',desc:'Chaque point que tu gagnes s’ajoute au score collectif.',icon:'⚡'},
  revision:{tag:'RÉVISION',title:'Prends le temps de comprendre.',desc:'Pas de chrono ni de podium. Chaque correction sert à progresser.',icon:'↻'},
  bts:{tag:'MODE BTS',title:'Conditions examen.',desc:'Réponds sans correction intermédiaire. Ton bilan arrive à la fin.',icon:'BTS'},
  duel:{tag:'DUEL',title:'Face-à-face.',desc:'Une manche va au joueur correct le plus rapide.',icon:'VS'}
};
function mcopy(){return MODE_COPY[session?.mode]||MODE_COPY.class}
function shell(content){root.innerHTML=content}
function myBoard(){return (session?.leaderboard||[]).find(x=>x.id===session?.player?.id)||null}
function opponent(){return (session?.players||[]).find(x=>x.id!==session?.player?.id)||null}
function myTeam(){return (session?.teamLeaderboard||[]).find(x=>x.team===session?.player?.team)||null}
function teamBoard(){const teams=session?.teamLeaderboard||[];return `<div class="student-team-score">${teams.map(t=>`<div class="student-team team-${String(t.team||'').toLowerCase()}"><span>${esc(t.team)}</span><strong>${Number(t.score||0).toLocaleString('fr-FR')}</strong><small>pts équipe</small></div>`).join('<b class="team-vs">VS</b>')}</div>`}
function liveHeader(label,sub){const av=session.player?.avatar||auth?.avatar;return `<header class="player-live-top"><a href="./index.html" class="player-live-brand"><img src="./assets/icons/icon-64.png" alt=""><span><b>${esc(label)}</b><small>${esc(sub)}</small></span></a><div class="player-live-chip">${av?avatarMarkup(av,'avatar-svg avatar-game-svg',`Avatar de ${session.player?.name||''}`):''}<span>${esc(session.player?.name||'Élève')}</span></div></header>`}

function lobby(){
  clearInterval(timer);const av=session.player?.avatar||auth?.avatar,m=mcopy();let special='';
  if(session.mode==='battle')special=`<div class="player-mode-special">${teamBoard()}<p>Tu joues dans <b>l’équipe ${esc(session.player?.team||'—')}</b>.</p></div>`;
  else if(session.mode==='duel'){const o=opponent();special=`<div class="student-duel-lobby"><div><b>${esc(session.player?.name||'Toi')}</b><span>${session.player?.score||0}</span></div><strong>VS</strong><div><b>${o?esc(o.name):'En attente…'}</b><span>${o?.score||0}</span></div></div>`}
  else special=`<div class="player-mode-special solo-mode"><span>${m.icon}</span><p>${m.desc}</p></div>`;
  shell(`<div class="player-live-shell mode-player-${session.mode}">${liveHeader('MCO Quiz Arena',`${m.tag} • ${code}`)}<main class="player-lobby-v7"><div class="player-lobby-orbit"></div>${av?`<div class="live-avatar-hero">${avatarMarkup(av,'avatar-svg live-avatar-svg',`Avatar de ${session.player?.name||''}`)}</div>`:'<img src="./assets/icons/icon-192.png" alt="">'}<div class="section-kicker">${m.tag}</div><h1>${m.title}</h1><p>${m.desc}</p>${special}<div class="player-lobby-stats"><span>${uiIcon('users')}<b>${session.players.length}</b><small>connecté${session.players.length>1?'s':''}</small></span><span>${uiIcon('live')}<b>${code}</b><small>code de session</small></span></div><div class="player-wait-line"><i></i><span>En attente du professeur…</span></div></main></div>`);
}
function startTimer(){
  clearInterval(timer);if(session.mode==='revision')return;
  let left=session.secondsRemaining??session.settings.timerSeconds;const el=$('#playerTimer');
  timer=setInterval(()=>{left--;if(el)el.textContent=Math.max(0,left)+'s';if(left<=0){clearInterval(timer);document.querySelectorAll('.response-control').forEach(b=>b.disabled=true)}},1000);
}
function statusStrip(){
  if(session.mode==='battle'){const t=myTeam();return `<div class="player-mode-strip battle"><span>Équipe ${esc(session.player?.team||'—')}</span><strong>${Number(t?.score||0).toLocaleString('fr-FR')} pts</strong></div>`}
  if(session.mode==='duel'){const o=opponent();return `<div class="player-mode-strip duel"><span>TOI <b>${session.player?.score||0}</b></span><strong>VS</strong><span><b>${o?.score||0}</b> ${o?esc(o.name):'?'}</span></div>`}
  if(session.mode==='revision')return `<div class="player-mode-strip revision"><span>RÉVISION</span><strong>${session.player?.correctCount||0} bonne${session.player?.correctCount>1?'s':''} réponse${session.player?.correctCount>1?'s':''}</strong></div>`;
  if(session.mode==='bts')return `<div class="player-mode-strip bts"><span>SIMULATION BTS</span><strong>${session.currentIndex+1}/${session.totalQuestions}</strong></div>`;
  return `<div class="player-mode-strip class"><span>Score <b>${session.player?.score||0} pts</b></span><span>Série <b>${session.player?.streak||0}</b></span></div>`;
}
function question(){
  questionShownAt=Date.now();const q=session.question,answered=hasPlayerResponse(session.player),m=mcopy();
  const timerHtml=session.mode==='revision'?`<div class="player-timer no-timer">∞</div>`:`<div class="player-timer" id="playerTimer">${session.secondsRemaining??session.settings.timerSeconds}s</div>`;
  shell(`<div class="player-live-shell mode-player-${session.mode}">${liveHeader(`${q.subject} • ${q.chapter}`,`${m.tag} • QUESTION ${session.currentIndex+1}/${session.totalQuestions}`)}<main class="player-question-v7"><div class="player-question-progress"><i style="width:${(session.currentIndex+1)/session.totalQuestions*100}%"></i></div>${statusStrip()}<div class="player-question-headline"><div class="player-question-index">LEÇON ${esc(q.lesson)} • QUESTION ${session.currentIndex+1}</div>${timerHtml}</div><h1>${esc(q.prompt)}</h1>${mediaHtml(q,'player')}${playerInputHtml(q,{answered,response:session.player?.response})}<div id="sent" class="player-sent ${answered?'':'hidden'}">${uiIcon('spark')}<span>${session.mode==='bts'?'Réponse enregistrée. La correction arrivera à la fin.':'Réponse envoyée. Attends la suite.'}</span></div>${session.mode==='revision'?'<div class="player-no-pressure">Aucun bonus de vitesse • prends le temps de réfléchir</div>':''}</main></div>`);
  bindPlayerInput(document,payload=>sendResponse(payload));startTimer();
}
function reveal(){
  clearInterval(timer);const q=session.question,ok=session.player?.correct===true,m=mcopy();let special='';
  if(session.mode==='battle')special=teamBoard();
  else if(session.mode==='duel'){const win=session.duel?.roundWinnerName;special=`<div class="duel-round-student ${win===session.player?.name?'won':win?'lost':'tie'}"><span>${win?`${esc(win)} remporte la manche`:'Manche nulle'}</span>${statusStrip()}</div>`}
  else if(session.mode==='revision'){const total=Number(session.currentStats?.correct||0)+Number(session.currentStats?.wrong||0),pct=total?Math.round(Number(session.currentStats.correct)/total*100):0;special=`<div class="revision-class-pulse"><strong>${pct}%</strong><span>de la classe a trouvé la bonne réponse</span></div>`}
  shell(`<div class="player-live-shell mode-player-${session.mode}">${liveHeader('Correction',`${m.tag} • ${q.subject} • ${q.chapter}`)}<main class="player-question-v7 player-correction-v7"><div class="player-result-banner ${ok?'success':'retry'}"><span>${ok?'✓':'↻'}</span><div><small>${ok?'BONNE RÉPONSE':'À RETENIR'}</small><h2>${ok?'Bien joué !':'Regarde surtout pourquoi.'}</h2></div></div>${special}<div class="player-question-index">QUESTION ${session.currentIndex+1}</div><h1>${esc(q.prompt)}</h1>${mediaHtml(q,'player')}${correctionResponseHtml(q,session.correctResponse,session.correctAnswer)}<section class="player-explanation"><span>EXPLICATION</span><p>${esc(session.explanation||'')}</p></section><div class="player-footer-stats"><span>${session.mode==='revision'?'Maîtrise':session.mode==='duel'?'Duel':session.mode==='battle'?'Équipe':'Ton score'} <b>${session.mode==='revision'?`${session.player?.correctCount||0}/${session.currentIndex+1}`:session.mode==='duel'?`${session.player?.score||0} manche${session.player?.score>1?'s':''}`:session.mode==='battle'?`${Number(myTeam()?.score||0).toLocaleString('fr-FR')} pts`:`${session.player?.score||0} pts`}</b></span><span>Attends la question suivante…</span></div></main></div>`);
}
function standardRanking(){return `<section class="player-final-board"><div class="panel-title-row"><div><span class="section-kicker">CLASSEMENT</span><h3>Top 10</h3></div></div><div class="leaderboard">${(session.leaderboard||[]).slice(0,10).map(r=>`<div class="rank avatar-rank ${r.id===session.player?.id?'is-me':''}"><div class="place">${r.rank}</div>${r.avatar?`<span class="rank-avatar">${avatarMarkup(r.avatar,'avatar-svg avatar-rank-svg',`Avatar de ${r.name}`)}</span>`:''}<b>${esc(r.name)}</b><strong>${r.score}</strong></div>`).join('')}</div></section>`}
function ended(){
  clearInterval(timer);const me=myBoard(),m=mcopy(),total=session.totalQuestions||1;let body='';
  if(session.mode==='battle'){
    const teams=session.teamLeaderboard||[],mine=myTeam(),winner=teams[0],won=mine&&winner&&mine.team===winner.team;
    body=`<div class="player-final-medal">${won?'⚡':'◎'}</div><span class="section-kicker">BATTLE TERMINÉ</span><h1>${won?'Ton équipe remporte le Battle !':'Battle terminé.'}</h1><p>Équipe <b>${esc(session.player?.team||'—')}</b> • ${Number(mine?.score||0).toLocaleString('fr-FR')} points</p>${teamBoard()}`;
  }else if(session.mode==='revision'){
    const c=Number(session.player?.correctCount||0),pct=Math.round(c/total*100);body=`<div class="player-final-medal">${pct>=80?'✓':'↻'}</div><span class="section-kicker">RÉVISION TERMINÉE</span><h1>${pct>=80?'Notion bien maîtrisée.':'Continue à consolider.'}</h1><p><b>${c}/${total}</b> bonnes réponses • <b>${pct}%</b> de maîtrise</p><div class="student-mastery-ring" style="--pct:${pct}"><strong>${pct}%</strong></div>`;
  }else if(session.mode==='bts'){
    const c=Number(session.player?.correctCount||0),pct=Math.round(c/total*100);body=`<div class="player-final-medal">BTS</div><span class="section-kicker">SIMULATION TERMINÉE</span><h1>Ton résultat : ${pct}%</h1><p><b>${c}/${total}</b> bonnes réponses. Aucun bonus de vitesse n’a été appliqué.</p><div class="student-exam-score"><strong>${c}</strong><span>/ ${total}</span><small>${pct}%</small></div>`;
  }else if(session.mode==='duel'){
    const o=(session.leaderboard||[]).find(x=>x.id!==session.player?.id),won=Number(me?.score||0)>Number(o?.score||0),tie=Number(me?.score||0)===Number(o?.score||0);body=`<div class="player-final-medal">VS</div><span class="section-kicker">DUEL TERMINÉ</span><h1>${tie?'Égalité parfaite !':won?'Duel remporté !':'Belle bataille.'}</h1><p><b>${me?.score||0}</b> manche${Number(me?.score||0)>1?'s':''} contre <b>${o?.score||0}</b>.</p><div class="student-duel-final"><div><b>${esc(session.player?.name||'Toi')}</b><strong>${me?.score||0}</strong></div><span>VS</span><div><b>${o?esc(o.name):'Adversaire'}</b><strong>${o?.score||0}</strong></div></div>`;
  }else{
    body=`<div class="player-final-medal">${me?.rank===1?'1':me?.rank===2?'2':me?.rank===3?'3':'#'+(me?.rank||'—')}</div>${session.player?.avatar?`<div class="player-final-avatar">${avatarMarkup(session.player.avatar,'avatar-svg live-avatar-svg',`Avatar de ${session.player?.name||''}`)}</div>`:''}<span class="section-kicker">TON RÉSULTAT</span><h1>${me?`${esc(me.name)}, tu termines ${me.rank}${me.rank===1?'er':'e'}.`:'Partie terminée'}</h1><p>Score final : <b>${me?.score||0} points</b></p>${standardRanking()}`;
  }
  shell(`<div class="player-live-shell mode-player-${session.mode}">${liveHeader('MCO Quiz Arena',`${m.tag} • SESSION TERMINÉE`)}<main class="player-ended-v7 mode-ended-player">${body}<div class="player-final-actions"><a class="btn primary" href="./join.html">Rejoindre un autre live</a><a class="btn soft" href="./student.html">Mon espace élève</a></div></main></div>`);
}
function render(){if(session.status==='lobby')lobby();else if(session.status==='ended')ended();else if(session.revealed||session.status==='reveal')reveal();else question()}
async function state(){session=await rpc('mco_session_state_v12_9',{p_code:code,p_teacher_key:null,p_player_id:auth.playerId,p_player_token:auth.playerToken});return session}
async function refresh(){
  try{await state();const teamKey=(session.teamLeaderboard||[]).map(x=>`${x.team}:${x.score}`).join('|');const key=`${session.status}-${session.currentIndex}-${session.revealed}-${JSON.stringify(session.player?.response||null)}-${session.player?.score}-${session.player?.correctCount}-${session.players.length}-${teamKey}-${session.duel?.roundWinnerName||''}`;if(key!==last){last=key;render()}}
  catch(e){shell(`<div class="waiting premium-waiting"><div><h1>Connexion perdue</h1><p class="muted">${esc(e.message)}</p><a class="btn primary" href="./join.html">Revenir</a></div></div>`);clearInterval(poller)}
}
async function sendResponse(payload){
  try{document.querySelectorAll('.response-control').forEach(b=>b.disabled=true);const elapsed=Math.max(0,Date.now()-questionShownAt);await rpc('mco_submit_response',{p_code:code,p_player_id:auth.playerId,p_player_token:auth.playerToken,p_response:payload,p_elapsed_ms:elapsed});await channel?.broadcast('answer');await refresh()}catch(e){toast(e.message,'bad');document.querySelectorAll('.response-control').forEach(b=>b.disabled=false)}
}
async function boot(){if(!isConfigured||!code||!auth){location.href='./join.html';return}try{await state();channel=liveChannel(code,refresh);poller=setInterval(refresh,1200);render()}catch{location.href='./join.html'}}
boot();
