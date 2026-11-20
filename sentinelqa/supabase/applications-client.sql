-- D-56 (20/11) : un client ajoute son application dans la console, prouve qu'il en a le contrôle, puis y ajoute ses comptes
-- de test. Pour l'instant, une application ajoutée ne s'ouvre qu'au QA en consultation seule ; aucun contrôle pentest.
-- S'applique plusieurs fois sans casser. Même sécurité que les autres tables : RLS sans politique, clé secrète seule.
-- Appliquer : python3 -c "…" (voir sentinelqa/README.md, « Ajouter une application »).

-- ── L'application ajoutée : la table des applications suivies, qui sert déjà la console, la veille et les alertes ──
alter table public.applications add column if not exists ajoutee_console boolean not null default false;
-- Le profil de test, construit par notre serveur à partir de l'adresse saisie (jamais un JSON fourni par le client) :
-- même forme qu'une cible de contrats/qa.json, consultation seule, budgets fixes.
alter table public.applications add column if not exists profil_qa jsonb;
alter table public.applications add column if not exists attestee_le timestamptz;        -- l'attestation (art. 323-1), cochée à l'ajout
-- Le jeton à publier sur le site. Il appartient à l'adresse : retirer puis rajouter la même application redonne le même
-- jeton (on ne supprime jamais la ligne, on la retire), donc un client ne le publie qu'une fois.
alter table public.applications add column if not exists verification_jeton text;
alter table public.applications add column if not exists verification_methode text;
alter table public.applications add column if not exists verifiee_le timestamptz;         -- null tant que le jeton n'a pas été relu sur le site
alter table public.applications add column if not exists retiree_le timestamptz;          -- retirée par le client : plus listée, plus testable

alter table public.applications drop constraint if exists applications_verification_methode_check;
alter table public.applications add constraint applications_verification_methode_check
  check (verification_methode is null or verification_methode in ('fichier', 'balise'));
alter table public.applications drop constraint if exists applications_verification_jeton_check;
alter table public.applications add constraint applications_verification_jeton_check
  check (verification_jeton is null or verification_jeton ~ '^hsv-[A-Za-z0-9_-]{32}$');
create unique index if not exists applications_verification_jeton_idx on public.applications (verification_jeton)
  where verification_jeton is not null;

-- ── Les comptes de test d'une application ajoutée ─────────────────────────────────────────────────────────
-- Le mot de passe n'y est jamais en clair : le navigateur le chiffre avec la clé publique du runner (RSA-OAEP 3072, SHA-256).
-- À chaque mission, le runner le déchiffre en mémoire et le verse dans un coffre H propre à la mission, supprimé à la fin.
create table if not exists public.comptes_test (
  id uuid primary key default gen_random_uuid(),
  application_id text not null references public.applications (id) on delete cascade,
  libelle text not null check (length(libelle) between 1 and 60),             -- « Compte A · gérante »
  identifiant text not null check (length(identifiant) between 3 and 254),    -- l'adresse ou le nom d'utilisateur du compte de test
  secret_chiffre text not null check (length(secret_chiffre) between 100 and 2000),
  cle_runner_id bigint references public.cles_runner (id),                    -- la clé qui l'a chiffré : une autre clé ne l'ouvrira pas
  identite jsonb not null default '[]'::jsonb check (jsonb_typeof(identite) = 'array' and jsonb_array_length(identite) <= 3),
  cree_le timestamptz not null default now(),
  utilise_le timestamptz                                                       -- la dernière mission qui l'a employé
);
create index if not exists comptes_test_application_idx on public.comptes_test (application_id, cree_le);

alter table public.comptes_test enable row level security;
