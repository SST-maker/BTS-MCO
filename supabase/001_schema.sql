-- MCO Quiz Arena V5 — Schéma Supabase
-- À exécuter dans Supabase > SQL Editor sur un projet DÉDIÉ à MCO Quiz Arena.
-- Aucun secret n'est stocké côté GitHub Pages.

create extension if not exists pgcrypto;

create table if not exists public.quiz_questions (
  id text primary key,
  year text not null check (year in ('1A','2A')),
  subject text not null check (subject in ('ADOC','GO')),
  chapter text not null,
  chapter_title text not null default '',
  lesson text not null,
  lesson_title text not null default '',
  difficulty text not null default 'intermédiaire',
  type text not null default 'qcm',
  prompt text not null,
  choices jsonb not null check (jsonb_typeof(choices)='array'),
  answer smallint not null check (answer between 0 and 5),
  explanation text not null default '',
  tags jsonb not null default '[]'::jsonb,
  source_file text,
  source_slide integer,
  created_at timestamptz not null default now()
);

create table if not exists public.quiz_sessions (
  code text primary key check (char_length(code)=5),
  teacher_key uuid not null,
  title text not null default 'MCO Quiz Arena',
  mode text not null default 'class' check (mode in ('class','battle','revision','bts','duel')),
  status text not null default 'lobby' check (status in ('lobby','question','reveal','ended')),
  current_index integer not null default -1,
  revealed boolean not null default false,
  timer_seconds integer not null default 20 check (timer_seconds between 5 and 180),
  show_leaderboard boolean not null default true,
  question_ids text[] not null,
  question_started_at timestamptz,
  created_at timestamptz not null default now(),
  ended_at timestamptz
);

create table if not exists public.quiz_players (
  id uuid primary key default gen_random_uuid(),
  player_token uuid not null default gen_random_uuid(),
  session_code text not null references public.quiz_sessions(code) on delete cascade,
  name text not null,
  team text,
  score integer not null default 0,
  streak integer not null default 0,
  correct_count integer not null default 0,
  wrong_count integer not null default 0,
  joined_at timestamptz not null default now()
);

create table if not exists public.quiz_answers (
  id uuid primary key default gen_random_uuid(),
  session_code text not null references public.quiz_sessions(code) on delete cascade,
  player_id uuid not null references public.quiz_players(id) on delete cascade,
  question_index integer not null,
  question_id text not null references public.quiz_questions(id),
  answer_index integer not null,
  elapsed_ms integer not null default 0,
  correct boolean not null,
  points integer not null default 0,
  created_at timestamptz not null default now(),
  unique(session_code,player_id,question_index)
);

create index if not exists idx_questions_filters on public.quiz_questions(year,subject,chapter,lesson,difficulty);
create index if not exists idx_sessions_teacher on public.quiz_sessions(teacher_key,created_at desc);
create index if not exists idx_players_session on public.quiz_players(session_code,score desc);
create index if not exists idx_answers_session_question on public.quiz_answers(session_code,question_index);

alter table public.quiz_questions enable row level security;
alter table public.quiz_sessions enable row level security;
alter table public.quiz_players enable row level security;
alter table public.quiz_answers enable row level security;

-- Aucun accès direct aux tables depuis le navigateur : uniquement via RPC SECURITY DEFINER.
revoke all on public.quiz_questions from anon, authenticated;
revoke all on public.quiz_sessions from anon, authenticated;
revoke all on public.quiz_players from anon, authenticated;
revoke all on public.quiz_answers from anon, authenticated;

grant usage on schema public to anon, authenticated;

create or replace function public.mco_generate_code()
returns text
language plpgsql
security definer
set search_path=public
as $$
declare
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  c text;
  i integer;
  j integer;
begin
  for i in 1..100 loop
    c := '';
    for j in 1..5 loop
      c := c || substr(chars, floor(random()*length(chars))::int + 1, 1);
    end loop;
    if not exists(select 1 from public.quiz_sessions where code=c) then return c; end if;
  end loop;
  raise exception 'Impossible de générer un code de partie unique';
end;
$$;

create or replace function public.mco_question_count()
returns bigint
language sql
security definer
set search_path=public
as $$ select count(*) from public.quiz_questions; $$;

create or replace function public.mco_session_preview(p_code text)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare s public.quiz_sessions%rowtype; n integer;
begin
  select * into s from public.quiz_sessions where code=upper(trim(p_code));
  if not found then raise exception 'Partie introuvable'; end if;
  select count(*) into n from public.quiz_players where session_code=s.code;
  return jsonb_build_object('code',s.code,'title',s.title,'mode',s.mode,'status',s.status,'players',n,'createdAt',s.created_at);
end;
$$;

