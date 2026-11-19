-- HSentinel · les demandes d'accès et de démo du site (D-50).
-- Appliquer dans l'éditeur SQL de Supabase. Le fichier peut être rejoué.
--
-- Le site enregistre chaque demande côté serveur (clé secrète) ; n8n (W5) les relève toutes les 5 minutes et
-- envoie un seul e-mail récapitulatif à l'équipe. Il n'existe pas encore de compte client : l'équipe ouvre l'accès
-- à la main. Une demande ne contient jamais de mot de passe.

create table if not exists public.demandes_acces (
  id uuid primary key default gen_random_uuid(),
  cree_le timestamptz not null default now(),
  type text not null check (type in ('acces', 'demo')),
  nom text not null check (length(nom) between 1 and 120),
  email text not null check (length(email) between 3 and 200 and email like '%@%'),
  entreprise text not null check (length(entreprise) between 1 and 120),
  taille text check (taille is null or taille in ('1-9', '10-50', '51-200', '200+')),
  message text check (message is null or length(message) <= 2000),
  notifie_le timestamptz                                   -- l'heure de l'e-mail à l'équipe ; vide tant qu'il n'est pas parti
);

create index if not exists demandes_acces_a_notifier_idx on public.demandes_acces (cree_le) where notifie_le is null;

-- Comme les autres tables : RLS sans politique. Seule la clé secrète (le site, n8n) lit et écrit.
alter table public.demandes_acces enable row level security;

-- W5 prend les demandes pas encore signalées et les marque d'un seul geste : deux relevés simultanés
-- ne peuvent pas envoyer la même demande deux fois. Au plus p_limite par passage, pour qu'un afflux
-- (ou un abus du formulaire) ne devienne jamais une avalanche d'e-mails.
create or replace function public.prendre_demandes_acces(p_limite integer default 20)
returns setof public.demandes_acces language sql security definer set search_path = public as $$
  update public.demandes_acces d
     set notifie_le = now()
   where d.id in (
     select id from public.demandes_acces
      where notifie_le is null
      order by cree_le
      limit greatest(1, least(coalesce(p_limite, 20), 50))
      for update skip locked)
  returning d.*;
$$;

revoke all on function public.prendre_demandes_acces(integer) from public, anon, authenticated;
grant execute on function public.prendre_demandes_acces(integer) to service_role;
