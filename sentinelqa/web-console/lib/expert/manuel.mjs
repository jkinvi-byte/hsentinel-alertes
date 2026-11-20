// LE MANUEL HSENTINEL (D-51) : le corpus des deux experts du studio, QA et Pentest.
// Même mécanique que le Manuel du Sommet de LEVELS : des fiches canoniques et publiques (id, alias, faits),
// une recherche lexicale (embeddings inutiles à ce volume), et l'état de la mission à part (le digest).
// Jamais ici : un chiffre qui bouge (il vient du digest), une donnée d'un site testé, un historique de développement.
// Sources : MARQUE.md (lexique), ARCHITECTURE.md, contrats/catalogue.json et qa.json, textes du studio.

export const MANUEL = [
  // ── Commun aux deux experts ──
  { id: 'hsentinel', volet: 'commun', aliases: ['hsentinel', 'c est quoi', 'a quoi sert', 'comment ca marche', 'le produit', 'principe'], faits: [
    'HSentinel envoie des agents H (H Company) qui utilisent un navigateur comme un humain, sur deux volets : le QA fonctionnel, qui vérifie qu’un site fait ce qu’on attend, et le Pentest, qui cherche un accès qui devrait être impossible.',
    'L’agent montre, le code décide : un verdict ne repose jamais sur la seule parole de l’agent.',
  ] },
  { id: 'autorisation', volet: 'commun', aliases: ['autorisation', 'autorise', 'legal', '323', 'droit de tester', 'permission', 'quel site', 'n importe quel site', 'ajouter un site', 'ajouter une application', 'nouvelle cible'], faits: [
    'On ne teste que des sites que l’on contrôle, ou pour lesquels on a une autorisation écrite de leur responsable (article 323-1 du Code pénal).',
    'Votre propre site s’ajoute vous-même, dans la console : Applications, puis « Ajouter une application ». Vous donnez son adresse et cochez l’attestation, vous publiez sur le site un jeton de vérification (un fichier ou une balise), puis vous ajoutez un compte de test si le site a une connexion. Aucune mission ne part avant que HSentinel ait relu le jeton.',
    'Une application ajoutée s’ouvre au QA fonctionnel, en consultation seule ; le Pentest d’une application ajoutée n’est pas encore ouvert. Les exemples phares du catalogue restent disponibles à côté.',
  ] },
  { id: 'ajouter_application', volet: 'commun', aliases: ['mon site', 'mon application', 'mon saas', 'mon app', 'notre site', 'notre application', 'autre site', 'un autre site', 'nouveau site', 'ajouter', 'tester mon', 'pas dans la liste', 'adresse', 'url', 'jeton', 'verification', 'verifier mon site', 'propriete'], faits: [
    'Ajouter une application prend trois gestes : l’adresse et l’attestation ; le jeton de vérification publié à /.well-known/hsentinel-verification.txt ou dans une balise meta de la page d’accueil ; les comptes de test si le site a une connexion.',
    'Le jeton reste le même pour une adresse : on le publie une fois. HSentinel le relit depuis Internet, sans rien écrire sur le site, et refuse toute adresse privée ou locale.',
    'Une fois vérifiée, l’application apparaît dans la liste Application du studio : l’expert prépare la consigne, et vous lancez la mission.',
  ] },
  { id: 'preuves', volet: 'commun', aliases: ['preuve', 'preuves', 'replay', 'capture', 'captures', 'session h', 'video', 'rapport'], faits: [
    'Chaque mission garde ses preuves : les captures de l’agent et sa session H, rejouable étape par étape (un replay, pas une vidéo). En Pentest s’y ajoute la réponse HTTP du rejeu.',
  ] },
  { id: 'alertes', volet: 'commun', aliases: ['alerte', 'alertes', 'ticket', 'github', 'e mail', 'email', 'n8n', 'notification', 'slack', 'prevenir'], faits: [
    'Une faille prouvée ou un écart constaté devient un constat ; n8n en fait un ticket GitHub, un seul par faille et commenté si elle revient, et un e-mail à l’équipe.',
    'Un site tiers n’a jamais de ticket public : son constat reste réservé à la console. Il n’y a pas d’alerte Slack.',
  ] },
  { id: 'cout', volet: 'commun', aliases: ['cout', 'couts', 'prix', 'combien ca coute', 'cher', 'dollar', 'credit', 'credits', 'facture'], faits: [
    'Chaque mission affiche son coût réel, lu dans l’API H (actions et tokens) et chez Hugging Face. Les derniers coûts mesurés sur cette cible sont dans le contexte de la mission.',
  ] },
  { id: 'budget', volet: 'commun', aliases: ['arreter', 'arret', 'stop', 'annuler', 'interrompre', 'budget', 'combien de temps', 'duree', 'limite', 'actions'], faits: [
    'Chaque mission a un budget d’actions et de temps, affiché avant le lancement. Pendant le suivi, l’arrêt annule la session H et garde les preuves.',
  ] },
  { id: 'veille', volet: 'commun', aliases: ['mise a jour', 'deploiement', 'nouvelle version', 'automatique', 'veille', 'surveiller', 'chaque version'], faits: [
    'La veille relève l’empreinte de chaque site autorisé toutes les 15 minutes ; quand elle change, une exploration QA part seule.',
  ] },
  { id: 'lancer', volet: 'commun', aliases: ['lancer', 'demarrer', 'tu peux lancer', 'lance', 'go', 'executer'], faits: [
    'Quand tout est prêt (l’application est vérifiée et son compte de test enregistré, ou c’est un site public), la consigne proposée part après un compte à rebours de 4 secondes, que l’utilisateur peut annuler ; le plan est préparé par Hugging Face juste avant le lancement.',
    'Sinon, l’utilisateur reprend la consigne dans le studio, complète ce qui manque (par exemple le compte de test d’un site qui en demande un), relit le plan, puis appuie sur « Lancer la mission ».',
  ] },

  // ── QA fonctionnel ──
  { id: 'qa', volet: 'qa', aliases: ['qa', 'test fonctionnel', 'fonctionnel', 'verifier que', 'est ce que ca marche'], faits: [
    'Le QA vérifie qu’un site fait ce qu’on attend : un parcours dicté ou tapé, joué par l’agent H dans le navigateur, puis vérifié par le code.',
  ] },
  { id: 'consigne', volet: 'qa', aliases: ['consigne', 'parcours', 'guide', 'formuler', 'ecrire', 'bonne consigne', 'reformuler', 'ameliorer', 'plan', 'dicter'], faits: [
    'En parcours guidé, la consigne devient un plan de 1 à 8 étapes et 1 à 6 critères, préparé par Hugging Face et relu avant le lancement ; le modèle reste hors du verdict.',
    'Une bonne consigne dit où aller et ce qu’on doit y voir. Un texte attendu exactement se met entre guillemets.',
    'Les étapes passent par l’interface (ouvrir un menu, cliquer un lien, faire défiler), jamais par une adresse tapée.',
  ] },
  { id: 'criteres', volet: 'qa', aliases: ['critere', 'criteres', 'page', 'texte', 'constat', 'verifiable', 'assertion', 'guillemets'], faits: [
    'Trois sortes de critères : page (une page doit être atteinte, chemin exact), texte (des mots exacts, souvent entre guillemets) et constat (ce que la page doit montrer, sans mots exacts).',
    'Le code vérifie lui-même les pages et les textes. Un constat doit être cité mot pour mot par l’agent, puis retrouvé dans la page.',
  ] },
  { id: 'verdicts', volet: 'qa', aliases: ['conforme', 'ecart', 'verdict', 'resultat', 'reussi', 'echoue', 'bug'], faits: [
    'Conforme : prouvé par le code. Écart constaté : la différence est prouvée par le code (page, texte, citation, erreur HTTP). Un écart vu par l’agent seul reste « à confirmer ».',
  ] },
  { id: 'a_confirmer', volet: 'qa', aliases: ['non concluant', 'a confirmer', 'pourquoi', 'tronque', 'pas verifie', 'incertain', 'inconclusive'], faits: [
    'Un critère reste « à confirmer » quand le code ne peut pas trancher : texte tronqué dans ce que H relève, citation introuvable dans la page, page jamais atteinte.',
    'Pour l’éviter : des mots exacts courts entre guillemets, une page précise, une seule chose à vérifier par critère.',
  ] },
  { id: 'exploration', volet: 'qa', aliases: ['exploration', 'explorer', 'sans consigne', 'menu', 'survol', 'decouvrir'], faits: [
    'Sans consigne, l’exploration bornée ouvre le menu principal et relève les problèmes visibles sur quelques pages au plus (6 par défaut) ; chaque constat garde sa capture.',
  ] },
  { id: 'compte_test', volet: 'qa', aliases: ['compte', 'connexion', 'connecte', 'mot de passe', 'identifiant', 'login', 'se connecter', 'coffre'], faits: [
    'Sur une cible qui demande une connexion, le QA utilise un compte de test : le mot de passe est chiffré dans le navigateur, rangé dans un coffre H le temps de la mission, puis supprimé. L’agent ne le voit jamais.',
    'Sur une application ajoutée, les comptes de test s’enregistrent une fois, sur sa page (Applications) : libellé, identifiant, mot de passe et nom affiché une fois connecté. Le mot de passe reste chiffré pour le runner ; dans le studio, on choisit simplement le compte.',
    'La connexion et l’identité du compte sont vérifiées par le code avant le reste du parcours.',
  ] },
  { id: 'consultation', volet: 'qa', aliases: ['formulaire', 'envoyer', 'modifier', 'supprimer', 'acheter', 'payer', 'noter', 'evaluer', 'inscrire', 'commander'], faits: [
    'Sur les sites réels, l’agent est en consultation seule : aucun formulaire envoyé, aucune écriture, aucun changement de droits. Un geste qui pourrait écrire arrête la mission.',
  ] },
  { id: 'ecran', volet: 'qa', aliases: ['mobile', 'telephone', 'ecran', 'ordinateur', 'responsive', 'tablette'], faits: [
    'Le parcours se joue sur ordinateur ou sur mobile ; le choix se fait dans le studio, avant le lancement.',
  ] },

  // ── Pentest ──
  { id: 'pentest', volet: 'pentest', aliases: ['pentest', 'securite', 'faille', 'failles', 'intrusion', 'vulnerabilite'], faits: [
    'Le Pentest cherche ce qui devrait être impossible : un client qui lit ou modifie les données d’un autre, un salarié qui entre dans l’administration.',
    'HSentinel complète un audit humain (prestataire PASSI, pentest PCI) entre deux audits ; il ne le remplace pas.',
  ] },
  { id: 'methode', volet: 'pentest', aliases: ['methode', 'comment', 'rejeu', 'a b', 'deux comptes', 'idor', 'explorateur', 'verificateur', 'session'], faits: [
    'L’explorateur parcourt l’application avec le compte A et relève ses pages. Le code rejoue chaque page avec la session d’un autre compte : B, d’une autre entreprise, ou C, simple salarié.',
    'Si la réponse ressemble à celle de A, l’agent H vérificateur ouvre la page avec le compte fautif et regarde ce qui s’affiche.',
  ] },
  { id: 'types', volet: 'pentest', aliases: ['type', 'types', 'lecture', 'ecriture', 'admin', 'administration', 'salarie', 'lire', 'modifier'], faits: [
    'Trois types de failles : une autre entreprise lit des données (lecture), une autre entreprise les modifie (écriture), un simple salarié atteint l’administration (admin).',
  ] },
  { id: 'prouvee', volet: 'pentest', aliases: ['prouvee', 'suspicion', 'faux positif', 'faux positifs', 'controle sain', 'controles sains', 'fiable'], faits: [
    'Une faille n’est « prouvée » que si le rejeu et l’agent la confirment ; sinon c’est une suspicion.',
    'Les contrôles sains, des ressources bien protégées, mesurent les faux positifs.',
  ] },
  { id: 'gravite', volet: 'pentest', aliases: ['gravite', 'critique', 'elevee', 'moyenne', 'faible', 'severite', 'grave', 'dangereux'], faits: [
    'La gravité (critique, élevée, moyenne, faible) suit une règle écrite et déterministe : qui accède (une autre entreprise ou un salarié), pour lire ou modifier, et quelles données. Elle ne vient jamais d’un modèle d’IA.',
  ] },
  { id: 'banc', volet: 'pentest', aliases: ['banc', 'paie express', 's banc 01', 'demonstration', 'failles injectees', 'fictif'], faits: [
    'Paie Express est le banc de l’équipe : comptes et données fictifs, 6 failles injectées et 4 contrôles sains documentés. Le contrôle S-BANC-01 les cherche ; ses écritures de test sont remises en état à la fin.',
  ] },
  { id: 'precisions', volet: 'pentest', aliases: ['precision', 'precisions', 'consigne', 'instruction', 'quoi ecrire', 'cibler'], faits: [
    'En Pentest, le contrôle choisi fixe ce qui est testé. Les précisions de l’utilisateur restent dans son périmètre : pages à viser, données sensibles à surveiller.',
  ] },
  { id: 'limites', volet: 'pentest', aliases: ['sql', 'injection', 'xss', 'deni de service', 'ddos', 'force brute', 'brute force', 'pirater', 'hacker', 'exploit', 'autre site', 'contourner'], faits: [
    'L’expert ne donne aucune technique d’attaque hors des contrôles du catalogue et des cibles autorisées. Pour une autre cible, il faut d’abord l’autorisation écrite et une entrée au catalogue.',
  ] },
]