create or replace function public.mco_create_session(
  p_teacher_key uuid,
  p_title text default 'MCO Quiz Arena',
  p_mode text default 'class',
  p_year text default 'all',
  p_subject text default 'all',
  p_chapter text default 'all',
  p_lesson text default 'all',
  p_difficulty text default 'all',
  p_question_count integer default 10,
  p_timer_seconds integer default 20,
  p_show_leaderboard boolean default true
)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  c text;
  ids text[];
  wanted integer := greatest(1,least(coalesce(p_question_count,10),50));
begin
  if p_teacher_key is null then raise exception 'Clé professeur requise'; end if;
  if p_mode not in ('class','battle','revision','bts','duel') then raise exception 'Mode invalide'; end if;
  select array_agg(id) into ids from (
    select id from public.quiz_questions
    where (coalesce(p_year,'all')='all' or year=p_year)
      and (coalesce(p_subject,'all')='all' or subject=p_subject)
      and (coalesce(p_chapter,'all')='all' or chapter=p_chapter)
      and (coalesce(p_lesson,'all')='all' or lesson=p_lesson)
      and (coalesce(p_difficulty,'all')='all' or difficulty=p_difficulty)
    order by random()
    limit wanted
  ) q;
  if ids is null or array_length(ids,1)=0 then raise exception 'Aucune question ne correspond aux filtres'; end if;
  c := public.mco_generate_code();
  insert into public.quiz_sessions(code,teacher_key,title,mode,timer_seconds,show_leaderboard,question_ids)
  values(c,p_teacher_key,coalesce(nullif(trim(p_title),''),'MCO Quiz Arena'),p_mode,greatest(5,least(coalesce(p_timer_seconds,20),180)),coalesce(p_show_leaderboard,true),ids);
  return jsonb_build_object('code',c,'questionCount',array_length(ids,1),'status','lobby');
end;
$$;

create or replace function public.mco_join_session(p_code text,p_name text,p_team text default null)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  s public.quiz_sessions%rowtype;
  p public.quiz_players%rowtype;
  clean_name text := left(trim(coalesce(p_name,'')),24);
  clean_team text := nullif(left(trim(coalesce(p_team,'')),24),'');
begin
  select * into s from public.quiz_sessions where code=upper(trim(p_code));
  if not found then raise exception 'Partie introuvable'; end if;
  if s.status='ended' then raise exception 'Cette partie est terminée'; end if;
  if clean_name='' then raise exception 'Pseudo requis'; end if;
  insert into public.quiz_players(session_code,name,team) values(s.code,clean_name,clean_team) returning * into p;
  return jsonb_build_object('playerId',p.id,'playerToken',p.player_token,'code',s.code,'name',p.name);
end;
$$;

