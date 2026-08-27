import { rpc, liveChannel, isConfigured } from './supabase-client.js';
import { localLiveChannel } from './native-live.js';
import { $, qs, esc } from './common.js';
import { avatarMarkup } from './avatar.js';
import { displayResponseHtml, correctResponseText, mediaHtml } from './question-ui.js';

const root=$('#root');
const code=(qs('code')||'').toUpperCase();
let state=null,channel=null,localChannel=null,poller=null,timer=null,last='';
const nf=new Intl.NumberFormat('fr-FR');
const MODE={
  class:{tag:'MODE CLASSE',title:'Quiz en direct',icon:'◉'},
  battle:{tag:'BATTLE',title:'Équipe Bleu vs Équipe Or',icon:'⚡'},
  revision:{tag:'RÉVISION',title:'On comprend avant de courir',icon:'↻'},
  bts:{tag:'MODE BTS',title:'Simulation examen',icon:'BTS'},
  duel:{tag:'DUEL',title:'Face-à-face',icon:'VS'}
};
function m(){return MODE[state?.mode]||MODE.class}
function joinUrl(){const u=new URL('./join.html',location.href);u.searchParams.set('code',code);return u.href}
async function drawQr(sel='#projectionQr',size=250){const el=$(sel);if(!el)return;try{const mod=await import('https://cdn.jsdelivr.net/npm/qrcode@1.5.4/+esm');const QR=mod.default||mod;const canvas=document.createElement('canvas');await QR.toCanvas(canvas,joinUrl(),{width:size,margin:1,color:{dark:'#071A3C',light:'#FFFFFF'}});el.innerHTML='';el.appendChild(canvas)}catch{el.innerHTML=`<div class="qr-fallback">${esc(joinUrl())}</div>`}}
function shell(inner,contentOnly=false){root.innerHTML=`<div class="projection-shell ${contentOnly?'v11-content-only':''} projection-mode-${state?.mode||'class'}"><header class="projection-top"><div class="projection-brand"><img src="./assets/icons/icon-96.png"><div><b>MCO Quiz Arena</b><small>${m().tag}</small></div></div><div class="projection-code">CODE <strong>${code}</strong></div></header>${inner}</div>`}
function teamScore(){const teams=state.teamLeaderboard||[];return `<div class="projection-team-score">${teams.map(t=>`<article class="team-${String(t.team||'').toLowerCase()}"><span>ÉQUIPE ${esc(String(t.team||'').toUpperCase())}</span><strong>${nf.format(Number(t.score)||0)}</strong><small>${t.players} joueur${Number(t.players)>1?'s':''}</small></article>`).join('<div class="projection-vs">VS</div>')}</div>`}
function duelScore(){const b=(state.leaderboard||[]).slice(0,2);return `<div class="projection-duel-score">${[0,1].map(i=>{const r=b[i];return r?`<article>${avatarFor(r,'projection-duel-avatar')}<b>${esc(r.name)}</b><strong>${Number(r.score)||0}</strong><small>manche${Number(r.score)>1?'s':''}</small></article>`:`<article class="waiting"><span>?</span><b>En attente</b></article>`}).join('<div class="projection-vs">VS</div>')}</div>`}
function lobby(){
  clearInterval(timer);const mm=m();let special='';
  if(state.mode==='battle')special=`<div class="projection-lobby-mode-special">${teamScore()}<p>Les équipes sont équilibrées automatiquement au moment où les élèves rejoignent.</p></div>`;
  else if(state.mode==='duel')special=`<div class="projection-lobby-mode-special">${duelScore()}<p>Deux places seulement. Le plus rapide des bonnes réponses gagne la manche.</p></div>`;
  else if(state.mode==='revision')special='<div class="projection-lobby-mode-special message"><strong>Sans chrono • sans podium</strong><p>Chaque question est suivie d’une correction pédagogique collective.</p></div>';
  else if(state.mode==='bts')special='<div class="projection-lobby-mode-special message"><strong>Simulation stricte</strong><p>Aucune correction n’apparaît entre les questions. Les résultats arrivent à la fin.</p></div>';
  shell(`<main class="projection-lobby"><div class="projection-lobby-copy"><div class="eyebrow light">${mm.icon} ${mm.tag}</div><h1>${mm.title}</h1><p>Scanne le QR code ou saisis <b>${code}</b> sur ton téléphone.</p><div class="projection-joined">👥 ${state.playerCount} élève${state.playerCount>1?'s':''} connecté${state.playerCount>1?'s':''}</div>${special}</div><div class="projection-qr-card"><div id="projectionQr"></div><span>Scanne pour rejoindre</span></div></main>`);drawQr();
}
function startTimer(){clearInterval(timer);if(state.status!=='question'||state.mode==='revision')return;let left=state.secondsRemaining||20;const el=$('#projectionTimer');timer=setInterval(()=>{left--;if(el)el.textContent=Math.max(0,left)+'s';if(left<=0)clearInterval(timer)},1000)}
function modeTop(){
  if(state.mode==='battle')return teamScore();
  if(state.mode==='duel')return duelScore();
  if(state.mode==='revision')return '<div class="projection-mode-ribbon revision">↻ RÉVISION • PRENDS LE TEMPS DE RÉFLÉCHIR</div>';
  if(state.mode==='bts')return '<div class="projection-mode-ribbon bts">BTS • SIMULATION EXAMEN • CORRECTION À LA FIN</div>';
  return '';
}
function question(){
  const q=state.question,revealed=state.revealed||state.status==='reveal';const totalAns=Number(state.currentStats?.correct||0)+Number(state.currentStats?.wrong||0);const pct=revealed&&totalAns?Math.round(Number(state.currentStats.correct)/totalAns*100):0;
  const timer=state.mode==='revision'?'<div class="projection-timer no-timer">∞</div>':`<div class="projection-timer" id="projectionTimer">${state.secondsRemaining}s</div>`;
  shell(`<main class="projection-question">${modeTop()}<div class="projection-meta"><div><span>${esc(q.subject)}</span><span>${esc(q.chapter)}</span><span>Leçon ${esc(q.lesson)}</span></div><div>Question ${state.currentIndex+1}/${state.totalQuestions}</div>${timer}</div><h1>${esc(q.prompt)}</h1>${mediaHtml(q,'projection')}${displayResponseHtml(q,{revealed,correctResponse:state.correctResponse,legacyCorrectAnswer:state.correctAnswer,variant:'projection'})}${revealed&&state.mode!=='bts'?`<div class="projection-correction"><div class="projection-correction-score"><strong>${pct}%</strong><span>de bonnes réponses</span></div><div><b>✅ Bonne réponse : ${esc(correctResponseText(q,state.correctResponse,state.correctAnswer))}</b><p>${esc(state.explanation||'')}</p>${state.mode==='duel'&&state.duel?.bothAnswered?`<strong class="duel-round-projection">${state.duel.roundWinnerName?`${esc(state.duel.roundWinnerName)} remporte la manche`:'Manche nulle'}</strong>`:''}</div></div>`:`<div class="projection-live-footer"><span>${state.mode==='bts'?'Réponses enregistrées':'Réponses reçues'}</span><strong>${state.responseCount}/${state.playerCount}</strong><div class="progress"><div style="width:${state.playerCount?state.responseCount/state.playerCount*100:0}%"></div></div></div>`}</main>`,true);startTimer();
}
function avatarFor(r,cls='projection-podium-avatar premium'){return r?.avatar?`<div class="${cls}">${avatarMarkup(r.avatar,'avatar-svg avatar-projection-svg',`Avatar de ${r.name}`)}</div>`:`<div class="${cls} fallback"><span>${esc((r?.name||'?').charAt(0).toUpperCase())}</span></div>`}
function confetti(){return `<div class="projection-confetti" aria-hidden="true">${Array.from({length:24},(_,i)=>`<i style="--i:${i}"></i>`).join('')}</div>`}
function rankCard(r,positionClass=''){if(!r)return '';const medal=r.rank===1?'🥇':r.rank===2?'🥈':'🥉';return `<article class="projection-rank-card ${positionClass} rank-${r.rank}"><div class="rank-medal">${medal}</div>${avatarFor(r)}<div class="rank-number">${r.rank}</div><b>${esc(r.name)}</b><strong>${nf.format(Number(r.score)||0)} pts</strong></article>`}
function topList(board){const rows=board.slice(3,10);if(!rows.length)return '';return `<section class="projection-toplist"><div class="projection-toplist-title"><span>CLASSEMENT</span><b>Top ${Math.min(10,board.length)}</b></div>${rows.map(r=>`<div class="projection-toprow"><span class="projection-toprank">${r.rank}</span>${avatarFor(r,'projection-list-avatar')}<b>${esc(r.name)}</b><strong>${nf.format(Number(r.score)||0)} pts</strong></div>`).join('')}</section>`}
function ended(){
  clearInterval(timer);const board=(state.leaderboard||[]).slice().sort((a,b)=>(Number(a.rank)||999)-(Number(b.rank)||999));const participants=Number(state.playerCount)||board.length,total=Number(state.totalQuestions)||1;
  if(state.mode==='battle'){
    const teams=state.teamLeaderboard||[],winner=teams[0];shell(`<main class="projection-ended premium-final mode-projection-final battle">${confetti()}<div class="final-kicker">⚡ BATTLE TERMINÉ</div><h1>${winner?`Équipe ${esc(winner.team)} victorieuse !`:'Battle terminé'}</h1><p class="final-subtitle">Score collectif • ${participants} participants</p>${teamScore()}<div class="projection-summary-metrics"><div><span>Participants</span><b>${participants}</b></div><div><span>Questions</span><b>${total}</b></div><div><span>Équipe gagnante</span><b>${winner?esc(winner.team):'—'}</b></div></div></main>`,true);return;
  }
  if(state.mode==='revision'||state.mode==='bts'){
    const avg=board.length?Math.round(board.reduce((s,r)=>s+Math.round(Number(r.correctCount||0)/total*100),0)/board.length):0;const title=state.mode==='revision'?'Révision terminée':'Simulation BTS terminée';const subtitle=state.mode==='revision'?'Maîtrise moyenne de la classe':'Résultat moyen de la classe';
    shell(`<main class="projection-ended premium-final mode-projection-final learning"><div class="final-kicker">${state.mode==='revision'?'↻ RÉVISION':'BTS • EXAMEN'}</div><h1>${title}</h1><p class="final-subtitle">${subtitle}</p><div class="projection-learning-score" style="--score:${avg}"><strong>${avg}%</strong><span>${state.mode==='revision'?'de maîtrise':'de réussite'}</span></div><div class="projection-summary-metrics"><div><span>Participants</span><b>${participants}</b></div><div><span>Questions</span><b>${total}</b></div><div><span>Moyenne</span><b>${avg}%</b></div></div></main>`,true);return;
  }
  if(state.mode==='duel'){
    const a=board[0],b=board[1],tie=a&&b&&Number(a.score)===Number(b.score);shell(`<main class="projection-ended premium-final mode-projection-final duel">${!tie?confetti():''}<div class="final-kicker">VS • DUEL TERMINÉ</div><h1>${tie?'Égalité parfaite !':a?`${esc(a.name)} remporte le Duel !`:'Duel terminé'}</h1><p class="final-subtitle">Le score correspond aux manches gagnées.</p>${duelScore()}</main>`,true);return;
  }
  const winner=board[0]||null,questions=Number(state.totalQuestions)||0,avg=board.length?Math.round(board.reduce((sum,r)=>sum+(Number(r.score)||0),0)/board.length):0;
  if(board.length===1){const r=board[0];shell(`<main class="projection-ended premium-final solo-final">${confetti()}<div class="final-kicker">QUIZ TERMINÉ <span>✦</span></div><h1>Champion de la session !</h1><p class="final-subtitle">${esc(state.title||'MCO Quiz Arena')} • Bravo pour cette session.</p><section class="champion-stage"><div class="champion-glow"></div><div class="champion-crown">🏆</div>${avatarFor(r,'projection-champion-avatar')}<div class="champion-name">${esc(r.name)}</div><div class="champion-score">${nf.format(Number(r.score)||0)} <span>pts</span></div><div class="champion-label">1re place</div></section><div class="projection-summary-metrics"><div><span>Participants</span><b>${participants}</b></div><div><span>Questions</span><b>${questions}</b></div><div><span>Score de la session</span><b>${nf.format(Number(r.score)||0)}</b></div></div></main>`,true);return}
  const first=board[0],second=board[1],third=board[2];const cards=board.length===2?`${rankCard(second,'second')}${rankCard(first,'first')}`:`${rankCard(second,'second')}${rankCard(first,'first')}${rankCard(third,'third')}`;
  shell(`<main class="projection-ended premium-final">${confetti()}<div class="final-kicker">QUIZ TERMINÉ <span>✦</span></div><h1>Bravo à tous !</h1><p class="final-subtitle">${winner?`Victoire de <b>${esc(winner.name)}</b> avec ${nf.format(Number(winner.score)||0)} points.`:'Session terminée.'}</p><section class="projection-podium premium-podium ${board.length===2?'two-players':''}">${cards}</section><div class="projection-summary-metrics"><div><span>Participants</span><b>${participants}</b></div><div><span>Questions</span><b>${questions}</b></div><div><span>Score moyen</span><b>${nf.format(avg)}</b></div></div>${topList(board)}</main>`,true);
}
function render(){if(state.status==='lobby')lobby();else if(state.status==='ended')ended();else question()}
async function refresh(){try{state=await rpc('mco_projection_state_v12_9',{p_code:code});const boardKey=(state.leaderboard||[]).map(r=>`${r.rank}:${r.score}`).join(',');const teamKey=(state.teamLeaderboard||[]).map(r=>`${r.team}:${r.score}`).join(',');const k=`${state.status}-${state.currentIndex}-${state.revealed}-${state.responseCount}-${state.playerCount}-${boardKey}-${teamKey}-${state.duel?.roundWinnerName||''}`;if(k!==last){last=k;render()}}catch(e){root.innerHTML=`<div class="waiting"><div><h1>Projection indisponible</h1><p>${esc(e.message)}</p></div></div>`}}
async function boot(){if(!isConfigured||code.length!==5){root.innerHTML='<div class="waiting"><div><h1>Code de partie requis</h1></div></div>';return}await refresh();channel=liveChannel(code,refresh);localChannel=localLiveChannel(code,refresh);poller=setInterval(refresh,900)}
boot();
