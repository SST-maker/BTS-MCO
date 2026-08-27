import { esc } from './common.js';

export function responseKind(q){return q?.responseKind||q?.response_kind||'single_choice'}
export function kindLabel(kind){return ({single_choice:'QCM',numeric:'Réponse numérique',short_text:'Réponse courte',ordering:'Classement',matching:'Association'}[kind]||'Question')}
export function hasPlayerResponse(player){return (player?.response!==null&&player?.response!==undefined)||(player?.answer!==null&&player?.answer!==undefined)}
function asItems(q){const raw=q?.responseConfig?.items||q?.choices||[];return raw.map((x,i)=>typeof x==='object'?{id:String(x.id??i),label:String(x.label??x.text??x.id??i)}:{id:String(i),label:String(x)})}
function matchingSides(q){const cfg=q?.responseConfig||{};const left=(cfg.left||[]).map((x,i)=>typeof x==='object'?{id:String(x.id??i),label:String(x.label??x.text??x.id??i)}:{id:String(i),label:String(x)});const right=(cfg.right||[]).map((x,i)=>typeof x==='object'?{id:String(x.id??i),label:String(x.label??x.text??x.id??i)}:{id:String(i),label:String(x)});return {left,right}}
function seededShuffle(items,seed='mco'){const out=[...items];let h=2166136261;for(const ch of String(seed)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}for(let i=out.length-1;i>0;i--){h=(Math.imul(h,1664525)+1013904223)>>>0;const j=h%(i+1);[out[i],out[j]]=[out[j],out[i]]}if(out.length>1&&out.every((x,i)=>x===items[i]))[out[0],out[1]]=[out[1],out[0]];return out}
function displayItems(q){return seededShuffle(asItems(q),`${q?.id||q?.prompt||'question'}:order`)}
function displayMatchingSides(q){const {left,right}=matchingSides(q);return {left,right:seededShuffle(right,`${q?.id||q?.prompt||'question'}:match`)}}
function safeMediaUrl(v=''){const u=String(v||'').trim();if(!u)return '';if(/^(https?:\/\/|\.\.?\/|\/|data:image\/)/i.test(u))return u;return ''}
export function mediaHtml(q,context='player'){
  const list=Array.isArray(q?.media)?q.media:[];if(!list.length)return '';
  const cards=list.map((m,i)=>{const kind=String(m?.kind||m?.type||'image').toLowerCase();const src=safeMediaUrl(m?.src||m?.url);const preview=safeMediaUrl(m?.preview||m?.thumbnail||m?.thumb);const alt=esc(m?.alt||m?.title||`Support ${i+1}`);const caption=m?.caption?`<figcaption>${esc(m.caption)}</figcaption>`:'';
    if(kind==='document'||kind==='pdf'){
      const shot=preview?`<img src="${esc(preview)}" alt="${alt}" loading="lazy">`:`<div class="media-document-icon">PDF</div>`;return `<figure class="question-media-card document">${shot}<div class="media-document-copy"><small>ANNEXE / DOCUMENT</small><b>${esc(m?.title||`Document ${i+1}`)}</b>${m?.caption?`<span>${esc(m.caption)}</span>`:''}${src?`<a href="${esc(src)}" target="_blank" rel="noopener">Ouvrir le document ↗</a>`:''}</div></figure>`;
    }
    if(!src)return '';return `<figure class="question-media-card ${esc(kind)}"><button class="question-media-open" type="button" data-media-open="${esc(src)}" aria-label="Agrandir le support"><img src="${esc(src)}" alt="${alt}" loading="lazy"></button>${caption}</figure>`;
  }).filter(Boolean).join('');if(!cards)return '';
  queueMicrotask(()=>document.querySelectorAll('[data-media-open]').forEach(b=>{if(b.dataset.mediaWired)return;b.dataset.mediaWired='1';b.onclick=()=>{const src=b.dataset.mediaOpen;const overlay=document.createElement('div');overlay.className='question-media-lightbox';overlay.innerHTML=`<button type="button" aria-label="Fermer">×</button><img src="${esc(src)}" alt="Support agrandi">`;overlay.onclick=e=>{if(e.target===overlay||e.target.tagName==='BUTTON')overlay.remove()};document.body.appendChild(overlay)}}));
  return `<section class="question-media-gallery media-${esc(context)}">${cards}</section>`;
}

