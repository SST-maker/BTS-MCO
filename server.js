const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const QRCode = require('./lib/QRCode');
const QRErrorCorrectLevel = require('./lib/QRCode/QRErrorCorrectLevel');
const { URL } = require('url');

const PORT = Number(process.env.PORT || 4173);
const ROOT = __dirname;
const PUBLIC = path.join(ROOT, 'public');
const QUESTIONS_PATH = path.join(PUBLIC, 'data', 'questions.json');
let questions = JSON.parse(fs.readFileSync(QUESTIONS_PATH, 'utf8'));
const sessions = new Map();

function id(len=12){ return crypto.randomBytes(len).toString('hex'); }
function code(){
  const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  for(let tries=0;tries<1000;tries++){
    let c=''; for(let i=0;i<5;i++) c+=chars[Math.floor(Math.random()*chars.length)];
    if(!sessions.has(c)) return c;
  }
  return Math.random().toString(36).slice(2,7).toUpperCase();
}
function send(res,status,obj,headers={}){
  res.writeHead(status, {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',...headers});
  res.end(JSON.stringify(obj));
}
function body(req){
  return new Promise((resolve,reject)=>{
    let data=''; req.on('data',c=>{data+=c;if(data.length>2e6) req.destroy()});
    req.on('end',()=>{try{resolve(data?JSON.parse(data):{})}catch(e){reject(e)}}); req.on('error',reject);
  });
}
function publicSession(s, playerId=null, isHost=false){
  const q=s.currentIndex>=0?s.questions[s.currentIndex]:null;
  const publicQ=q?{id:q.id,year:q.year,subject:q.subject,chapter:q.chapter,chapterTitle:q.chapterTitle||'',lesson:q.lesson,lessonTitle:q.lessonTitle||'',difficulty:q.difficulty,type:q.type||'',prompt:q.prompt,choices:q.choices}:null;
  const player=playerId?s.players.get(playerId):null;
  return {
    code:s.code, mode:s.mode, status:s.status, title:s.title,
    currentIndex:s.currentIndex, totalQuestions:s.questions.length,
    question: publicQ, revealed:s.revealed,
    correctAnswer:s.revealed&&q?q.answer:null,
    explanation:s.revealed&&q?q.explanation:null,
    players:[...s.players.values()].map(p=>({id:p.id,name:p.name,score:p.score,streak:p.streak,team:p.team,answered:s.answers.has(p.id),answer:isHost?(s.answers.get(p.id)??null):undefined})),
    leaderboard: leaderboard(s),
    player: player?{id:player.id,name:player.name,score:player.score,streak:player.streak,team:player.team,answer:s.answers.get(player.id)??null}:null,
    settings:s.settings,
    responseCount:s.answers.size,
    createdAt:s.createdAt
  };
}
function leaderboard(s){
  return [...s.players.values()].sort((a,b)=>b.score-a.score || b.streak-a.streak).map((p,i)=>({rank:i+1,id:p.id,name:p.name,score:p.score,streak:p.streak,team:p.team}));
}
function scoreAnswer(s, playerId, answerIndex, elapsedMs){
  const p=s.players.get(playerId); if(!p) return;
  const q=s.questions[s.currentIndex];
  const correct=answerIndex===q.answer;
  let gained=0;
  if(correct){
    p.streak+=1;
    const maxMs=s.settings.timerSeconds*1000;
    const speed=Math.max(0,1-Math.min(elapsedMs,maxMs)/maxMs);
    const speedFactor=s.mode==='revision'?0:s.mode==='bts'?0.35:0.65;
    gained=100+Math.round(100*speed*speedFactor)+(p.streak>=3?25:0);
    p.score+=gained; p.correct+=1;
  } else { p.streak=0; p.wrong+=1; }
  p.history.push({questionId:q.id,answerIndex,correct,gained,at:Date.now()});
}
function filterQuestions(filters={}){
  let f=[...questions];
  if(filters.year && filters.year!=='all') f=f.filter(q=>q.year===filters.year);
  if(filters.subject && filters.subject!=='all') f=f.filter(q=>q.subject===filters.subject);
  if(filters.chapter && filters.chapter!=='all') f=f.filter(q=>q.chapter===filters.chapter);
  if(filters.lesson && filters.lesson!=='all') f=f.filter(q=>q.lesson===filters.lesson);
  if(filters.difficulty && filters.difficulty!=='all') f=f.filter(q=>q.difficulty===filters.difficulty);
  return f.sort(()=>Math.random()-0.5);
}
function catalog(){
  const out={years:{},total:questions.length};
  for(const q of questions){
    out.years[q.year]??={subjects:{}};
    out.years[q.year].subjects[q.subject]??={chapters:{}};
    out.years[q.year].subjects[q.subject].chapters[q.chapter]??={title:q.chapterTitle||'',lessons:{}};
    const ch=out.years[q.year].subjects[q.subject].chapters[q.chapter];
    if(!ch.title && q.chapterTitle) ch.title=q.chapterTitle;
    ch.lessons[q.lesson]??={title:q.lessonTitle||'',count:0};
    if(!ch.lessons[q.lesson].title && q.lessonTitle) ch.lessons[q.lesson].title=q.lessonTitle;
    ch.lessons[q.lesson].count+=1;
  }
  return out;
}
function mime(file){
  const ext=path.extname(file).toLowerCase();
  return ({'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'application/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.png':'image/png','.svg':'image/svg+xml','.ico':'image/x-icon','.webmanifest':'application/manifest+json'})[ext]||'application/octet-stream';
}
function serveStatic(req,res,pathname){
  let rel=pathname==='/'?'index.html':decodeURIComponent(pathname.slice(1));
  if(rel.includes('..')) {res.writeHead(403);return res.end('Forbidden');}
  const file=path.join(PUBLIC,rel);
  if(fs.existsSync(file)&&fs.statSync(file).isFile()){
    res.writeHead(200,{'Content-Type':mime(file),'Cache-Control':rel.includes('service-worker')?'no-cache':'public,max-age=300'});return fs.createReadStream(file).pipe(res);
  }
  res.writeHead(404);res.end('Not found');
}
function requireHost(s, token){if(!s||!token)return false;const a=Buffer.from(String(s.hostToken)),b=Buffer.from(String(token));return a.length===b.length&&crypto.timingSafeEqual(a,b);}

const server=http.createServer(async (req,res)=>{
  const u=new URL(req.url,`http://${req.headers.host||'localhost'}`); const p=u.pathname;
  if(p==='/api/qr') {
    const text=u.searchParams.get('text')||'';
    if(!text) return send(res,400,{error:'Texte QR requis'});
    try {
      const qr=new QRCode(-1,QRErrorCorrectLevel.M); qr.addData(text); qr.make();
      const n=qr.getModuleCount(), quiet=4, size=n+quiet*2;
      let rects='';
      for(let r=0;r<n;r++) for(let c=0;c<n;c++) if(qr.isDark(r,c)) rects+=`<rect x=\"${c+quiet}\" y=\"${r+quiet}\" width=\"1\" height=\"1\"/>`;
      const svg=`<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 ${size} ${size}\" shape-rendering=\"crispEdges\"><rect width=\"100%\" height=\"100%\" fill=\"white\"/><g fill=\"#07111f\">${rects}</g></svg>`;
      res.writeHead(200,{'Content-Type':'image/svg+xml','Cache-Control':'no-store'}); return res.end(svg);
    } catch(e){ return send(res,500,{error:'QR impossible',detail:e.message}); }
  }
  if(p==='/api/health') return send(res,200,{ok:true,version:'4.0.0',questions:questions.length,sessions:sessions.size});
  if(p==='/api/dashboard'){
    const all=[...sessions.values()];
    const active=all.filter(x=>x.status!=='ended');
    const players=all.reduce((n,x)=>n+x.players.size,0);
    const scores=all.flatMap(x=>[...x.players.values()].map(p=>p.score));
    const avgScore=scores.length?Math.round(scores.reduce((a,b)=>a+b,0)/scores.length):0;
    const recentSessions=[...all].sort((a,b)=>b.createdAt-a.createdAt).slice(0,6).map(x=>({code:x.code,title:x.title,status:x.status,players:x.players.size,mode:x.mode,createdAt:x.createdAt}));
    return send(res,200,{questions:questions.length,totalSessions:all.length,activeSessions:active.length,totalPlayers:players,avgScore,recentSessions});
  }
  if(p==='/api/catalog') return send(res,200,catalog());
  if(p==='/api/dashboard') {
    const items=[...sessions.values()].sort((a,b)=>b.createdAt-a.createdAt).map(s=>{
      const ps=[...s.players.values()];
      const maxPossible=Math.max(1,s.questions.length*200);
      const avgRaw=ps.length?ps.reduce((sum,x)=>sum+x.score,0)/ps.length:0;
      return {code:s.code,title:s.title,mode:s.mode,status:s.status,players:ps.length,currentIndex:s.currentIndex,totalQuestions:s.questions.length,createdAt:s.createdAt,averageScore:Math.round(Math.min(100,avgRaw/maxPossible*100))};
    });
    const liveSessions=items.filter(x=>x.status!=='ended').length;
    const totalPlayers=items.reduce((a,x)=>a+x.players,0);
    const scored=items.filter(x=>x.players>0);
    const averageScore=scored.length?Math.round(scored.reduce((a,x)=>a+x.averageScore,0)/scored.length):0;
    return send(res,200,{version:'4.0.0',questions:questions.length,totalSessions:items.length,liveSessions,totalPlayers,averageScore,sessions:items});
  }
  if(p==='/api/questions/count') return send(res,200,{count:questions.length});
  if(p==='/api/sessions' && req.method==='POST'){
    try{
      const b=await body(req); const pool=filterQuestions(b.filters||{}); const count=Math.max(1,Math.min(Number(b.questionCount||10),pool.length));
      if(!pool.length) return send(res,400,{error:'Aucune question ne correspond aux filtres.'});
      const c=code(), token=id(16);
      const defaults={class:20,battle:12,revision:45,bts:60,duel:20};
      const s={code:c,hostToken:token,title:b.title||'MCO Quiz Arena',mode:b.mode||'class',status:'lobby',filters:b.filters||{},questions:pool.slice(0,count),currentIndex:-1,revealed:false,players:new Map(),answers:new Map(),settings:{timerSeconds:Number(b.timerSeconds||defaults[b.mode]||20),autoReveal:Boolean(b.autoReveal),showLeaderboard:b.showLeaderboard!==false},createdAt:Date.now(),questionStartedAt:null};
      sessions.set(c,s);
      return send(res,201,{code:c,hostToken:token,session:publicSession(s),joinPath:`/join.html?code=${c}`,hostPath:`/host.html?code=${c}&token=${token}`});
    }catch(e){return send(res,400,{error:'Requête invalide',detail:e.message});}
  }
  const m=p.match(/^\/api\/sessions\/([A-Z0-9]{5})(?:\/(\w+))?$/);
  if(m){
    const c=m[1], action=m[2]||''; const s=sessions.get(c); if(!s) return send(res,404,{error:'Partie introuvable'});
    if(!action && req.method==='GET') { const t=u.searchParams.get('token')||req.headers['x-host-token']; return send(res,200,publicSession(s,u.searchParams.get('playerId'),requireHost(s,t))); }
    if(action==='join' && req.method==='POST'){
      const b=await body(req); const name=String(b.name||'').trim().slice(0,24); if(!name) return send(res,400,{error:'Pseudo requis'});
      if(s.status!=='lobby') return send(res,409,{error:'La partie a déjà commencé'});
      if([...s.players.values()].some(p=>p.name.toLowerCase()===name.toLowerCase())) return send(res,409,{error:'Pseudo déjà utilisé'});
      const pid=id(8); const team=s.mode==='duel'?((s.players.size%2===0)?'Bleu':'Orange'):null;
      s.players.set(pid,{id:pid,name,score:0,streak:0,correct:0,wrong:0,team,history:[],joinedAt:Date.now()});
      return send(res,201,{playerId:pid,session:publicSession(s,pid)});
    }
    const token=req.headers['x-host-token']||u.searchParams.get('token');
    if(['start','next','reveal','end','kick','reset'].includes(action) && !requireHost(s,token)) return send(res,403,{error:'Accès professeur refusé'});
    if(action==='start' && req.method==='POST'){
      if(s.currentIndex<0) s.currentIndex=0; s.status='question'; s.revealed=false; s.answers.clear(); s.questionStartedAt=Date.now(); return send(res,200,publicSession(s,null,true));
    }
    if(action==='reveal' && req.method==='POST'){
      if(s.status!=='question') return send(res,409,{error:'Aucune question active'}); s.revealed=true; s.status='reveal'; return send(res,200,publicSession(s,null,true));
    }
    if(action==='next' && req.method==='POST'){
      if(s.currentIndex+1>=s.questions.length){s.status='ended'; return send(res,200,publicSession(s,null,true));}
      s.currentIndex+=1; s.status='question'; s.revealed=false; s.answers.clear(); s.questionStartedAt=Date.now(); return send(res,200,publicSession(s,null,true));
    }
    if(action==='answer' && req.method==='POST'){
      const b=await body(req); const pid=String(b.playerId||''); if(!s.players.has(pid)) return send(res,403,{error:'Joueur inconnu'});
      if(s.status!=='question' || s.revealed) return send(res,409,{error:'Réponses fermées'});
      if(s.answers.has(pid)) return send(res,409,{error:'Réponse déjà envoyée'});
      const idx=Number(b.answerIndex); const q=s.questions[s.currentIndex]; if(!Number.isInteger(idx)||idx<0||idx>=q.choices.length) return send(res,400,{error:'Réponse invalide'});
      const elapsed=Date.now()-(s.questionStartedAt||Date.now());
      if(elapsed > (s.settings.timerSeconds*1000+1500)) return send(res,409,{error:'Temps écoulé'});
      s.answers.set(pid,idx); scoreAnswer(s,pid,idx,elapsed); return send(res,200,{ok:true,player:publicSession(s,pid).player});
    }
    if(action==='end' && req.method==='POST'){s.status='ended';return send(res,200,publicSession(s,null,true));}
    if(action==='report' && req.method==='GET'){
      if(!requireHost(s,token)) return send(res,403,{error:'Accès professeur refusé'});
      const items=s.questions.map(q=>({id:q.id,prompt:q.prompt,chapter:q.chapter,lesson:q.lesson,correctAnswer:q.choices[q.answer]}));
      const players=[...s.players.values()].map(p=>({name:p.name,score:p.score,correct:p.correct,wrong:p.wrong,team:p.team,history:p.history}));
      return send(res,200,{code:s.code,title:s.title,mode:s.mode,createdAt:s.createdAt,questions:items,players,leaderboard:leaderboard(s)});
    }
  }
  return serveStatic(req,res,p);
});

server.listen(PORT,'0.0.0.0',()=>{
  const nets=os.networkInterfaces(); const ips=[];
  for(const list of Object.values(nets)) for(const n of (list||[])) if(n.family==='IPv4'&&!n.internal) ips.push(n.address);
  console.log(`\nMCO Quiz Arena V4 démarré`);
  console.log(`Local : http://localhost:${PORT}`);
  for(const ip of ips) console.log(`Réseau : http://${ip}:${PORT}`);
  console.log(`Questions disponibles : ${questions.length}\n`);
});
