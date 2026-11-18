-- Schéma Supabase de SentinelQA. Il s'applique plusieurs fois sans casser (« if not exists »).
-- Sécurité : RLS activé sur chaque table et AUCUNE politique. Les clés publiques (anon, publishable)
-- n'ont donc accès à rien ; seule la clé secrète, utilisée côté serveur et par le runner, lit et écrit.

-- La clé publique du runner. Le navigateur du client chiffre les mots de passe avec elle ;
-- la clé privée ne quitte jamais le poste du runner.
create table if not exists public.cles_runner (
  id bigint generated always as identity primary key,
  cree_le timestamptz not null default now(),
  algorithme text not null,
  cle_publique jsonb not null
);

-- Un audit : sa demande (le cadrage), son déroulé et son rapport.
create table if not exists public.audits (
  id uuid primary key default gen_random_uuid(),
  cree_le timestamptz not null default now(),
  statut text not null default 'en_attente' check (statut in ('en_attente', 'en_cours', 'termine', 'echec')),
  application text not null,
  cible text not null,
  perimetre jsonb not null default '[]'::jsonb,           -- chemins interdits aux agents et aux rejeux
  ecriture_autorisee boolean not null default false,       -- le feu vert humain pour les tests d'écriture
  comptes jsonb not null,                                  -- [{cle, email, entreprise, acces}], jamais de mot de passe
  secrets_chiffres text,                                   -- mots de passe chiffrés par le navigateur, effacés après l'audit
  cle_runner bigint references public.cles_runner (id),
  debut timestamptz,
  fin timestamptz,
  rapport jsonb,                                           -- le rapport complet du runner
  erreur text
);

-- Le fil des interventions : chaque étape, session d'agent, suspicion et preuve, au fil de l'audit.
create table if not exists public.evenements (
  id bigint generated always as identity primary key,
  audit_id uuid not null references public.audits (id) on delete cascade,
  quand timestamptz not null default now(),
  type text not null,
  message text not null,
  donnees jsonb
);
create index if not exists evenements_audit_idx on public.evenements (audit_id, id);
create index if not exists audits_attente_idx on public.audits (statut, cree_le);

alter table public.cles_runner enable row level security;
alter table public.audits enable row level security;
alter table public.evenements enable row level security;
