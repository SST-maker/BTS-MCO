-- MCO QUIZ ARENA V5.6 — AVATAR STUDIO+
-- À exécuter APRÈS 012_avatars_eleves_premium.sql (V5.5).
-- Ajoute coiffures, couleurs de cheveux, lunettes et chapeaux au JSON d'avatar.
-- Aucun Storage / aucune colonne supplémentaire n'est nécessaire.

create or replace function public.mco_avatar_seed(p_identifier text)
returns jsonb language plpgsql immutable set search_path=public
as $$
declare
  h text:=md5(coalesce(p_identifier,''));
  h1 int:=mod(ascii(substr(h,1,1)),6);
  h2 int:=mod(ascii(substr(h,2,1)),6);
  h3 int:=mod(ascii(substr(h,3,1)),9);
  h4 int:=mod(ascii(substr(h,4,1)),6);
  h5 int:=mod(ascii(substr(h,5,1)),8);
  h6 int:=mod(ascii(substr(h,6,1)),8);
  bg text; ac text; fc text; ax text; fr text; hr text; hc text; gl text; ht text;
begin
  bg:=case h1 when 0 then 'ocean' when 1 then 'electric' when 2 then 'violet' when 3 then 'mint' when 4 then 'sunset' else 'graphite' end;
  ac:=case h2 when 0 then 'blue' when 1 then 'cyan' when 2 then 'violet' when 3 then 'green' when 4 then 'gold' else 'pink' end;
  fc:=case mod(h1+h2,5) when 0 then 'classic' when 1 then 'happy' when 2 then 'focus' when 3 then 'wink' else 'stars' end;
  hr:=case h3 when 0 then 'none' when 1 then 'short' when 2 then 'spike' when 3 then 'wave' when 4 then 'curls' when 5 then 'afro' when 6 then 'side' when 7 then 'long' else 'pony' end;
  hc:=case h4 when 0 then 'graphite' when 1 then 'chestnut' when 2 then 'caramel' when 3 then 'blond' when 4 then 'silver' else 'blue' end;
  gl:=case h5 when 0 then 'none' when 1 then 'sunglasses' when 2 then 'mirror' when 3 then 'round' when 4 then 'retro' when 5 then 'aviator' when 6 then 'gaming' else 'neon' end;
  -- Les chapeaux sont volontairement moins fréquents dans le seed automatique.
  ht:=case h6 when 0 then 'cap' when 1 then 'beanie' when 2 then 'bucket' when 3 then 'graduate' else 'none' end;
  ax:=case mod(h1*2+h2,5) when 0 then 'bolt' when 1 then 'crown' when 2 then 'cap' when 3 then 'headphones' else 'none' end;
  if ht<>'none' and ax in ('crown','cap','headphones') then ax:='none'; end if;
  fr:=case mod(h1+h2*2,4) when 0 then 'orbit' when 1 then 'shield' when 2 then 'dots' else 'glow' end;
  return jsonb_build_object(
    'background',bg,'accent',ac,'face',fc,
    'hair',hr,'hairColor',hc,'glasses',gl,'hat',ht,
    'accessory',ax,'frame',fr
  );
end; $$;

create or replace function public.mco_avatar_validate(p_avatar jsonb)
returns jsonb language plpgsql immutable set search_path=public
as $$
declare
  bg text; ac text; fc text; ax text; fr text; hr text; hc text; gl text; ht text;
begin
  if p_avatar is null or jsonb_typeof(p_avatar)<>'object' then raise exception 'Avatar invalide'; end if;

  bg:=coalesce(p_avatar->>'background','ocean');
  ac:=coalesce(p_avatar->>'accent','blue');
  fc:=coalesce(p_avatar->>'face','classic');
  hr:=coalesce(p_avatar->>'hair','none');
  hc:=coalesce(p_avatar->>'hairColor','graphite');
  gl:=coalesce(p_avatar->>'glasses','none');
  ht:=coalesce(p_avatar->>'hat','none');
  ax:=coalesce(p_avatar->>'accessory','bolt');
  fr:=coalesce(p_avatar->>'frame','orbit');

  if bg not in ('ocean','electric','violet','mint','sunset','graphite') then raise exception 'Fond avatar invalide'; end if;
  if ac not in ('blue','cyan','violet','green','gold','pink') then raise exception 'Couleur avatar invalide'; end if;
  if fc not in ('classic','happy','focus','wink','stars') then raise exception 'Expression avatar invalide'; end if;
  if hr not in ('none','short','spike','wave','curls','afro','side','long','pony') then raise exception 'Coiffure avatar invalide'; end if;
  if hc not in ('graphite','chestnut','caramel','blond','silver','blue') then raise exception 'Couleur de cheveux invalide'; end if;
  if gl not in ('none','sunglasses','mirror','round','retro','aviator','gaming','neon') then raise exception 'Lunettes avatar invalides'; end if;
  if ht not in ('none','cap','beanie','bucket','fedora','graduate','cowboy','chef') then raise exception 'Chapeau avatar invalide'; end if;
  if ax not in ('bolt','crown','cap','headphones','none') then raise exception 'Accessoire avatar invalide'; end if;
  if fr not in ('orbit','shield','dots','glow') then raise exception 'Cadre avatar invalide'; end if;

  -- Évite les doubles couvre-chefs disgracieux.
  if ht<>'none' and ax in ('crown','cap','headphones') then ax:='none'; end if;

  return jsonb_build_object(
    'background',bg,'accent',ac,'face',fc,
    'hair',hr,'hairColor',hc,'glasses',gl,'hat',ht,
    'accessory',ax,'frame',fr
  );
end; $$;

-- Complète les avatars V5.5 existants sans modifier leurs choix actuels.
update public.mco_students
set avatar = '{"hair":"none","hairColor":"graphite","glasses":"none","hat":"none"}'::jsonb || avatar
where avatar is not null;

alter table public.mco_students alter column avatar set default
'{"background":"ocean","accent":"blue","face":"classic","hair":"none","hairColor":"graphite","glasses":"none","hat":"none","accessory":"bolt","frame":"orbit"}'::jsonb;

-- Les RPC existantes utilisent déjà mco_avatar_validate / mco_avatar_seed.
-- On réaffirme seulement les droits nécessaires.
revoke execute on function public.mco_avatar_seed(text) from public,anon,authenticated;
revoke execute on function public.mco_avatar_validate(jsonb) from public,anon,authenticated;
grant execute on function public.mco_student_update_avatar(uuid,jsonb) to anon,authenticated;
grant execute on function public.mco_teacher_student_reset_avatar(uuid) to authenticated;
