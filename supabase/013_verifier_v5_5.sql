-- Vérification MCO Quiz Arena V5.5 — avatars
select
  count(*) as eleves_total,
  count(*) filter (where avatar is not null) as eleves_avec_avatar,
  count(distinct avatar->>'background') as fonds_utilises,
  count(distinct avatar->>'accent') as couleurs_utilisees
from public.mco_students;

select identifier, display_name, class_name, avatar
from public.mco_students
order by class_name nulls last, display_name
limit 20;

select proname
from pg_proc
where proname in ('mco_student_update_avatar','mco_teacher_student_reset_avatar','mco_avatar_validate','mco_avatar_seed')
order by proname;
