-- HSentinel · les alertes n8n de Jahdiel (W1, W3, W4), dans notre base (D-38).
-- Appliquer dans l'éditeur SQL de Supabase, après schema.sql et qa.sql. Le fichier peut être rejoué.
--
-- n8n relaie, la base décide. Les entrées et les sorties de chaque fonction sont celles qu'attendent
-- les workflows exportés dans sentinelqa/n8n/ ; le mode d'emploi est dans sentinelqa/n8n/README.md.
-- Aucun secret ici : ils vont dans le coffre de Supabase (voir la fin du fichier).

create extension if not exists pgcrypto with schema extensions;
do $$
begin
  create extension if not exists pg_net with schema extensions;
exception when others then
  raise notice 'pg_net indisponible (%) : le rattrapage de W3 prendra les constats toutes les 15 min.', sqlerrm;
end $$;

-- ── Les applications suivies : ce qu'on a le droit de tester, et comment ───────────────────────────────

create table if not exists public.applications (
  id text primary key,                                   -- identifiant court : paie-express, peer-review…
  nom text not null,
  origine text not null,                                 -- l'adresse du site
  autorisee boolean not null default false,              -- jamais d'audit automatique sans autorisation (art. 323-1)
  autorisation text,                                     -- sa référence : banc de l'équipe, accord écrit (D-24)…
  depot text,                                            -- W1 : le dépôt GitHub « propriétaire/nom » dont les mises en ligne déclenchent un audit
  cible_qa text,                                         -- W1 : le profil de contrats/qa.json, exploré sans connexion
  cible_pentest text,                                    -- W4 : la cible de contrats/catalogue.json…
  entree_pentest text,                                   -- … son adresse d'entrée exacte (le runner la revérifie)…
  scenario_pentest text,                                 -- … et le scénario joué
  pentest_actif boolean not null default false,          -- W4 ne lance rien tant que l'équipe ne l'a pas activé
  pentest_frequence_jours integer not null default 7 check (pentest_frequence_jours between 1 and 90),
  pentest_alerte_le timestamptz,                         -- l'alerte « 3 échecs » déjà envoyée ; remise à zéro après un succès
  email_alertes text,                                    -- W3 : le destinataire des e-mails ; vide = ticket seul
  cree_le timestamptz not null default now()
);

-- ── Les constats : une ligne par faille prouvée, avec le suivi de son alerte ────────────────────────────
-- Jamais de donnée de l'application testée : un chemin, des catégories de données, des raisons. Pas ce que l'agent a vu.

create table if not exists public.constats (
  id uuid primary key default gen_random_uuid(),
  cree_le timestamptz not null default now(),
  application_id text not null references public.applications (id),
  audit_id uuid references public.audits (id) on delete set null,
  audit_le timestamptz not null default now(),
  version text,                                          -- le commit ou la version testée, si on la connaît
  theme text not null check (theme in ('lecture', 'ecriture', 'admin', 'compte', 'qa')),  -- compte : un autre compte lit ; qa : écart fonctionnel
  methode text not null default 'GET' check (methode in ('GET', 'POST', 'PUT', 'PATCH', 'DELETE')),
  chemin text not null check (chemin like '/%' and length(chemin) <= 300),
  gravite text not null check (gravite in ('faible', 'moyenne', 'élevée', 'critique')),
  raisons text[] not null default '{}',                  -- celles de la règle écrite (runner/gravite.py)
  donnees text[] not null default '{}',                  -- des catégories (« salaires »), jamais des valeurs
  similarite numeric check (similarite between 0 and 1),
  seuil numeric not null default 0.95,
  confirme_ecran boolean not null default false,
  session_h text,                                        -- la session H de la preuve : jamais dans le ticket
  piste text,                                            -- une piste de correction, par modèle de règle
  critere text check (critere is null or length(critere) <= 200),  -- QA : le critère en écart, tiré du plan (jamais du site)
  preuve text check (preuve is null or length(preuve) <= 600),     -- comment c'est prouvé, quand ce n'est pas un rejeu A/B
  empreinte text generated always as (application_id || '|' || theme || '|' || methode || '|' || chemin || coalesce('|' || critere, '')) stored,
  alerte_statut text not null default 'a_traiter' check (alerte_statut in ('a_traiter', 'en_cours', 'traitee', 'echec')),
  alerte_tentatives integer not null default 0,
  alerte_prise_le timestamptz,
  github_issue_number integer,
  email_envoye boolean,
  alerte_erreur text,
  alerte_traitee_le timestamptz
);
create index if not exists constats_empreinte_idx on public.constats (empreinte, cree_le);
create index if not exists constats_alerte_idx on public.constats (alerte_statut, cree_le);

