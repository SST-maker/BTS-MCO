-- MCO QUIZ ARENA V5.5 — AVATARS ÉLÈVES PREMIUM
-- À exécuter APRÈS la V5.4 (+ correctif 011 si nécessaire).
-- Aucun Storage nécessaire : les avatars sont des compositions vectorielles pilotées par 5 options JSON.

alter table public.mco_students add column if not exists avatar jsonb;

create or replace function public.mco_avatar_seed(p_identifier text)
returns jsonb language plpgsql immutable set search_path=public
as $$
declare
  h1 int:=mod(ascii(substr(md5(coalesce(p_identifier,'')),1,1)),6);
  h2 int:=mod(ascii(substr(md5(coalesce(p_identifier,'')),2,1)),6);
  bg text; ac text; fc text; ax text; fr text;
begin
  bg:=case h1 when 0 then 'ocean' when 1 then 'electric' when 2 then 'violet' when 3 then 'mint' when 4 then 'sunset' else 'graphite' end;
  ac:=case h2 when 0 then 'blue' when 1 then 'cyan' when 2 then 'violet' when 3 then 'green' when 4 then 'gold' else 'pink' end;
  fc:=case mod(h1+h2,5) when 0 then 'classic' when 1 then 'happy' when 2 then 'focus' when 3 then 'wink' else 'stars' end;
  ax:=case mod(h1*2+h2,5) when 0 then 'bolt' when 1 then 'crown' when 2 then 'cap' when 3 then 'headphones' else 'none' end;
  fr:=case mod(h1+h2*2,4) when 0 then 'orbit' when 1 then 'shield' when 2 then 'dots' else 'glow' end;
  return jsonb_build_object('background',bg,'accent',ac,'face',fc,'accessory',ax,'frame',fr);
end; $$;

create or replace function public.mco_avatar_validate(p_avatar jsonb)
returns jsonb language plpgsql immutable set search_path=public
as $$
declare
  bg text; ac text; fc text; ax text; fr text;
begin
  if p_avatar is null or jsonb_typeof(p_avatar)<>'object' then raise exception 'Avatar invalide'; end if;
  bg:=coalesce(p_avatar->>'background','ocean');
  ac:=coalesce(p_avatar->>'accent','blue');
  fc:=coalesce(p_avatar->>'face','classic');
  ax:=coalesce(p_avatar->>'accessory','bolt');
  fr:=coalesce(p_avatar->>'frame','orbit');
  if bg not in ('ocean','electric','violet','mint','sunset','graphite') then raise exception 'Fond avatar invalide'; end if;
  if ac not in ('blue','cyan','violet','green','gold','pink') then raise exception 'Couleur avatar invalide'; end if;
  if fc not in ('classic','happy','focus','wink','stars') then raise exception 'Expression avatar invalide'; end if;
  if ax not in ('bolt','crown','cap','headphones','none') then raise exception 'Accessoire avatar invalide'; end if;
  if fr not in ('orbit','shield','dots','glow') then raise exception 'Cadre avatar invalide'; end if;
  return jsonb_build_object('background',bg,'accent',ac,'face',fc,'accessory',ax,'frame',fr);
end; $$;

update public.mco_students
set avatar=public.mco_avatar_seed(identifier)
where avatar is null;

alter table public.mco_students alter column avatar set default '{"background":"ocean","accent":"blue","face":"classic","accessory":"bolt","frame":"orbit"}'::jsonb;
alter table public.mco_students alter column avatar set not null;