const ENTETE = 'FICHES DU MANUEL HSENTINEL (la seule source sur le produit ; leurs id vont dans le champ fiches, jamais dans la réponse) :'

export function normaliser(texte) {
  return String(texte ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

const INDEX = MANUEL.map((f) => ({ ...f, alias: f.aliases.map(normaliser), texte: `[${f.id}] ${f.faits.join(' ')}` }))

/** Les fiches les plus proches d'une question, pour un volet : alias trouvé ×2, id cité ×1 (comme LEVELS), au plus k. */
export function rechercher(question, volet, k = 4) {
  const q = ` ${normaliser(question)} `
  return INDEX
    .filter((f) => f.volet === 'commun' || f.volet === volet)
    .map((f) => ({ f, score: f.alias.reduce((s, a) => s + (q.includes(` ${a} `) ? 2 : 0), 0) + (q.includes(` ${normaliser(f.id)} `) ? 1 : 0) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .map((x) => x.f)
}

/** Le bloc de fiches pour le prompt ; sans fiche trouvée, la fiche d'ouverture du volet, pour que l'expert sache de quoi il parle. */
export function blocFiches(question, volet, k = 4) {
  const trouvees = rechercher(question, volet, k)
  const fiches = trouvees.length ? trouvees : INDEX.filter((f) => f.id === volet || f.id === 'hsentinel')
  return { ids: fiches.map((f) => f.id), texte: `${ENTETE}\n${fiches.map((f) => f.texte).join('\n')}` }
}

export const IDS = new Set(MANUEL.map((f) => f.id))