export function playerInputHtml(q,{answered=false,response=null}={}){
  const k=responseKind(q),disabled=answered?'disabled':'';
  if(k==='numeric'){
    const unit=q?.responseConfig?.unit||'';const ph=q?.responseConfig?.placeholder||'Saisis ta réponse';const val=response?.value??'';
    return `<div class="enriched-response numeric-response"><div class="response-type-pill">123 • RÉPONSE NUMÉRIQUE</div><label>Ta réponse${unit?` (${esc(unit)})`:''}</label><div class="response-entry-row"><input class="response-control" data-response-value inputmode="decimal" autocomplete="off" placeholder="${esc(ph)}" value="${esc(val)}" ${disabled}><span>${esc(unit)}</span></div><button class="btn primary response-control" data-response-submit type="button" ${disabled}>Valider ma réponse</button></div>`;
  }
  if(k==='short_text'){
    const ph=q?.responseConfig?.placeholder||'Écris ta réponse';const val=response?.text??'';
    return `<div class="enriched-response text-response"><div class="response-type-pill">Aa • RÉPONSE COURTE</div><label>Ta réponse</label><input class="response-control" data-response-text maxlength="180" autocomplete="off" placeholder="${esc(ph)}" value="${esc(val)}" ${disabled}><button class="btn primary response-control" data-response-submit type="button" ${disabled}>Valider ma réponse</button></div>`;
  }
  if(k==='ordering'){
    const items=asItems(q);const ordered=response?.order?.length?response.order.map(id=>items.find(x=>x.id===String(id))).filter(Boolean):displayItems(q);
    return `<div class="enriched-response ordering-response"><div class="response-type-pill">↕ • REMETS DANS L’ORDRE</div><p>Déplace les éléments puis valide.</p><ol class="response-order-list" data-order-list>${ordered.map((x,i)=>`<li data-order-id="${esc(x.id)}"><span class="order-rank">${i+1}</span><b>${esc(x.label)}</b><div><button type="button" class="response-control order-move" data-move="up" ${disabled} aria-label="Monter">↑</button><button type="button" class="response-control order-move" data-move="down" ${disabled} aria-label="Descendre">↓</button></div></li>`).join('')}</ol><button class="btn primary response-control" data-response-submit type="button" ${disabled}>Valider l’ordre</button></div>`;
  }
  if(k==='matching'){
    const {left,right}=displayMatchingSides(q);const pairs=response?.pairs||{};
    return `<div class="enriched-response matching-response"><div class="response-type-pill">⇄ • ASSOCIE LES ÉLÉMENTS</div><div class="matching-grid">${left.map(x=>`<label><span>${esc(x.label)}</span><select class="response-control" data-match-left="${esc(x.id)}" ${disabled}><option value="">Choisir…</option>${right.map(r=>`<option value="${esc(r.id)}" ${String(pairs[x.id]??'')===r.id?'selected':''}>${esc(r.label)}</option>`).join('')}</select></label>`).join('')}</div><button class="btn primary response-control" data-response-submit type="button" ${disabled}>Valider les associations</button></div>`;
  }
  const choices=q?.choices||[];const selected=response?.index;
  return `<div class="answer-grid player-answer-grid">${choices.map((a,i)=>`<button class="answer-card ans${i} response-control ${Number(selected)===i?'selected':''}" data-response-choice="${i}" ${disabled}><div class="letter">${String.fromCharCode(65+i)}</div><div>${esc(a)}</div></button>`).join('')}</div>`;
}

export function bindPlayerInput(root,onSubmit){
  root.querySelectorAll('[data-response-choice]').forEach(b=>b.onclick=()=>onSubmit({index:Number(b.dataset.responseChoice)}));
  root.querySelectorAll('[data-move]').forEach(b=>b.onclick=()=>{const li=b.closest('li');const list=li?.parentElement;if(!li||!list)return;if(b.dataset.move==='up'&&li.previousElementSibling)list.insertBefore(li,li.previousElementSibling);if(b.dataset.move==='down'&&li.nextElementSibling)list.insertBefore(li.nextElementSibling,li);[...list.children].forEach((x,i)=>{const r=x.querySelector('.order-rank');if(r)r.textContent=i+1})});
  const submit=root.querySelector('[data-response-submit]');if(submit)submit.onclick=()=>{
    const numeric=root.querySelector('[data-response-value]');if(numeric){if(!numeric.value.trim())return;return onSubmit({value:numeric.value.trim()})}
    const text=root.querySelector('[data-response-text]');if(text){if(!text.value.trim())return;return onSubmit({text:text.value.trim()})}
    const list=root.querySelector('[data-order-list]');if(list)return onSubmit({order:[...list.querySelectorAll('[data-order-id]')].map(x=>x.dataset.orderId)});
    const matches=[...root.querySelectorAll('[data-match-left]')];if(matches.length){const pairs={};for(const s of matches){if(!s.value)return;pairs[s.dataset.matchLeft]=s.value}return onSubmit({pairs})}
  };
  root.querySelectorAll('[data-response-value],[data-response-text]').forEach(inp=>inp.addEventListener('keydown',e=>{if(e.key==='Enter'&&submit){e.preventDefault();submit.click()}}));
}