create or replace function public.mco_student_login(p_identifier text,p_password text)
returns jsonb language plpgsql security definer set search_path=public,extensions
as $$ declare st public.mco_students%rowtype; tok uuid; failed int; begin
  select * into st from public.mco_students where lower(identifier)=lower(trim(p_identifier)) and active;
  if not found then raise exception 'Identifiant ou mot de passe incorrect'; end if;
  if st.locked_until is not null and st.locked_until>now() then raise exception 'Compte temporairement verrouillé. Réessaie dans quelques minutes.'; end if;
  if st.password_hash<>extensions.crypt(coalesce(p_password,''),st.password_hash) then
    failed:=coalesce(st.failed_login_attempts,0)+1;
    update public.mco_students set failed_login_attempts=failed,locked_until=case when failed>=5 then now()+interval '10 minutes' else null end where id=st.id;
    raise exception 'Identifiant ou mot de passe incorrect';
  end if;
  delete from public.mco_student_sessions where expires_at<=now();
  insert into public.mco_student_sessions(student_id) values(st.id) returning token into tok;
  update public.mco_students set last_login_at=now(),failed_login_attempts=0,locked_until=null where id=st.id;
  return jsonb_build_object('token',tok,'student',jsonb_build_object('id',st.id,'identifier',st.identifier,'displayName',st.display_name,'className',st.class_name,'avatar',st.avatar));
end; $$;

create or replace function public.mco_student_me(p_token uuid)
returns jsonb language plpgsql security definer set search_path=public,extensions
as $$ declare sid uuid; st public.mco_students%rowtype; begin
  sid:=public.mco_student_from_token(p_token); select * into st from public.mco_students where id=sid;
  return jsonb_build_object('id',st.id,'identifier',st.identifier,'displayName',st.display_name,'className',st.class_name,'lastLoginAt',st.last_login_at,'avatar',st.avatar);
end; $$;

create or replace function public.mco_student_update_avatar(p_token uuid,p_avatar jsonb)
returns jsonb language plpgsql security definer set search_path=public
as $$ declare sid uuid; clean jsonb; begin
  sid:=public.mco_student_from_token(p_token);
  clean:=public.mco_avatar_validate(p_avatar);
  update public.mco_students set avatar=clean where id=sid;
  return clean;
end; $$;

create or replace function public.mco_teacher_student_reset_avatar(p_student_id uuid)
returns jsonb language plpgsql security definer set search_path=public
as $$ declare st public.mco_students%rowtype; av jsonb; begin
  if not public.mco_is_teacher() then raise exception 'Accès professeur requis'; end if;
  select * into st from public.mco_students where id=p_student_id and teacher_user_id=auth.uid();
  if not found then raise exception 'Élève introuvable'; end if;
  av:=public.mco_avatar_seed(st.identifier);
  update public.mco_students set avatar=av where id=st.id;
  return av;
end; $$;

create or replace function public.mco_teacher_students()
returns jsonb language plpgsql security definer set search_path=public
as $$ declare items jsonb; begin
  if not public.mco_is_teacher() then raise exception 'Accès professeur requis'; end if;
  select coalesce(jsonb_agg(jsonb_build_object('id',s.id,'identifier',s.identifier,'displayName',s.display_name,'className',s.class_name,'avatar',s.avatar,'active',s.active,'createdAt',s.created_at,'lastLoginAt',s.last_login_at) order by coalesce(s.class_name,''),s.display_name),'[]'::jsonb)
  into items from public.mco_students s where s.teacher_user_id=auth.uid();
  return items;
end; $$;

create or replace function public.mco_teacher_student_create(p_identifier text,p_password text,p_display_name text,p_class_name text default null)
returns jsonb language plpgsql security definer set search_path=public,extensions
as $$ declare st public.mco_students%rowtype; ident text:=lower(trim(coalesce(p_identifier,''))); av jsonb; begin
  if not public.mco_is_teacher() then raise exception 'Accès professeur requis'; end if;
  if ident!~'^[a-z0-9._-]{3,32}$' then raise exception 'Identifiant : 3 à 32 caractères (lettres, chiffres, . _ -)'; end if;
  if length(coalesce(p_password,''))<6 then raise exception 'Mot de passe : 6 caractères minimum'; end if;
  if length(trim(coalesce(p_display_name,'')))<2 then raise exception 'Nom élève requis'; end if;
  av:=public.mco_avatar_seed(ident);
  insert into public.mco_students(teacher_user_id,identifier,display_name,class_name,password_hash,avatar)
  values(auth.uid(),ident,left(trim(p_display_name),80),nullif(left(trim(coalesce(p_class_name,'')),50),''),extensions.crypt(p_password,extensions.gen_salt('bf',10)),av) returning * into st;
  return jsonb_build_object('id',st.id,'identifier',st.identifier,'displayName',st.display_name,'className',st.class_name,'avatar',st.avatar,'active',st.active);
