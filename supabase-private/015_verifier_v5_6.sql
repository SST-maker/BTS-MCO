-- MCO QUIZ ARENA V5.6 — VÉRIFICATION AVATAR STUDIO+
select
  count(*) as total_eleves,
  count(*) filter (where avatar ? 'hair') as avec_coiffure,
  count(*) filter (where avatar ? 'hairColor') as avec_couleur_cheveux,
  count(*) filter (where avatar ? 'glasses') as avec_lunettes,
  count(*) filter (where avatar ? 'hat') as avec_chapeau
from public.mco_students;

-- Test du validateur sans modifier de compte : doit retourner un JSON propre.
select public.mco_avatar_validate('{"background":"ocean","accent":"cyan","face":"happy","hair":"afro","hairColor":"chestnut","glasses":"sunglasses","hat":"none","accessory":"bolt","frame":"orbit"}'::jsonb) as test_avatar_v56;