-- Migration du 19/11 (D-42), pour une base créée avant : les écarts QA et les failles d'une mission pentest.
-- L'empreinte d'une faille sans critère ne change pas : ses tickets existants restent reconnus.
alter table public.constats drop constraint if exists constats_theme_check;
alter table public.constats add constraint constats_theme_check check (theme in ('lecture', 'ecriture', 'admin', 'compte', 'qa'));
alter table public.constats add column if not exists critere text check (critere is null or length(critere) <= 200);
alter table public.constats add column if not exists preuve text check (preuve is null or length(preuve) <= 600);
do $$ begin
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'constats'
                  and column_name = 'empreinte' and generation_expression like '%critere%') then
    drop index if exists public.constats_empreinte_idx;
    alter table public.constats drop column empreinte;
    alter table public.constats add column empreinte text generated always as
      (application_id || '|' || theme || '|' || methode || '|' || chemin || coalesce('|' || critere, '')) stored;
    create index constats_empreinte_idx on public.constats (empreinte, cree_le);
  end if;
end $$;

-- Comme les autres tables : RLS sans politique. Seule la clé secrète (serveur, runner, n8n) lit et écrit.
alter table public.applications enable row level security;
alter table public.constats enable row level security;

insert into public.applications (id, nom, origine, autorisee, autorisation, cible_qa, cible_pentest, entree_pentest, scenario_pentest)
values
  ('paie-express', 'Paie Express', 'http://localhost:3000', true, 'Banc construit par l''équipe (sentinelqa/cobaye)', null, null, null, null),
  ('peer-review', 'Peer Review', 'https://peer-review-black.vercel.app', true, 'D-24 : accord écrit déclaré par Aurian, consultation seule',
   null, 'peer-review', 'https://peer-review-black.vercel.app/etudiant', 'S-PEER-01'),
  ('eugenia-public', 'Eugenia School', 'https://www.eugeniaschool.com', true, 'D-24 : accord écrit déclaré par Aurian, consultation seule',
   'eugenia-public', null, null, null)
on conflict (id) do nothing;

-- ── Petites aides de rédaction ────────────────────────────────────────────────────────────────────────

create or replace function public.alerte_html(t text) returns text language sql immutable as $$
  select replace(replace(replace(coalesce(t, ''), '&', '&amp;'), '<', '&lt;'), '>', '&gt;')
$$;

create or replace function public.alerte_gravite_titre(g text) returns text language sql immutable as $$
  select case g when 'critique' then 'Critique' when 'élevée' then 'Élevée' when 'moyenne' then 'Moyenne' else 'Faible' end
$$;

create or replace function public.alerte_phrase(theme text) returns text language sql immutable as $$
  select case theme when 'lecture' then 'Une autre entreprise peut lire'
                    when 'ecriture' then 'Une autre entreprise peut modifier'
                    when 'compte' then 'Un autre compte peut lire'
                    when 'qa' then 'Écart fonctionnel sur'
                    else 'Un salarié peut accéder à' end
$$;

create or replace function public.alerte_type(theme text) returns text language sql immutable as $$
  select case theme when 'lecture' then 'Lecture par une autre entreprise'
                    when 'ecriture' then 'Modification par une autre entreprise'
                    when 'compte' then 'Lecture par un autre compte'
                    when 'qa' then 'Écart fonctionnel (QA)'
                    else 'Accès d''un salarié à une partie réservée' end
$$;

