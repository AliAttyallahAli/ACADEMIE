# 🚀 Déploiement ALKHER ACADEMY

Guide complet pour déployer en production.

## Option 1 — VPS (Ubuntu 22.04 recommandé)

### Prérequis serveur
- Ubuntu 22.04
- Docker + Docker Compose v2
- Nom de domaine pointant vers l'IP
- 2 Go RAM minimum

### Installation
\`\`\`bash
# 1. Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# 2. Clone projet
git clone https://github.com/votre-org/alkher-academy.git
cd alkher-academy

# 3. Configuration
cp .env.prod.example .env.prod
nano .env.prod  # éditer les secrets

# Générer secrets forts
openssl rand -hex 32  # JWT_SECRET
openssl rand -hex 32  # CERT_SECRET

# 4. Build + démarrage
docker compose -f docker-compose.prod.yml up -d --build

# 5. Migrations + seed initial
docker compose -f docker-compose.prod.yml exec server npm run migrate
docker compose -f docker-compose.prod.yml exec server npm run seed

# 6. Vérifier
curl http://localhost:4000/health
curl http://localhost/
\`\`\`

### Nginx reverse proxy + SSL (Let's Encrypt)

\`\`\`bash
sudo apt install nginx certbot python3-certbot-nginx -y
\`\`\`

**/etc/nginx/sites-available/alkher-academy** :
\`\`\`nginx
server {
    listen 80;
    server_name alkher-academy.com www.alkher-academy.com;

    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

server {
    listen 80;
    server_name api.alkher-academy.com;

    client_max_body_size 10M;

    location / {
        proxy_pass http://localhost:4000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /socket.io/ {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
\`\`\`

\`\`\`bash
sudo ln -s /etc/nginx/sites-available/alkher-academy /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# SSL
sudo certbot --nginx -d alkher-academy.com -d www.alkher-academy.com -d api.alkher-academy.com
\`\`\`

### Backup automatique (cron)

\`\`\`bash
# /etc/cron.d/alkher-backup
0 3 * * * root docker compose -f /opt/alkher-academy/docker-compose.prod.yml exec -T server sqlite3 /app/data/alkher.db ".backup /app/data/backup-\$(date +\\%Y\\%m\\%d).db" && find /var/lib/docker/volumes/alkher-academy_alkher-db/_data -name "backup-*.db" -mtime +7 -delete
\`\`\`

---

## Option 2 — Railway.app (le plus simple)

1. **Backend**
   - Créer un projet Railway
   - Connecter le repo GitHub (dossier `server/`)
   - Ajouter un volume `/app/data` et `/app/uploads`
   - Variables d'env : copier depuis `.env.prod.example`
   - Build : `Dockerfile.prod`

2. **Frontend**
   - Nouveau service → même repo (dossier `client/`)
   - Build args : `VITE_API_URL`, `VITE_SOCKET_URL`
   - Build : `Dockerfile.prod`

3. **Domaine**
   - Railway génère des URLs `.up.railway.app`
   - Ajouter domaine custom dans Settings → Domains

---

## Option 3 — Render.com

1. **Backend** → New Web Service
   - Build : `cd server && npm install`
   - Start : `cd server && node src/server.js`
   - Ajouter disque persistant `/app/data` et `/app/uploads`

2. **Frontend** → New Static Site
   - Build : `cd client && npm ci && npm run build`
   - Publish : `client/dist`
   - Env : `VITE_API_URL`, `VITE_SOCKET_URL`

---

## ✅ Checklist post-déploiement

- [ ] `curl https://api.alkher-academy.com/health` → `{"status":"ok"}`
- [ ] Frontend accessible : `https://alkher-academy.com`
- [ ] Connexion admin fonctionne
- [ ] Changer le mot de passe admin par défaut
- [ ] Créer un responsable pédagogique
- [ ] Créer un module test + quiz
- [ ] Inscription apprenante test
- [ ] Webhook AlkherPay configuré
- [ ] SMTP testé (email de confirmation)
- [ ] SSL actif (cadenas vert)
- [ ] Backups automatiques activés
- [ ] Logs accessibles
- [ ] Monitoring (UptimeRobot / BetterStack)

---

## 🔐 Sécurité production

- [ ] `JWT_SECRET` et `CERT_SECRET` générés aléatoirement (32 bytes)
- [ ] Mot de passe admin fort (> 16 caractères)
- [ ] HTTPS forcé (HSTS)
- [ ] CORS restreint au domaine frontend
- [ ] Rate limiting (à ajouter : `express-rate-limit`)
- [ ] Webhook AlkherPay validé par signature
- [ ] Backups quotidiens testés
- [ ] Logs centralisés
- [ ] Firewall : seuls 22, 80, 443 exposés