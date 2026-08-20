const API={
  async json(url,opts={}){const r=await fetch(url,{headers:{'Content-Type':'application/json',...(opts.headers||{})},...opts});let data={};try{data=await r.json()}catch{}if(!r.ok)throw new Error(data.error||`Erreur ${r.status}`);return data;},
  get(url){return this.json(url)},post(url,body,token){return this.json(url,{method:'POST',body:JSON.stringify(body||{}),headers:token?{'x-host-token':token}:{}})}
};
const qs=k=>new URLSearchParams(location.search).get(k);
const esc=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[c]));
function nav(active=''){return `<header class="topbar"><a class="brand" href="/"><img class="icon" src="/assets/app-icon.png"><div><div class="brand-title">NCR Solutions • MCO Quiz Arena</div><div class="brand-sub">BTS MCO — ADOC & Gestion opérationnelle</div></div></a><nav class="nav"><a class="${active==='home'?'active':''}" href="/">Accueil</a><a class="${active==='host'?'active':''}" href="/host.html">Professeur</a><a class="${active==='join'?'active':''}" href="/join.html">Rejoindre</a><a class="${active==='solo'?'active':''}" href="/solo.html">Solo</a><a class="${active==='bank'?'active':''}" href="/bank.html">Banque</a></nav></header>`}
function footer(){return `<footer class="footer"><div>© NCR Solutions • BTS MCO</div><div>Parler vrai, former juste. • MCO Quiz Arena V3</div></footer>`}
function modeLabel(m){return ({class:'Mode Classe',battle:'Battle',revision:'Révision',bts:'Mode BTS',duel:'Duel'})[m]||m}
function toast(msg,type='info'){let t=document.createElement('div');t.textContent=msg;t.style.cssText=`position:fixed;right:18px;bottom:18px;padding:13px 16px;border-radius:14px;background:${type==='bad'?'#b83c4a':'#153459'};color:white;z-index:9999;box-shadow:0 16px 40px #0008;font-weight:700`;document.body.appendChild(t);setTimeout(()=>t.remove(),3000)}