create or replace function public.alerte_majuscule(t text) returns text language sql immutable as $$
  select upper(left(t, 1)) || substr(t, 2)
$$;

-- ── W3 · une faille prouvée → un ticket et un e-mail ──────────────────────────────────────────────────

-- Ce que n8n doit faire pour ce constat, avec le ticket et l'e-mail déjà rédigés.
-- action : creer_ticket (faille nouvelle), commenter_ticket (déjà connue : n8n rouvre si le ticket est fermé),
-- attendre (la même faille est en cours d'alerte) ou aucune (constat inconnu ou déjà traité).
create or replace function public.preparer_alerte(p_constat_id uuid, p_url_releve_base text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  c public.constats;
  app public.applications;
  ticket integer;
  action text;
  g text;
  quand text;
  version_txt text;
  acces text;
  lien text;
  donnees_txt text;
  raisons_txt text;
  preuve_txt text;
  corps text;
begin
  select * into c from public.constats where id = p_constat_id for update;
  if not found then
    return jsonb_build_object('constat_id', p_constat_id, 'action', 'aucune', 'raison', 'constat inconnu');
  end if;
  if c.alerte_statut = 'traitee' then
    return jsonb_build_object('constat_id', c.id, 'action', 'aucune', 'raison', 'alerte déjà traitée');
  end if;
  if c.alerte_statut = 'en_cours' and c.alerte_prise_le > now() - interval '10 minutes' then
    return jsonb_build_object('constat_id', c.id, 'action', 'aucune', 'raison', 'alerte déjà en cours');
  end if;
  -- Deux constats de la même faille en même temps : un seul crée le ticket, l'autre attend le rattrapage.
  perform pg_advisory_xact_lock(hashtext(c.empreinte));
  if exists (select 1 from public.constats o
             where o.empreinte = c.empreinte and o.id <> c.id and o.alerte_statut = 'en_cours'
               and o.github_issue_number is null and o.alerte_prise_le > now() - interval '10 minutes') then
    return jsonb_build_object('constat_id', c.id, 'action', 'attendre', 'raison', 'la même faille est en cours d''alerte');
  end if;

  select * into app from public.applications where id = c.application_id;
  select o.github_issue_number into ticket from public.constats o
   where o.empreinte = c.empreinte and o.github_issue_number is not null order by o.cree_le limit 1;
  action := case when ticket is null then 'creer_ticket' else 'commenter_ticket' end;
  update public.constats set alerte_statut = 'en_cours', alerte_prise_le = now(), alerte_tentatives = alerte_tentatives + 1
   where id = c.id;

  g := public.alerte_gravite_titre(c.gravite);
  quand := to_char(c.audit_le at time zone 'Europe/Paris', 'DD/MM/YYYY "à" HH24 "h" MI');
  version_txt := case when c.version is null then 'version non renseignée' else 'version testée `' || c.version || '`' end;
  acces := c.methode || ' ' || c.chemin;
  donnees_txt := coalesce(nullif(array_to_string(array(select public.alerte_majuscule(d) from unnest(c.donnees) d), ', '), ''),
                          'Aucune donnée personnelle détectée');
  raisons_txt := coalesce(nullif(array_to_string(array(select '- ' || public.alerte_majuscule(r) || '.' from unnest(c.raisons) r), E'\n'), ''),
                          '- Règle de gravité appliquée sans raison détaillée.');
  preuve_txt := coalesce(c.preuve, '1. **Rejeu HTTP :** ' ||
                case when c.similarite is null then 'non mesuré.'
                     else 'le compte de test redemande la page et reçoit la même réponse (similarité '
                          || replace(to_char(c.similarite, 'FM0.00'), '.', ',') || ' ; seuil '
                          || replace(to_char(c.seuil, 'FM0.00'), '.', ',') || ').' end || E'\n' ||
                '2. **Confirmation à l''écran :** ' ||
                case when c.confirme_ecran then 'notre agent, connecté avec le compte de test concerné, a ouvert la page et l''a vue.'
                     else 'non confirmée par l''agent.' end);
  lien := case when nullif(p_url_releve_base, '') is not null and c.audit_id is not null
               then rtrim(p_url_releve_base, '/') || '/' || c.audit_id end;

  corps := '## ' || case when c.theme = 'qa' then 'Écart fonctionnel constaté' else 'Faille prouvée' end || ' par HSentinel' || E'\n\n' ||
           '| | |' || E'\n' || '|---|---|' || E'\n' ||
           '| **Application** | ' || app.nom || ' |' || E'\n' ||
           '| **Gravité** | ' || g || ' |' || E'\n' ||
           '| **Accès** | `' || acces || '` |' || E'\n' ||
           '| **Type** | ' || public.alerte_type(c.theme) || ' |' || E'\n' ||
           case when c.theme = 'qa' then '| **Critère** | ' || coalesce(c.critere, '—') || ' |'
                else '| **Données exposées** | ' || donnees_txt || ' |' end || E'\n' ||
           '| **Audit** | ' || quand || ' · ' || version_txt || ' |' || E'\n\n' ||
           '### Pourquoi « ' || c.gravite || ' »' || E'\n' || raisons_txt || E'\n\n' ||
           '### Comment c''est prouvé' || E'\n' || preuve_txt || E'\n\n' ||
           '### Voir la preuve' || E'\n' ||
           case when lien is null then 'Relevé consultable dans HSentinel, après connexion.'
                else '[Le relevé de l''audit](' || lien || '), consultable après connexion.' end ||
           case when c.piste is null then '' else E'\n\n### Piste de correction\n' || c.piste end ||
           E'\n\n---\n*Ticket créé automatiquement par HSentinel. Il ne contient aucune donnée de l''application testée.*';

  return jsonb_build_object(
    'constat_id', c.id,
    'action', action,
    'github_issue_number', ticket,
    'titre', case when c.theme = 'qa'
                  then '[HSentinel · QA · ' || g || '] ' || public.alerte_phrase(c.theme) || ' ' || acces || coalesce(' : ' || c.critere, '')
                  else '[HSentinel · ' || g || '] ' || public.alerte_phrase(c.theme) || ' ' || acces end,
    'corps_ticket', corps,
    'etiquettes', case when c.theme = 'qa' then jsonb_build_array('qa', 'hsentinel', 'regression')
                       else jsonb_build_array('securite', 'hsentinel', 'gravite:' || translate(c.gravite, 'é', 'e')) end,
    'gravite', g,
    'gravite_permet_email', c.gravite <> 'faible',
    'email_alertes', nullif(app.email_alertes, ''),
    'email_sujet', '[HSentinel · ' || g || '] ' ||
                   case when c.theme = 'qa' then case when action = 'creer_ticket' then 'Écart fonctionnel constaté' else 'Écart fonctionnel réapparu' end
                        when action = 'creer_ticket' then 'Faille prouvée' else 'Faille réapparue' end ||
                   ' sur ' || app.nom || ' : ' || acces,
    'email_html',
      '<p>HSentinel a ' || case when action = 'creer_ticket' then 'prouvé' else 'de nouveau prouvé' end ||
      ' ' || case when c.theme = 'qa' then 'un écart fonctionnel' else 'une faille' end ||
      ' de gravité <strong>' || g || '</strong> sur <strong>' || public.alerte_html(app.nom) || '</strong>.</p>' ||
      '<ul><li>Accès : <code>' || public.alerte_html(acces) || '</code></li>' ||
      case when c.theme = 'qa' then '<li>Critère : ' || public.alerte_html(coalesce(c.critere, '—')) || '</li>'
           else '<li>Données exposées : ' || public.alerte_html(donnees_txt) || '</li>' end ||
      '<li>Audit : ' || public.alerte_html(quand) || '</li></ul>' ||
      '<p>Le détail et la preuve sont dans le ticket : <a href="%%LIEN_TICKET%%">ouvrir le ticket</a>.</p>' ||
      '<p style="color:#5b6472">E-mail envoyé automatiquement par HSentinel. Il ne contient aucune donnée de l''application testée.</p>',
    'commentaire_toujours',
      case when c.theme = 'qa' then '**Toujours présent**' else '**Toujours présente**' end ||
      ' lors de l''audit du ' || quand || ' (' || version_txt || '). Gravité : ' || g || '.',
    'commentaire_reapparue',
      case when c.theme = 'qa' then '**L''écart est réapparu**' else '**La faille est réapparue**' end ||
      ' lors de l''audit du ' || quand || ' (' || version_txt ||
      '), alors que ce ticket était fermé : il est rouvert. Gravité : ' || g || '.'
  );
end $$;

-- Le résultat rendu par n8n : traitee (ticket fait, e-mail envoyé ou non) ou echec (à reprendre par le rattrapage).
create or replace function public.noter_alerte(p_constat_id uuid, p_statut text, p_github_issue_number integer default null,
                                               p_email_envoye boolean default false, p_erreur text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  statut text := case when p_statut in ('traitee', 'echec') then p_statut else 'echec' end;
begin
  update public.constats
     set alerte_statut = statut,
         github_issue_number = coalesce(p_github_issue_number, github_issue_number),
         email_envoye = coalesce(p_email_envoye, false),
         alerte_erreur = left(p_erreur, 500),
         alerte_traitee_le = now()
   where id = p_constat_id;
  return jsonb_build_object('constat_id', p_constat_id, 'statut', statut, 'enregistre', found);
end $$;

-- Le rattrapage de W3 (toutes les 15 min) : ce qui n'a pas abouti, sans doubler l'appel en cours d'un constat neuf.
create or replace function public.constats_a_alerter()
returns table (constat_id uuid) language sql security definer set search_path = public as $$
  select c.id
    from public.constats c
   where c.alerte_tentatives < 10
     and c.cree_le > now() - interval '7 days'
     and ((c.alerte_statut = 'a_traiter' and c.cree_le < now() - interval '2 minutes')
          or c.alerte_statut = 'echec'
          or (c.alerte_statut = 'en_cours' and c.alerte_prise_le < now() - interval '10 minutes'))
   order by c.cree_le
   limit 20
$$;

-- Chaque nouveau constat appelle W3 (le webhook de base), avec l'en-tête secret. Sans réglage, rien n'est appelé :
-- le rattrapage prendra le constat. Une alerte qui échoue ne fait jamais perdre un constat.
create or replace function public.constat_ajoute() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  url text;
  secret text;
begin
  select decrypted_secret into url from vault.decrypted_secrets where name = 'hsentinel_w3_url' limit 1;
  select decrypted_secret into secret from vault.decrypted_secrets where name = 'hsentinel_w3_secret' limit 1;
  if url is null or secret is null then
    return new;
  end if;
  perform net.http_post(
    url := url,
    body := jsonb_build_object('record', jsonb_build_object('id', new.id)),
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-hsentinel-secret', secret),
    timeout_milliseconds := 5000);
  return new;
exception when others then
  raise warning 'W3 non appelé pour le constat % : %', new.id, sqlerrm;
  return new;
end $$;

drop trigger if exists constat_ajoute on public.constats;
create trigger constat_ajoute after insert on public.constats for each row execute function public.constat_ajoute();

-- ── W4 · chaque nuit, les pentests dus ────────────────────────────────────────────────────────────────

-- Une demande au format du premier lot (rapport.schema_version 2), que lit le runner du pentest.
-- Pas de doublon ; arrêt après 3 échecs d'affilée, avec une seule alerte, jusqu'au prochain succès.
create or replace function public.creer_demandes_pentest()
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  app public.applications;
  creees jsonb := '[]'::jsonb;
  refusees jsonb := '[]'::jsonb;
  alertes jsonb := '[]'::jsonb;
  dernier_succes timestamptz;
  derniere timestamptz;
  echecs integer;
  nouvelle uuid;
begin
  for app in select * from public.applications where pentest_actif and scenario_pentest is not null order by id loop
    if not app.autorisee or app.cible_pentest is null or app.entree_pentest is null then
      refusees := refusees || jsonb_build_object('application', app.nom, 'raison', 'autorisation ou cible manquante');
      continue;
    end if;
    if exists (select 1 from public.audits a
                where a.statut in ('en_attente', 'en_cours')
                  and a.rapport -> 'request' ->> 'target_id' = app.cible_pentest
                  and a.rapport -> 'request' ->> 'scenario_id' = app.scenario_pentest) then
      refusees := refusees || jsonb_build_object('application', app.nom, 'raison', 'une demande est déjà en file ou en cours');
      continue;
    end if;
    select max(coalesce(a.fin, a.cree_le)) into dernier_succes from public.audits a
     where a.statut = 'termine' and a.rapport -> 'request' ->> 'target_id' = app.cible_pentest
       and a.rapport -> 'request' ->> 'scenario_id' = app.scenario_pentest;
    if dernier_succes is not null and app.pentest_alerte_le is not null and dernier_succes > app.pentest_alerte_le then
      update public.applications set pentest_alerte_le = null where id = app.id;
      app.pentest_alerte_le := null;
    end if;
    select count(*) into echecs from public.audits a
     where a.statut = 'echec' and a.rapport -> 'request' ->> 'target_id' = app.cible_pentest
       and a.rapport -> 'request' ->> 'scenario_id' = app.scenario_pentest
       and a.cree_le > coalesce(dernier_succes, '-infinity'::timestamptz);
    if echecs >= 3 then
      if app.pentest_alerte_le is null then
        alertes := alertes || jsonb_build_object('application', app.nom, 'echecs', echecs,
                                                 'dernier_succes', to_char(dernier_succes at time zone 'Europe/Paris', 'DD/MM/YYYY HH24:MI'));
        update public.applications set pentest_alerte_le = now() where id = app.id;
      end if;
      refusees := refusees || jsonb_build_object('application', app.nom, 'raison', echecs || ' échecs d''affilée');
      continue;
    end if;
    select max(a.cree_le) into derniere from public.audits a
     where a.rapport -> 'request' ->> 'target_id' = app.cible_pentest
       and a.rapport -> 'request' ->> 'scenario_id' = app.scenario_pentest;
    if derniere is not null and derniere > now() - make_interval(days => app.pentest_frequence_jours) then
      continue;
    end if;
    insert into public.audits (statut, application, cible, comptes, perimetre, ecriture_autorisee, rapport)
    values ('en_attente', app.nom, app.entree_pentest, '[]'::jsonb, '[]'::jsonb, false,
            jsonb_build_object('schema_version', 2, 'phase', 'queued',
                               'request', jsonb_build_object('target_id', app.cible_pentest, 'scenario_id', app.scenario_pentest,
                                                             'mode', 'security', 'instruction', '')))
    returning id into nouvelle;
    creees := creees || jsonb_build_object('application', app.nom, 'audit_id', nouvelle, 'scenario', app.scenario_pentest);
  end loop;
  return jsonb_build_object('creees', creees, 'refusees', refusees, 'alertes', alertes);
end $$;

-- ── W1 · une mise en ligne → un audit QA ──────────────────────────────────────────────────────────────

-- La base vérifie la signature GitHub (secret du coffre), ne garde que les déploiements réussis d'une application
-- autorisée qui a un profil QA, remplace la demande encore en attente, et crée une exploration bornée dans qa_missions.
create or replace function public.creer_demande_audit_github(p_corps text, p_signature text, p_evenement text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  secret text;
  attendu text;
  charge jsonb;
  v_depot text;
  v_sha text;
  etat text;
  app public.applications;
  nouvelle uuid;
begin
  if coalesce(p_evenement, '') <> 'deployment_status' then
    return jsonb_build_object('action', 'ignore', 'raison', 'événement non suivi : ' || coalesce(p_evenement, 'aucun'));
  end if;
  select decrypted_secret into secret from vault.decrypted_secrets where name = 'github_webhook_secret' limit 1;
  if secret is null then
    return jsonb_build_object('action', 'refuse', 'raison', 'secret du webhook GitHub absent du coffre');
  end if;
  attendu := 'sha256=' || encode(extensions.hmac(convert_to(coalesce(p_corps, ''), 'UTF8'), convert_to(secret, 'UTF8'), 'sha256'), 'hex');
  if p_signature is null or p_signature <> attendu then
    return jsonb_build_object('action', 'refuse', 'raison', 'signature GitHub invalide');
  end if;
  begin
    charge := p_corps::jsonb;
  exception when others then
    return jsonb_build_object('action', 'refuse', 'raison', 'corps illisible');
  end;
  v_depot := charge -> 'repository' ->> 'full_name';
  v_sha := charge -> 'deployment' ->> 'sha';
  etat := charge -> 'deployment_status' ->> 'state';
  if coalesce(etat, '') <> 'success' then
    return jsonb_build_object('action', 'ignore', 'raison', 'déploiement pas encore prêt : ' || coalesce(etat, 'inconnu'));
  end if;
  select * into app from public.applications where depot = v_depot;
  if not found or not app.autorisee or app.cible_qa is null then
    return jsonb_build_object('action', 'refuse', 'raison', 'application inconnue, non autorisée ou sans profil QA',
                              'depot_proprietaire', split_part(v_depot, '/', 1), 'depot_nom', split_part(v_depot, '/', 2), 'sha', v_sha);
  end if;
  update public.qa_missions
     set statut = 'echec', fin = now(), erreur = 'Remplacée par une mise en ligne plus récente (W1).'
   where statut = 'en_attente' and cible = app.cible_qa and demande ->> 'instruction' like 'Mise en ligne %';
  insert into public.qa_missions (cible, demande)
  values (app.cible_qa, jsonb_build_object(
            'schema_version', 3, 'mode', 'qa', 'target_id', app.cible_qa, 'pilotage', 'exploration', 'appareil', 'ordinateur',
            'instruction', 'Mise en ligne ' || left(coalesce(v_sha, 'inconnue'), 7) || ' : exploration bornée du site.',
            'source', 'texte', 'modele_h', 'holo4-35b-a3b', 'preparation_humaine_s', null, 'plan', null))
  returning id into nouvelle;
  return jsonb_build_object('action', 'audit_cree', 'raison', null, 'audit_id', nouvelle,
                            'depot_proprietaire', split_part(v_depot, '/', 1), 'depot_nom', split_part(v_depot, '/', 2), 'sha', v_sha);
end $$;

-- ── Droits : seule la clé secrète appelle ces fonctions (n8n, le runner) ──────────────────────────────

revoke all on function public.preparer_alerte(uuid, text) from public, anon, authenticated;
revoke all on function public.noter_alerte(uuid, text, integer, boolean, text) from public, anon, authenticated;
revoke all on function public.constats_a_alerter() from public, anon, authenticated;
revoke all on function public.creer_demandes_pentest() from public, anon, authenticated;
revoke all on function public.creer_demande_audit_github(text, text, text) from public, anon, authenticated;
revoke all on function public.constat_ajoute() from public, anon, authenticated;
grant execute on function public.preparer_alerte(uuid, text) to service_role;
grant execute on function public.noter_alerte(uuid, text, integer, boolean, text) to service_role;
grant execute on function public.constats_a_alerter() to service_role;
grant execute on function public.creer_demandes_pentest() to service_role;
grant execute on function public.creer_demande_audit_github(text, text, text) to service_role;

-- ── Les réglages, une fois, dans l'éditeur SQL de Supabase (jamais dans ce fichier ni dans une conversation) ──
-- select vault.create_secret('https://jahdiel13ms.app.n8n.cloud/webhook/hsentinel-w3-constat', 'hsentinel_w3_url');
-- select vault.create_secret('<la valeur de l''identifiant n8n « Secret webhook Supabase W3 »>', 'hsentinel_w3_secret');
-- select vault.create_secret('<le secret du webhook GitHub de W1>', 'github_webhook_secret');
-- update public.applications set email_alertes = '<adresse>' where id = 'paie-express';   -- pour recevoir les e-mails de W3