create or replace function public.mco_session_state(
  p_code text,
  p_teacher_key uuid default null,
  p_player_id uuid default null,
  p_player_token uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  s public.quiz_sessions%rowtype;
  q public.quiz_questions%rowtype;
  p public.quiz_players%rowtype;
  qid text;
  is_teacher boolean := false;
  is_player boolean := false;
  players_json jsonb := '[]'::jsonb;
  board_json jsonb := '[]'::jsonb;
  question_json jsonb := null;
  player_json jsonb := null;
  response_count integer := 0;
  player_answer integer := null;
  sec_remaining integer := 0;
begin
  select * into s from public.quiz_sessions where code=upper(trim(p_code));
  if not found then raise exception 'Partie introuvable'; end if;
  is_teacher := p_teacher_key is not null and p_teacher_key=s.teacher_key;
  if p_player_id is not null and p_player_token is not null then
    select * into p from public.quiz_players where id=p_player_id and player_token=p_player_token and session_code=s.code;
    is_player := found;
  end if;
  if not is_teacher and not is_player then raise exception 'Accès refusé'; end if;

  if s.current_index>=0 and s.current_index<coalesce(array_length(s.question_ids,1),0) then
    qid := s.question_ids[s.current_index+1];
    select * into q from public.quiz_questions where id=qid;
    question_json := jsonb_build_object(
      'id',q.id,'year',q.year,'subject',q.subject,'chapter',q.chapter,'chapterTitle',q.chapter_title,
      'lesson',q.lesson,'lessonTitle',q.lesson_title,'difficulty',q.difficulty,'type',q.type,
      'prompt',q.prompt,'choices',q.choices
    );
    select count(*) into response_count from public.quiz_answers where session_code=s.code and question_index=s.current_index;
  end if;

  select coalesce(jsonb_agg(x order by (x->>'joinedAt')::timestamptz),'[]'::jsonb) into players_json
  from (
    select jsonb_build_object(
      'id',pl.id,'name',pl.name,'team',pl.team,'score',pl.score,'streak',pl.streak,
      'answered',exists(select 1 from public.quiz_answers a where a.player_id=pl.id and a.session_code=s.code and a.question_index=s.current_index),
      'joinedAt',pl.joined_at
    ) x
    from public.quiz_players pl where pl.session_code=s.code
  ) t;

  select coalesce(jsonb_agg(x order by (x->>'rank')::int),'[]'::jsonb) into board_json
  from (
    select jsonb_build_object('rank',row_number() over(order by pl.score desc,pl.streak desc,pl.joined_at asc),'id',pl.id,'name',pl.name,'team',pl.team,'score',pl.score,'streak',pl.streak) x
    from public.quiz_players pl where pl.session_code=s.code
  ) t;

  if is_player then
    if s.current_index>=0 then select answer_index into player_answer from public.quiz_answers where session_code=s.code and player_id=p.id and question_index=s.current_index; end if;
    player_json := jsonb_build_object('id',p.id,'name',p.name,'team',p.team,'score',p.score,'streak',p.streak,'answer',player_answer);
  end if;

  if s.status='question' and s.question_started_at is not null then
    sec_remaining := greatest(0,s.timer_seconds-floor(extract(epoch from (now()-s.question_started_at)))::int);
  else sec_remaining := s.timer_seconds; end if;

  return jsonb_build_object(
    'code',s.code,'title',s.title,'mode',s.mode,'status',s.status,'currentIndex',s.current_index,
    'totalQuestions',coalesce(array_length(s.question_ids,1),0),'revealed',s.revealed,
    'question',question_json,
    'correctAnswer',case when (s.revealed or is_teacher) and qid is not null then q.answer else null end,
    'explanation',case when (s.revealed or is_teacher) and qid is not null then q.explanation else null end,
    'players',players_json,'leaderboard',board_json,'player',player_json,'responseCount',response_count,
    'secondsRemaining',sec_remaining,
    'settings',jsonb_build_object('timerSeconds',s.timer_seconds,'showLeaderboard',s.show_leaderboard),
    'createdAt',s.created_at
  );
end;
$$;

create or replace function public.mco_host_action(p_code text,p_teacher_key uuid,p_action text)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare s public.quiz_sessions%rowtype; total integer;
begin
  select * into s from public.quiz_sessions where code=upper(trim(p_code)) for update;
  if not found then raise exception 'Partie introuvable'; end if;
  if p_teacher_key is null or p_teacher_key<>s.teacher_key then raise exception 'Accès professeur refusé'; end if;
  total := coalesce(array_length(s.question_ids,1),0);
  if p_action='start' then
    if s.status='ended' then raise exception 'Partie terminée'; end if;
    update public.quiz_sessions set status='question',current_index=case when current_index<0 then 0 else current_index end,revealed=false,question_started_at=now() where code=s.code;
  elsif p_action='reveal' then
    if s.status not in ('question','reveal') then raise exception 'Aucune question à corriger'; end if;
    update public.quiz_sessions set status='reveal',revealed=true where code=s.code;
  elsif p_action='next' then
    if s.current_index+1>=total then
      update public.quiz_sessions set status='ended',revealed=true,ended_at=now() where code=s.code;
    else
      update public.quiz_sessions set status='question',current_index=s.current_index+1,revealed=false,question_started_at=now() where code=s.code;
    end if;
  elsif p_action='end' then
    update public.quiz_sessions set status='ended',revealed=true,ended_at=now() where code=s.code;
  else raise exception 'Action inconnue'; end if;
  return public.mco_session_state(s.code,p_teacher_key,null,null);
end;
$$;

create or replace function public.mco_submit_answer(
  p_code text,
  p_player_id uuid,
  p_player_token uuid,
  p_answer_index integer,
  p_elapsed_ms integer default 0
)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  s public.quiz_sessions%rowtype;
  p public.quiz_players%rowtype;
  q public.quiz_questions%rowtype;
  qid text;
  is_correct boolean;
  elapsed integer;
  speed numeric;
  factor numeric;
  new_streak integer;
  gained integer := 0;
begin
  select * into s from public.quiz_sessions where code=upper(trim(p_code)) for update;
  if not found then raise exception 'Partie introuvable'; end if;
  if s.status<>'question' or s.revealed then raise exception 'Les réponses sont fermées'; end if;
  if s.question_started_at is not null and now() > s.question_started_at + make_interval(secs=>s.timer_seconds) then raise exception 'Temps écoulé'; end if;
  select * into p from public.quiz_players where id=p_player_id and player_token=p_player_token and session_code=s.code for update;
  if not found then raise exception 'Joueur invalide'; end if;
  if exists(select 1 from public.quiz_answers where session_code=s.code and player_id=p.id and question_index=s.current_index) then raise exception 'Réponse déjà envoyée'; end if;
  qid := s.question_ids[s.current_index+1]; select * into q from public.quiz_questions where id=qid;
  if p_answer_index<0 or p_answer_index>=jsonb_array_length(q.choices) then raise exception 'Réponse invalide'; end if;
  is_correct := p_answer_index=q.answer;
  elapsed := greatest(0,least(floor(extract(epoch from (now()-coalesce(s.question_started_at,now())))*1000)::int,s.timer_seconds*1000));
  if is_correct then
    new_streak := p.streak+1;
    speed := greatest(0,1-(elapsed::numeric/(s.timer_seconds*1000)::numeric));
    factor := case when s.mode='revision' then 0 when s.mode='bts' then 0.35 else 0.65 end;
    gained := 100 + round(100*speed*factor)::int + case when new_streak>=3 then 25 else 0 end;
    update public.quiz_players set score=score+gained,streak=new_streak,correct_count=correct_count+1 where id=p.id;
  else
    update public.quiz_players set streak=0,wrong_count=wrong_count+1 where id=p.id;
  end if;
  insert into public.quiz_answers(session_code,player_id,question_index,question_id,answer_index,elapsed_ms,correct,points)
  values(s.code,p.id,s.current_index,q.id,p_answer_index,elapsed,is_correct,gained);
  return jsonb_build_object('ok',true,'correct',is_correct,'points',gained);
end;
$$;

create or replace function public.mco_dashboard(p_teacher_key uuid)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare total_q bigint; total_s integer; live_s integer; total_p integer; sessions_json jsonb;
begin
  if p_teacher_key is null then raise exception 'Clé professeur requise'; end if;
  select count(*) into total_q from public.quiz_questions;
  select count(*) into total_s from public.quiz_sessions where teacher_key=p_teacher_key;
  select count(*) into live_s from public.quiz_sessions where teacher_key=p_teacher_key and status<>'ended';
  select count(*) into total_p from public.quiz_players p join public.quiz_sessions s on s.code=p.session_code where s.teacher_key=p_teacher_key;
  select coalesce(jsonb_agg(x order by (x->>'createdAt')::timestamptz desc),'[]'::jsonb) into sessions_json from (
    select jsonb_build_object('code',s.code,'title',s.title,'mode',s.mode,'status',s.status,'createdAt',s.created_at,'players',(select count(*) from public.quiz_players p where p.session_code=s.code)) x
    from public.quiz_sessions s where s.teacher_key=p_teacher_key order by s.created_at desc limit 20
  ) t;
  return jsonb_build_object('questions',total_q,'totalSessions',total_s,'liveSessions',live_s,'totalPlayers',total_p,'averageScore',0,'sessions',sessions_json);
end;
$$;

create or replace function public.mco_report(p_code text,p_teacher_key uuid)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare s public.quiz_sessions%rowtype; players_json jsonb;
begin
  select * into s from public.quiz_sessions where code=upper(trim(p_code));
  if not found then raise exception 'Partie introuvable'; end if;
  if p_teacher_key is null or p_teacher_key<>s.teacher_key then raise exception 'Accès professeur refusé'; end if;
  select coalesce(jsonb_agg(jsonb_build_object('id',p.id,'name',p.name,'team',p.team,'score',p.score,'streak',p.streak,'correctCount',p.correct_count,'wrongCount',p.wrong_count) order by p.score desc),'[]'::jsonb) into players_json from public.quiz_players p where p.session_code=s.code;
  return jsonb_build_object('code',s.code,'title',s.title,'players',players_json);
end;
$$;

create or replace function public.mco_cleanup_old_sessions(p_days integer default 30)
returns integer
language plpgsql
security definer
set search_path=public
as $$ declare n integer; begin delete from public.quiz_sessions where created_at < now() - make_interval(days=>greatest(1,p_days)); get diagnostics n=row_count; return n; end; $$;

-- Autoriser uniquement les RPC nécessaires côté navigateur.
grant execute on function public.mco_question_count() to anon, authenticated;
grant execute on function public.mco_session_preview(text) to anon, authenticated;
grant execute on function public.mco_create_session(uuid,text,text,text,text,text,text,text,integer,integer,boolean) to anon, authenticated;
grant execute on function public.mco_join_session(text,text,text) to anon, authenticated;
grant execute on function public.mco_session_state(text,uuid,uuid,uuid) to anon, authenticated;
grant execute on function public.mco_host_action(text,uuid,text) to anon, authenticated;
grant execute on function public.mco_submit_answer(text,uuid,uuid,integer,integer) to anon, authenticated;
grant execute on function public.mco_dashboard(uuid) to anon, authenticated;
grant execute on function public.mco_report(text,uuid) to anon, authenticated;

-- Ne pas exposer le nettoyage à anon/authenticated.
revoke execute on function public.mco_cleanup_old_sessions(integer) from public, anon, authenticated;