export function displayResponseHtml(q,{revealed=false,correctResponse=null,legacyCorrectAnswer=null,variant='teacher'}={}){
  const k=responseKind(q);
  if(k==='single_choice'){
    const cls=variant==='projection'?'projection-answers':'v8-answer-grid';
    return `<div class="${cls}">${(q?.choices||[]).map((a,i)=>variant==='projection'?`<div class="projection-answer ans${i} ${revealed?(i===Number(legacyCorrectAnswer)?'correct':'dim'):''}"><b>${String.fromCharCode(65+i)}</b><span>${esc(a)}</span></div>`:`<div class="v8-answer ans${i} ${revealed?(i===Number(legacyCorrectAnswer)?'correct':'dim'):''}"><span>${String.fromCharCode(65+i)}</span><b>${esc(a)}</b></div>`).join('')}</div>`;
  }
  if(k==='numeric')return `<div class="response-format-display numeric"><span>123</span><div><small>RÉPONSE NUMÉRIQUE</small><b>${esc(q?.responseConfig?.unit?`Valeur attendue en ${q.responseConfig.unit}`:'Une valeur numérique est attendue')}</b></div></div>`;
  if(k==='short_text')return `<div class="response-format-display text"><span>Aa</span><div><small>RÉPONSE COURTE</small><b>L’élève formule lui-même sa réponse</b></div></div>`;
  if(k==='ordering')return `<div class="response-format-display ordering"><small>REMETTRE DANS L’ORDRE</small><div class="display-order-list">${displayItems(q).map((x,i)=>`<span><i>${i+1}</i>${esc(x.label)}</span>`).join('')}</div></div>`;
  const {left,right}=displayMatchingSides(q);return `<div class="response-format-display matching"><small>ASSOCIATION</small><div class="display-matching-cols"><div>${left.map(x=>`<span>${esc(x.label)}</span>`).join('')}</div><b>⇄</b><div>${right.map(x=>`<span>${esc(x.label)}</span>`).join('')}</div></div></div>`;
}
function itemLabel(items,id){return items.find(x=>x.id===String(id))?.label??String(id)}
export function correctResponseText(q,correctResponse,legacyCorrectAnswer=null){
  const k=responseKind(q);if(k==='single_choice')return q?.choices?.[Number(legacyCorrectAnswer)]??'—';
  if(k==='numeric')return `${correctResponse?.value??'—'}${q?.responseConfig?.unit?` ${q.responseConfig.unit}`:''}`;
  if(k==='short_text'){const a=correctResponse?.accepted||[];return a[0]||correctResponse?.text||'—'}
  if(k==='ordering'){const items=asItems(q);return (correctResponse?.order||[]).map(id=>itemLabel(items,id)).join(' → ')||'—'}
  if(k==='matching'){const {left,right}=matchingSides(q);const pairs=correctResponse?.pairs||{};return left.map(l=>`${l.label} → ${itemLabel(right,pairs[l.id])}`).join(' • ')||'—'}
  return '—';
}
export function correctionResponseHtml(q,correctResponse,legacyCorrectAnswer=null){
  const k=responseKind(q);if(k==='single_choice')return `<div class="answer-grid player-answer-grid">${(q?.choices||[]).map((a,i)=>`<div class="answer-card ans${i} ${i===Number(legacyCorrectAnswer)?'correct':'dim'}"><div class="letter">${String.fromCharCode(65+i)}</div><div>${esc(a)}</div></div>`).join('')}</div>`;
  return `<div class="enriched-correct-response"><span>${kindLabel(k)}</span><strong>${esc(correctResponseText(q,correctResponse,legacyCorrectAnswer))}</strong></div>`;
}