exception when unique_violation then raise exception 'Cet identifiant est déjà utilisé'; end; $$;

create or replace function public.mco_student_dashboard(p_token uuid)
returns jsonb language plpgsql security definer set search_path=public
as $$ declare sid uuid; st public.mco_students%rowtype; completed integer; started integer; attempts integer; avgscore numeric; recent jsonb; begin
  sid:=public.mco_student_from_token(p_token); select * into st from public.mco_students where id=sid;
  select count(*) filter(where status in ('understood','mastered')),count(*) into completed,started from public.mco_student_progress where student_id=sid;
  select count(*),coalesce(round(avg(case when array_length(question_ids,1)>0 then score*100.0/array_length(question_ids,1) end)),0) into attempts,avgscore from public.mco_student_practice_attempts where student_id=sid and finished_at is not null;
  select coalesce(jsonb_agg(x order by (x->>'lastOpenedAt')::timestamptz desc),'[]'::jsonb) into recent from (
    select jsonb_build_object('lessonKey',p.lesson_key,'status',p.status,'progress',p.progress,'lastOpenedAt',p.last_opened_at,'lessonTitle',l.lesson_title,'subject',l.subject,'chapter',l.chapter) x
    from public.mco_student_progress p join public.mco_lessons l on l.lesson_key=p.lesson_key where p.student_id=sid order by p.last_opened_at desc limit 6
  ) z;
  return jsonb_build_object('student',jsonb_build_object('id',st.id,'identifier',st.identifier,'displayName',st.display_name,'className',st.class_name,'avatar',st.avatar),'completedLessons',completed,'startedLessons',started,'practiceAttempts',attempts,'averageScore',avgscore,'recent',recent);
end; $$;

create or replace function public.mco_join_session_student(p_code text,p_student_token uuid,p_team text default null)
returns jsonb language plpgsql security definer set search_path=public
as $$ declare sid uuid; st public.mco_students%rowtype; s public.quiz_sessions%rowtype; p public.quiz_players%rowtype; clean_team text:=nullif(left(trim(coalesce(p_team,'')),24),''); n int; begin
  sid:=public.mco_student_from_token(p_student_token); select * into st from public.mco_students where id=sid;
  select * into s from public.quiz_sessions where code=upper(trim(p_code)); if not found then raise exception 'Partie introuvable'; end if; if s.status='ended' then raise exception 'Cette partie est terminée'; end if;
  select count(*) into n from public.quiz_players where session_code=s.code; if n>=80 then raise exception 'Cette partie est complète'; end if;
  select * into p from public.quiz_players where session_code=s.code and student_id=sid limit 1;
  if found then return jsonb_build_object('playerId',p.id,'playerToken',p.player_token,'code',s.code,'name',p.name,'avatar',st.avatar); end if;
  insert into public.quiz_players(session_code,name,team,student_id) values(s.code,st.display_name,clean_team,sid) returning * into p;
  return jsonb_build_object('playerId',p.id,'playerToken',p.player_token,'code',s.code,'name',p.name,'avatar',st.avatar);
end; $$;

