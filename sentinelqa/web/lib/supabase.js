// L'accès à Supabase, côté serveur uniquement : la clé secrète ne doit jamais atteindre le navigateur.
// En local, les clés viennent de ~/.config/sentinelqa/.env ; sur Vercel, des variables d'environnement.
import 'server-only';
import { readFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

function cles() {
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SECRET_KEY) {
    return { url: process.env.SUPABASE_URL, secrete: process.env.SUPABASE_SECRET_KEY };
  }
  const fichier = readFileSync(path.join(os.homedir(), '.config/sentinelqa/.env'), 'utf8');
  const valeurs = Object.fromEntries(fichier.split('\n')
    .filter((l) => l.includes('=') && !l.trimStart().startsWith('#'))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]));
  return { url: valeurs.SUPABASE_URL, secrete: valeurs.SUPABASE_SECRET_KEY };
}

// Une requête REST (PostgREST). Une erreur ne cite que la table et le statut HTTP, jamais une clé.
export async function requete(chemin, { methode = 'GET', corps, prefer } = {}) {
  const { url, secrete } = cles();
  const reponse = await fetch(`${url}/rest/v1/${chemin}`, {
    method: methode,
    headers: { apikey: secrete, 'Content-Type': 'application/json', ...(prefer ? { Prefer: prefer } : {}) },
    body: corps === undefined ? undefined : JSON.stringify(corps),
    cache: 'no-store',
  });
  if (!reponse.ok) throw new Error(`Supabase ${methode} ${chemin.split('?')[0]} : HTTP ${reponse.status}`);
  return reponse.status === 204 ? null : reponse.json();
}
