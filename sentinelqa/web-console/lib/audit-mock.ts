import type { AuditDetail, AuditModule, AuditResponse, Deployment, RoleMatrix } from './audit-types'

const ACTIONS = ['Voir bulletins Alpha', 'Exporter salaires Alpha', 'Modifier IBAN Alpha', 'Voir bulletins Bêta']

const ROLES = [
  { role: 'Admin', tenant: 'Alpha (A)' },
  { role: 'Comptable', tenant: 'Alpha (C)' },
  { role: 'Admin', tenant: 'Bêta (B)' },
]

function matrix(leak: boolean): RoleMatrix {
  return {
    actions: ACTIONS,
    rows: [
      { ...ROLES[0], cells: ['allowed', 'allowed', 'allowed', 'blocked'] },
      { ...ROLES[1], cells: ['allowed', 'allowed', 'blocked', 'blocked'] },
      { ...ROLES[2], cells: [leak ? 'leak' : 'blocked', 'blocked', 'blocked', 'allowed'] },
    ],
  }
}

function audit(id: string, leak: boolean, durationSeconds: number, costUsd: number, pages: number): AuditDetail {
  return {
    id,
    durationSeconds,
    costUsd,
    pipeline: [
      {
        id: 'explore',
        title: 'Explorateur',
        actor: 'agent',
        actorLabel: 'agent H',
        description: `Cartographie l’application en tant que A et C : ${pages} pages, 41 requêtes authentifiées.`,
        meta: `${Math.round(durationSeconds * 0.45)} s`,
        status: 'done',
      },
      {
        id: 'replay',
        title: 'Rejeu HTTP',
        actor: 'code',
        actorLabel: 'notre code',
        description: 'B redemande chacune des pages de A avec sa propre session.',
        meta: leak ? '41 requêtes · 1 réponse 200 suspecte' : '41 requêtes · 0 réponse suspecte',
        status: 'done',
      },
      {
        id: 'verify',
        title: 'Vérificateur',
        actor: 'agent',
        actorLabel: 'agent H',
        description: leak
          ? 'Ouvre la page en tant que B et confirme que les salaires d’Alpha s’affichent.'
          : 'Ouvre les pages en tant que B : aucun contenu d’Alpha n’est visible.',
        meta: `${Math.round(durationSeconds * 0.35)} s`,
        status: 'done',
      },
      leak
        ? {
            id: 'proof',
            title: 'Faille prouvée',
            actor: 'result',
            actorLabel: 'résultat',
            description: 'Lecture inter-entreprises confirmée par rejeu et par navigateur.',
            meta: 'critique',
            status: 'proven',
          }
        : {
            id: 'proof',
            title: 'Aucune faille',
            actor: 'result',
            actorLabel: 'résultat',
            description: 'Toutes les frontières entre Alpha et Bêta tiennent.',
            meta: 'contrôles sûrs',
            status: 'clear',
          },
    ],
    matrix: matrix(leak),
    finding: leak
      ? {
          id: 'HS-2026-0142',
          severity: 'critique',
          title: 'Une autre entreprise peut lire les salaires de vos employés',
          summary:
            'Un administrateur de Bêta obtient les bulletins de paie d’Alpha en changeant l’identifiant d’entreprise dans l’URL. Le serveur ne vérifie pas que le bulletin appartient à l’entreprise de la session.',
          endpoint: 'GET /api/companies/alpha/payslips?month=2026-10',
          replay: {
            request: [
              'GET /api/companies/alpha/payslips?month=2026-10 HTTP/1.1',
              'Host: preprod.paie-express.fr',
              'Cookie: session=beta_admin_••••••••',
              'Accept: application/json',
            ].join('\n'),
            response: [
              'HTTP/1.1 200 OK',
              'Content-Type: application/json',
              '',
              '[',
              '  { "employee": "M. Laurent", "net": 3412.50, "iban": "FR76 •••• 0291" },',
              '  { "employee": "S. Haddad",  "net": 2987.10, "iban": "FR76 •••• 7713" },',
              '  … 46 autres lignes',
              ']',
            ].join('\n'),
          },
          report: [
            'Impact : 48 bulletins de paie d’Alpha (noms, salaires nets, IBAN partiels) lisibles par n’importe quel administrateur d’une autre entreprise.',
            'Cause : le contrôleur payslips filtre par companyId issu de l’URL au lieu de celui porté par la session.',
            'Correctif : dériver companyId de la session et renvoyer 404 si la ressource n’appartient pas à l’entreprise courante.',
            'Preuve : rejeu HTTP (200 au lieu de 403/404) + capture du Vérificateur affichant la page en tant que B.',
          ],
          alerts: {
            ticket: { id: 'HS-2026-0142', url: 'https://github.com/paie-express/paie-api/issues/142' },
            email: { via: 'n8n', recipients: 'équipe sécurité' },
          },
        }
      : null,
  }
}