-- Remplace l'état de session afin d'inclure les avatars des comptes élèves dans le lobby et le classement.
create or replace function public.mco_session_state(p_code text,p_teacher_key uuid default null,p_player_id uuid default null,p_player_token uuid default null)
returns jsonb language plpgsql security definer set search_path=public
as $$
declare s public.quiz_sessions%rowtype; q public.quiz_questions%rowtype; p public.quiz_players%rowtype; qid text; is_teacher boolean:=false; is_player boolean:=false; players_json jsonb:='[]'::jsonb; board_json jsonb:='[]'::jsonb; question_json jsonb:=null; player_json jsonb:=null; response_count integer:=0; player_answer integer:=null; sec_remaining integer:=0;
begin
  select * into s from public.quiz_sessions where code=upper(trim(p_code)); if not found then raise exception 'Partie introuvable'; end if;
  is_teacher := auth.uid() is not null and s.teacher_user_id=auth.uid() and public.mco_is_teacher();
  if p_player_id is not null and p_player_token is not null then select * into p from public.quiz_players where id=p_player_id and player_token=p_player_token and session_code=s.code; is_player:=found; end if;
  if not is_teacher and not is_player then raise exception 'Accès refusé'; end if;
  if s.current_index>=0 and s.current_index<coalesce(array_length(s.question_ids,1),0) then
    qid:=s.question_ids[s.current_index+1]; select * into q from public.quiz_questions where id=qid;
    question_json:=jsonb_build_object('year',q.year,'subject',q.subject,'chapter',q.chapter,'chapterTitle',q.chapter_title,'lesson',q.lesson,'lessonTitle',q.lesson_title,'difficulty',q.difficulty,'type',q.type,'prompt',q.prompt,'choices',q.choices);
    if is_teacher then question_json:=question_json||jsonb_build_object('id',q.id); end if;
    select count(*) into response_count from public.quiz_answers where session_code=s.code and question_index=s.current_index;
  end if;
  select coalesce(jsonb_agg(x order by (x->>'joinedAt')::timestamptz),'[]'::jsonb) into players_json from (
    select jsonb_build_object('id',pl.id,'name',pl.name,'team',pl.team,'score',pl.score,'streak',pl.streak,'avatar',st.avatar,'answered',exists(select 1 from public.quiz_answers a where a.player_id=pl.id and a.session_code=s.code and a.question_index=s.current_index),'joinedAt',pl.joined_at) x
    from public.quiz_players pl left join public.mco_students st on st.id=pl.student_id where pl.session_code=s.code
  ) t;
  select coalesce(jsonb_agg(x order by (x->>'rank')::int),'[]'::jsonb) into board_json from (
    select jsonb_build_object('rank',row_number() over(order by pl.score desc,pl.streak desc,pl.joined_at asc),'id',pl.id,'name',pl.name,'team',pl.team,'score',pl.score,'streak',pl.streak,'avatar',st.avatar) x
    from public.quiz_players pl left join public.mco_students st on st.id=pl.student_id where pl.session_code=s.code
  ) t;
  if is_player then
    if s.current_index>=0 then select answer_index into player_answer from public.quiz_answers where session_code=s.code and player_id=p.id and question_index=s.current_index; end if;
    player_json:=jsonb_build_object('id',p.id,'name',p.name,'team',p.team,'score',p.score,'streak',p.streak,'answer',player_answer,'avatar',(select st.avatar from public.mco_students st where st.id=p.student_id));
  end if;
  if s.status='question' and s.question_started_at is not null then sec_remaining:=greatest(0,s.timer_seconds-floor(extract(epoch from(now()-s.question_started_at)))::int); else sec_remaining:=s.timer_seconds; end if;
  return jsonb_build_object('code',s.code,'title',s.title,'mode',s.mode,'status',s.status,'currentIndex',s.current_index,'totalQuestions',coalesce(array_length(s.question_ids,1),0),'revealed',s.revealed,'question',question_json,'correctAnswer',case when (s.revealed or is_teacher) and qid is not null then q.answer else null end,'explanation',case when (s.revealed or is_teacher) and qid is not null then q.explanation else null end,'players',players_json,'leaderboard',board_json,'player',player_json,'responseCount',response_count,'secondsRemaining',sec_remaining,'settings',jsonb_build_object('timerSeconds',s.timer_seconds,'showLeaderboard',s.show_leaderboard),'createdAt',s.created_at);
