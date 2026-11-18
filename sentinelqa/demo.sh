#!/usr/bin/env bash
# La démo SentinelQA en une commande, depuis la racine du projet : sentinelqa/demo.sh [--autoriser-ecriture] [--supabase]
# Ou, pour lancer les audits depuis la salle de contrôle : sentinelqa/demo.sh --surveiller
# 1. Lance l'application cobaye et un tunnel public, puis ouvre l'application.
# 2. Entrée : lance l'audit, puis ouvre le rapport.
# 3. Entrée ou Ctrl-C : arrête l'application et le tunnel.
set -euo pipefail

RACINE="$(cd "$(dirname "$0")/.." && pwd)"
JOURNAUX="$(mktemp -d)"
OUVRIR="${OUVRIR:-open}" # OUVRIR=true n'ouvre rien (tests)
trap 'kill $(jobs -p) 2>/dev/null || true' EXIT

if lsof -ti tcp:3000 >/dev/null 2>&1; then
  echo "Le port 3000 est déjà pris : arrêtez d'abord l'application qui l'occupe." >&2
  exit 1
fi

cd "$RACINE/sentinelqa/cobaye"
[ -d node_modules ] || npm install
# On reconstruit si l'application n'a jamais été construite, ou si son code a changé depuis.
if [ ! -f .next/BUILD_ID ] || [ -n "$(find app lib -newer .next/BUILD_ID -print -quit)" ]; then
  ./node_modules/.bin/next build
fi
NEXT_TELEMETRY_DISABLED=1 ./node_modules/.bin/next start -p 3000 >"$JOURNAUX/application.log" 2>&1 &
# Le tunnel public : Cloudflare si le port 7844 sort (en HTTP/2, plus tolérant que QUIC) ; sinon, comme sur le réseau
# de l'école le 17/11 (port 7844 bloqué, 443 ouvert), un tunnel SSH par le port 443 chez localhost.run, sans compte.
if nc -z -G 4 198.41.192.7 7844 2>/dev/null; then
  cloudflared tunnel --no-autoupdate --protocol http2 --url http://localhost:3000 >"$JOURNAUX/tunnel.log" 2>&1 &
  MOTIF='https://[a-z0-9-]*\.trycloudflare\.com'
else
  echo "Port 7844 bloqué sur ce réseau : tunnel SSH par le port 443 (localhost.run)."
  ssh -o UserKnownHostsFile="$JOURNAUX/known_hosts" -o StrictHostKeyChecking=accept-new -o ServerAliveInterval=30 \
      -o ExitOnForwardFailure=yes -p 443 -R 80:localhost:3000 nokey@ssh.localhost.run >"$JOURNAUX/tunnel.log" 2>&1 &
  MOTIF='https://[a-z0-9]*\.lhr\.life'
fi

# On attend que le nom du tunnel soit publié avant de l'appeler d'ici :
# une recherche DNS trop précoce peut laisser une réponse négative en cache sur le Mac.
printf "Ouverture du tunnel public"
URL=""
for _ in $(seq 90); do
  URL="$(grep -so "$MOTIF" "$JOURNAUX/tunnel.log" | head -1 || true)"
  if [ -n "$URL" ] && [ -n "$(dig +short @1.1.1.1 "${URL#https://}")" ] && curl -s -o /dev/null -f --max-time 5 "$URL/"; then
    break
  fi
  URL=""
  printf "."
  sleep 1
done
echo
if [ -z "$URL" ]; then
  echo "Le tunnel ne répond pas. Journaux : $JOURNAUX" >&2
  exit 1
fi

echo "Application cobaye en ligne : $URL"
echo "Comptes de test : sentinelqa/runner/comptes-demo.json"

if [ "${1:-}" = "--surveiller" ]; then
  echo "Collez cette URL dans le formulaire de la salle de contrôle : http://127.0.0.1:3100/audits/nouveau"
  cd "$RACINE"
  .venv-holo/bin/python -u sentinelqa/runner/sentinelqa.py --surveiller
  exit 0
fi

"$OUVRIR" "$URL"
read -r -p "Entrée pour lancer l'audit… "

cd "$RACINE"
.venv-holo/bin/python -u sentinelqa/runner/sentinelqa.py "$URL" "$@" | tee "$JOURNAUX/audit.log"
RAPPORT="$(sed -n 's/^Rapport : //p' "$JOURNAUX/audit.log")"
if [ -n "$RAPPORT" ]; then
  "$OUVRIR" "$RAPPORT"
fi
read -r -p "Entrée pour arrêter l'application et le tunnel… "
