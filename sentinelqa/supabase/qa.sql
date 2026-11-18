-- Le volet QA : sa propre file, séparée de la table audits du pentest. Le worker QA ne lit jamais la file du pentest,
-- et le runner du pentest ne voit jamais une mission QA. S'applique plusieurs fois sans casser (« if not exists »).
-- Même sécurité que schema.sql : RLS activé et AUCUNE politique ; seule la clé secrète (serveur web, runner) lit et écrit.
-- Appliquer : python runner/qa_worker.py --schema

create table if not exists public.qa_missions (
  id uuid primary key default gen_random_uuid(),
  cree_le timestamptz not null default now(),
  statut text not null default 'en_attente' check (statut in ('en_attente', 'en_cours', 'termine', 'echec')),
  cible text not null,                                   -- l'identifiant du profil de cible (contrats/qa.json)
  demande jsonb not null,                                -- la mission validée : pilotage, appareil, consigne, source, plan relu
  arret_demande boolean not null default false,          -- l'opérateur demande l'arrêt : le worker annule la session H
  debut timestamptz,
  fin timestamptz,
  rapport jsonb,                                         -- le rapport complet (schema_version 3)
  erreur text
);

-- Le fil d'une mission : étapes, gestes de l'agent, pages vues, critères vérifiés.
create table if not exists public.qa_evenements (
  id bigint generated always as identity primary key,
  mission_id uuid not null references public.qa_missions (id) on delete cascade,
  quand timestamptz not null default now(),
  type text not null,
  message text not null,
  donnees jsonb
);

create index if not exists qa_evenements_mission_idx on public.qa_evenements (mission_id, id);
create index if not exists qa_missions_attente_idx on public.qa_missions (statut, cree_le);

alter table public.qa_missions enable row level security;
alter table public.qa_evenements enable row level security;
