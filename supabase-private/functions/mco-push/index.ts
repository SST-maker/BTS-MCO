import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const cors={
  "Access-Control-Allow-Origin":"*",
  "Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods":"POST, OPTIONS"
};

function json(data:unknown,status=200){return new Response(JSON.stringify(data),{status,headers:{...cors,"content-type":"application/json; charset=utf-8"}})}
function cleanBase(v:string){return v.endsWith('/')?v:v+'/'}

Deno.serve(async req=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers:cors});
  if(req.method!=='POST')return json({error:'POST requis'},405);
  try{
    const url=Deno.env.get('SUPABASE_URL')!;
    const serviceKey=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const vapidPublic=Deno.env.get('MCO_VAPID_PUBLIC_KEY')!;
    const vapidPrivate=Deno.env.get('MCO_VAPID_PRIVATE_KEY')!;
    const vapidSubject=Deno.env.get('MCO_VAPID_SUBJECT')||'mailto:admin@example.com';
    if(!url||!serviceKey||!vapidPublic||!vapidPrivate)return json({error:'Secrets VAPID/Supabase manquants'},500);

    const authHeader=req.headers.get('Authorization')||'';
    const jwt=authHeader.replace(/^Bearer\s+/i,'');
    if(!jwt)return json({error:'Authentification professeur requise'},401);
    const admin=createClient(url,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}});
    const {data:userData,error:userError}=await admin.auth.getUser(jwt);
    if(userError||!userData.user)return json({error:'Session invalide'},401);
    const user=userData.user;
    const {data:profile}=await admin.from('mco_profiles').select('id,role,active').eq('id',user.id).maybeSingle();
    if(!profile?.active||!['teacher','admin'].includes(profile.role))return json({error:'Accès professeur refusé'},403);

    const body=await req.json().catch(()=>({}));
    const kind=String(body.kind||'');
    const appBase=cleanBase(String(body.appBase||''));
    if(!/^https?:\/\//.test(appBase))return json({error:'appBase invalide'},400);

    let studentQuery=admin.from('mco_students').select('id').eq('teacher_user_id',user.id).eq('active',true);
    if(body.className)studentQuery=studentQuery.eq('class_name',String(body.className));
    const {data:students,error:studentsError}=await studentQuery;
    if(studentsError)throw studentsError;
    const studentIds=(students||[]).map(x=>x.id);
    if(!studentIds.length)return json({sent:0,reason:'Aucun élève ciblé'});

    const {data:subs,error:subsError}=await admin.from('mco_push_subscriptions').select('id,endpoint,p256dh,auth_key').in('student_id',studentIds);
    if(subsError)throw subsError;
    if(!subs?.length)return json({sent:0,reason:'Aucun abonnement push'});

    let payload:any={title:'MCO Quiz Arena',body:'Une nouveauté t’attend.',url:appBase+'student.html',tag:'mco-general',badgeCount:1};
    if(kind==='lesson_unlocked'){
      let lessonTitle=String(body.lessonTitle||'Nouvelle leçon disponible');
      if(body.lessonKey){
        const {data:l}=await admin.from('mco_lessons').select('lesson_title').eq('lesson_key',String(body.lessonKey)).maybeSingle();
        if(l?.lesson_title)lessonTitle=l.lesson_title;
      }
      payload={title:'📘 Nouvelle leçon disponible',body:lessonTitle,url:body.lessonKey?`${appBase}lesson.html?key=${encodeURIComponent(String(body.lessonKey))}`:appBase+'student.html',tag:'mco-lesson',badgeCount:1};
    }else if(kind==='live_started'){
      const code=String(body.code||'').toUpperCase();
      payload={title:'⚡ Le Live commence',body:String(body.title||'Rejoins la session MCO Quiz Arena'),url:`${appBase}join.html?code=${encodeURIComponent(code)}`,tag:`mco-live-${code}`,renotify:true,badgeCount:1};
    }else{
      return json({error:'Type de notification non autorisé'},400);
    }

    webpush.setVapidDetails(vapidSubject,vapidPublic,vapidPrivate);
    let sent=0;const expired:string[]=[];
    await Promise.all((subs||[]).map(async s=>{
      try{
        await webpush.sendNotification({endpoint:s.endpoint,keys:{p256dh:s.p256dh,auth:s.auth_key}},JSON.stringify(payload),{TTL:3600,urgency:kind==='live_started'?'high':'normal'} as any);
        sent++;
      }catch(e:any){
        if([404,410].includes(Number(e?.statusCode)))expired.push(s.id);
      }
    }));
    if(expired.length)await admin.from('mco_push_subscriptions').delete().in('id',expired);
    return json({sent,expired:expired.length});
  }catch(e){return json({error:e instanceof Error?e.message:String(e)},500)}
});
