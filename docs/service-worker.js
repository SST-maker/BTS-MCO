const CACHE='mco-quiz-v12-2-flagship';
const RUNTIME='mco-quiz-v12-2-runtime';
const ASSETS=[
  './','./index.html','./offline.html','./teacher.html','./teacher.js','./students.html','./students.js','./progression.html','./progression.js',
  './pedagogy.html','./pedagogy.js','./revisions.html','./revisions.js','./student-revisions.html','./student-revisions.js',
  './cases.html','./cases.js','./case-projection.html','./case-projection.js','./pdf-export.js',
  './login.html','./login.js','./reset.html','./reset.js','./student-login.html','./student-login.js','./student.html','./student.js',
  './student-profile.html','./student-profile.js','./avatar.js','./lesson.html','./lesson.js','./student-practice.html','./student-practice.js',
  './join.html','./join.js','./play.html','./play.js','./projection.html','./projection.js','./solo.html','./solo.js','./bank.html','./bank.js',
  './styles.css','./v8.css','./v9.css','./v10.css','./v11.css','./common.js','./adaptive-ux.js','./supabase-client.js','./native-store.js','./native-live.js','./native-ux.js','./push-client.js',
  './manifest.webmanifest','./data/curriculum.json','./assets/icons/icon-64.png','./assets/icons/icon-96.png','./assets/icons/icon-192.png','./assets/icons/icon-512.png','./assets/icons/apple-touch-icon.png','./assets/icons/favicon-64.png'
];

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)));
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('mco-quiz-')&&![CACHE,RUNTIME].includes(k)).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('message',event=>{
  if(event.data?.type==='SKIP_WAITING')self.skipWaiting();
  if(event.data?.type==='CACHE_URLS'&&Array.isArray(event.data.urls))event.waitUntil(caches.open(RUNTIME).then(c=>c.addAll(event.data.urls.slice(0,20))));
});

async function navigationResponse(request){
  try{
    const fresh=await fetch(request);
    if(fresh?.ok){const cache=await caches.open(RUNTIME);cache.put(request,fresh.clone()).catch(()=>{});}return fresh;
  }catch{
    const direct=await caches.match(request);if(direct)return direct;
    try{const u=new URL(request.url);const shell=await caches.match(u.origin+u.pathname);if(shell)return shell;}catch{}
    return (await caches.match('./offline.html')) || (await caches.match('./index.html'));
  }
}
async function staleWhileRevalidate(request){
  const cached=await caches.match(request);
  const network=fetch(request).then(async response=>{if(response && (response.ok||response.type==='opaque')){const cache=await caches.open(RUNTIME);cache.put(request,response.clone()).catch(()=>{});}return response}).catch(()=>null);
  return cached || (await network) || new Response('',{status:504,statusText:'Offline'});
}
self.addEventListener('fetch',event=>{
  const request=event.request;if(request.method!=='GET')return;
  const url=new URL(request.url);
  if(url.pathname.endsWith('/config.js')){event.respondWith(fetch(request,{cache:'no-store'}).catch(()=>new Response('window.MCO_CONFIG=window.MCO_CONFIG||{};',{headers:{'content-type':'application/javascript'}})));return;}
  if(request.mode==='navigate'){event.respondWith(navigationResponse(request));return;}
  if(url.origin===location.origin||url.hostname==='cdn.jsdelivr.net'){event.respondWith(staleWhileRevalidate(request));}
});

self.addEventListener('push',event=>{
  let data={};try{data=event.data?.json()||{}}catch{data={body:event.data?.text()||''}}
  const title=data.title||'MCO Quiz Arena';
  const options={
    body:data.body||'Une nouveauté t’attend dans MCO Quiz Arena.',
    icon:'./assets/icons/icon-192.png',badge:'./assets/icons/favicon-64.png',
    tag:data.tag||'mco-quiz-arena',renotify:!!data.renotify,
    data:{url:data.url||'./student.html',...(data.data||{})},
    actions:Array.isArray(data.actions)?data.actions.slice(0,2):[]
  };
  event.waitUntil((async()=>{
    try{if(self.navigator?.setAppBadge)await self.navigator.setAppBadge(Number(data.badgeCount||1));}catch{}
    await self.registration.showNotification(title,options);
  })());
});
self.addEventListener('notificationclick',event=>{
  event.notification.close();const raw=event.notification.data?.url||'./student.html';const target=new URL(raw,self.registration.scope).href;
  event.waitUntil((async()=>{
    const clientsList=await clients.matchAll({type:'window',includeUncontrolled:true});
    for(const client of clientsList){if('focus'in client){try{await client.navigate(target)}catch{}return client.focus();}}
    if(clients.openWindow)return clients.openWindow(target);
  })());
});