end; $$;

create or replace function public.mco_projection_state(p_code text)
returns jsonb language plpgsql security definer set search_path=public
as $$ declare s public.quiz_sessions%rowtype; q public.quiz_questions%rowtype; qid text; qj jsonb:=null; rc int:=0; pc int:=0; sec int:=0; board jsonb:='[]'::jsonb; begin
  select * into s from public.quiz_sessions where code=upper(trim(p_code)); if not found then raise exception 'Partie introuvable'; end if;
  select count(*) into pc from public.quiz_players where session_code=s.code;
  if s.current_index>=0 and s.current_index<coalesce(array_length(s.question_ids,1),0) then qid:=s.question_ids[s.current_index+1]; select * into q from public.quiz_questions where id=qid; qj:=jsonb_build_object('subject',q.subject,'chapter',q.chapter,'chapterTitle',q.chapter_title,'lesson',q.lesson,'lessonTitle',q.lesson_title,'prompt',q.prompt,'choices',q.choices); select count(*) into rc from public.quiz_answers where session_code=s.code and question_index=s.current_index; end if;
  if s.status='question' and s.question_started_at is not null then sec:=greatest(0,s.timer_seconds-floor(extract(epoch from(now()-s.question_started_at)))::int); else sec:=s.timer_seconds; end if;
  if s.status in ('reveal','ended') or s.show_leaderboard then
    select coalesce(jsonb_agg(x order by (x->>'rank')::int),'[]'::jsonb) into board from (
      select jsonb_build_object('rank',row_number() over(order by p.score desc,p.streak desc,p.joined_at),'name',p.name,'score',p.score,'avatar',st.avatar) x
      from public.quiz_players p left join public.mco_students st on st.id=p.student_id where p.session_code=s.code
    ) z;
  end if;
  return jsonb_build_object('code',s.code,'title',s.title,'mode',s.mode,'status',s.status,'currentIndex',s.current_index,'totalQuestions',coalesce(array_length(s.question_ids,1),0),'revealed',s.revealed,'question',qj,'correctAnswer',case when s.revealed and qid is not null then q.answer else null end,'explanation',case when s.revealed and qid is not null then q.explanation else null end,'responseCount',rc,'playerCount',pc,'secondsRemaining',sec,'leaderboard',board);
end; $$;

revoke execute on function public.mco_avatar_seed(text) from public,anon,authenticated;
revoke execute on function public.mco_avatar_validate(jsonb) from public,anon,authenticated;
revoke execute on function public.mco_student_update_avatar(uuid,jsonb) from public;
revoke execute on function public.mco_teacher_student_reset_avatar(uuid) from public,anon;
grant execute on function public.mco_student_update_avatar(uuid,jsonb) to anon,authenticated;
grant execute on function public.mco_teacher_student_reset_avatar(uuid) to authenticated;

-- Les fonctions remplacées conservent normalement leurs droits ; on les réaffirme explicitement.
grant execute on function public.mco_student_login(text,text) to anon,authenticated;
grant execute on function public.mco_student_me(uuid) to anon,authenticated;
grant execute on function public.mco_student_dashboard(uuid) to anon,authenticated;
grant execute on function public.mco_join_session_student(text,uuid,text) to anon,authenticated;
grant execute on function public.mco_projection_state(text) to anon,authenticated;
grant execute on function public.mco_session_state(text,uuid,uuid,uuid) to anon,authenticated;
grant execute on function public.mco_teacher_students() to authenticated;
grant execute on function public.mco_teacher_student_create(text,text,text,text) to authenticated;
