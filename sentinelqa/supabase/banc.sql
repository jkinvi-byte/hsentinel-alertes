-- Le banc Paie Express en ligne (D-45) : ses seuls champs modifiables, partagés entre les instances Vercel.
--
-- Sur Vercel, chaque instance du cobaye a sa propre mémoire : l'écriture de B (faille F4) doit pourtant être
-- visible quand A relit sa fiche. Le commentaire d'une fiche et la note d'une facture vivent donc ici ;
-- le reste des données du cobaye est fixe, dans son code (cobaye/lib/donnees.js).
--
-- Le cobaye, application volontairement vulnérable, n'a jamais notre clé secrète : il lit et écrit avec la clé
-- publishable (rôle anon). Cette table est la seule que ce rôle atteint (RLS sans politique ailleurs), et elle
-- ne peut contenir que six lignes courtes de données fictives : une par fiche ou facture du cobaye.
-- Ajouter une fiche ou une facture dans donnees.js = l'ajouter aussi à la liste ci-dessous.

create table if not exists public.cobaye_ecritures (
  objet text primary key check (objet in ('fiche:1041', 'fiche:1042', 'fiche:2051', 'fiche:2052',
                                          'facture:FA-2026-031', 'facture:FB-2026-077')),
  valeur text not null check (char_length(valeur) <= 500)
);

alter table public.cobaye_ecritures enable row level security;
revoke all on public.cobaye_ecritures from anon, authenticated;
grant select, insert, update, delete on public.cobaye_ecritures to anon;
drop policy if exists banc_anon on public.cobaye_ecritures;
create policy banc_anon on public.cobaye_ecritures for all to anon using (true) with check (true);

-- L'API (PostgREST) doit voir la table tout de suite, pas au prochain rechargement de son cache.
notify pgrst, 'reload schema';
