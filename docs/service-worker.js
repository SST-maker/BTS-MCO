const CACHE='mco-quiz-v9-studio-pedagogique';
const ASSETS=[
  './','./index.html','./teacher.html','./teacher.js','./students.html','./students.js','./progression.html','./progression.js',
  './pedagogy.html','./pedagogy.js','./revisions.html','./revisions.js','./student-revisions.html','./student-revisions.js',
  './cases.html','./cases.js','./case-projection.html','./case-projection.js','./pdf-export.js',
  './login.html','./login.js','./reset.html','./reset.js','./student-login.html','./student-login.js','./student.html','./student.js',
  './student-profile.html','./student-profile.js','./avatar.js','./lesson.html','./lesson.js','./student-practice.html','./student-practice.js',
  './join.html','./join.js','./play.html','./play.js','./projection.html','./projection.js','./solo.html','./solo.js','./bank.html','./bank.js',
  './styles.css','./v8.css','./v9.css','./common.js','./supabase-client.js','./manifest.webmanifest','./data/curriculum.json',
  './assets/icons/icon-64.png','./assets/icons/icon-96.png','./assets/icons/icon-192.png','./assets/icons/icon-512.png','./assets/icons/apple-touch-icon.png','./assets/icons/favicon-64.png'
];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;if(new URL(e.request.url).pathname.endsWith('/config.js')){e.respondWith(fetch(e.request,{cache:'no-store'}));return;}e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(resp=>{const copy=resp.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return resp}).catch(()=>caches.match('./index.html'))))});