function qaAudit(id: string, durationSeconds: number, costUsd: number, journeys: number): AuditDetail {
  return {
    id,
    durationSeconds,
    costUsd,
    pipeline: [
      {
        id: 'explore',
        title: 'Explorateur',
        actor: 'agent',
        actorLabel: 'agent H',
        description: `Parcourt les parcours métier en tant que A, C et B : ${journeys} parcours, 64 écrans.`,
        meta: `${Math.round(durationSeconds * 0.45)} s`,
        status: 'done',
      },
      {
        id: 'replay',
        title: 'Rejeu HTTP',
        actor: 'code',
        actorLabel: 'notre code',
        description: 'Rejoue chaque parcours attendu et compare les réponses à la référence du déploiement précédent.',
        meta: `${journeys} parcours · 0 écart`,
        status: 'done',
      },
      {
        id: 'verify',
        title: 'Vérificateur',
        actor: 'agent',
        actorLabel: 'agent H',
        description: 'Vérifie à l’écran que chaque rôle obtient le résultat attendu : bulletins, exports, IBAN.',
        meta: `${Math.round(durationSeconds * 0.35)} s`,
        status: 'done',
      },
      {
        id: 'proof',
        title: 'Aucune régression',
        actor: 'result',
        actorLabel: 'résultat',
        description: 'Tous les parcours autorisés fonctionnent, tous les refus attendus sont maintenus.',
        meta: 'parcours conformes',
        status: 'clear',
      },
    ],
    matrix: matrix(false),
    finding: null,
  }
}

const pentestDeployments: Deployment[] = [
  {
    id: 'dep_8f21c',
    module: 'pentest',
    commit: '8f21c4e',
    message: 'Refonte de l’export des bulletins',
    author: 'camille.r',
    branch: 'preprod',
    at: '2026-11-18T09:42:00Z',
    vulnerabilities: 1,
    audit: audit('aud_8f21c', true, 349, 0.21, 27),
  },
  {
    id: 'dep_71a0e',
    module: 'pentest',
    commit: '71a0e9b',
    message: 'Ajout du filtre par service',
    author: 'nicolas.b',
    branch: 'preprod',
    at: '2026-11-17T16:05:00Z',
    vulnerabilities: 0,
    audit: audit('aud_71a0e', false, 214, 0.16, 24),
  },
  {
    id: 'dep_5c3d9',
    module: 'pentest',
    commit: '5c3d902',
    message: 'Correctif arrondi des cotisations',
    author: 'camille.r',
    branch: 'preprod',
    at: '2026-11-17T10:18:00Z',
    vulnerabilities: 0,
    audit: audit('aud_5c3d9', false, 170, 0.13, 22),
  },
  {
    id: 'dep_2b7f4',
    module: 'pentest',
    commit: '2b7f411',
    message: 'Mise à jour des dépendances',
    author: 'dependabot',
    branch: 'preprod',
    at: '2026-11-16T08:31:00Z',
    vulnerabilities: 0,
    audit: audit('aud_2b7f4', false, 188, 0.14, 22),
  },
]

const QA_TIMING: Record<string, [number, number, number]> = {
  dep_8f21c: [262, 0.15, 18],
  dep_71a0e: [231, 0.14, 17],
  dep_5c3d9: [198, 0.12, 16],
  dep_2b7f4: [205, 0.12, 16],
}

const qaDeployments: Deployment[] = pentestDeployments.map((dep) => {
  const [duration, cost, journeys] = QA_TIMING[dep.id]
  return {
    ...dep,
    id: `${dep.id}_qa`,
    module: 'qa',
    vulnerabilities: 0,
    audit: qaAudit(`${dep.audit.id}_qa`, duration, cost, journeys),
  }
})

const deployments: Deployment[] = [...pentestDeployments, ...qaDeployments]

export function getMockAudit(): AuditResponse {
  return {
    source: 'mock',
    context: {
      app: 'Paie Express',
      environment: 'préprod',
      tenants: 'Alpha (A,C) vs Bêta (B)',
      ownershipVerified: true,
    },
    kpis: [
      { id: 'detection', label: 'Détection', value: '59/60', hint: 'failles du banc d’essai trouvées' },
      { id: 'false-positives', label: 'Fausses alertes', value: '0', hint: 'chaque faille est prouvée' },
      { id: 'duration', label: 'Durée', value: '170–349 s', hint: 'par déploiement' },
    ],
    deployments,
  }
}

const SIM_MESSAGES = [
  'Pagination de la liste des salariés',
  'Nouveau modèle de bulletin PDF',
  'Cache des taux de cotisation',
  'Renommage des rôles comptables',
]

export function simulateDeployment(module: AuditModule = 'pentest'): Deployment {
  const hex = Math.random().toString(16).slice(2, 9)
  const duration = 170 + Math.floor(Math.random() * 180)
  const cost = Math.round((0.13 + Math.random() * 0.08) * 100) / 100
  const auditId = `aud_${hex.slice(0, 5)}`
  return {
    id: `dep_${hex.slice(0, 5)}`,
    module,
    commit: hex,
    message: SIM_MESSAGES[Math.floor(Math.random() * SIM_MESSAGES.length)],
    author: 'simulation',
    branch: 'preprod',
    at: new Date().toISOString(),
    vulnerabilities: 0,
    audit:
      module === 'qa'
        ? qaAudit(auditId, duration, cost, 16 + Math.floor(Math.random() * 4))
        : audit(auditId, false, duration, cost, 22 + Math.floor(Math.random() * 6)),
  }
}
