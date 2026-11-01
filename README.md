# 🎓 ALKHER ACADEMY

Plateforme de formation en ligne complète avec progression séquentielle, quiz d'évaluation, certificats QR authentifiés, bourses, forum et support.

## 📋 Fonctionnalités

### Apprenante
- 🎯 Inscription par modules avec paiement AlkherPay
- 📅 Diffusion calendaire (x fois/semaine sur une durée définie)
- 🔒 Déblocage séquentiel (quiz ≥ 60% pour passer à la séance suivante)
- 🎓 Certificat PDF avec QR code d'authentification
- 💼 Bourses (formations, recherche, stages) — candidature en ligne
- 💬 Forum par module + support tickets
- 🔔 Notifications temps réel (Socket.IO)
- 👤 Profil avec photo + statistiques
- 📱 PWA installable

### Admin / Responsable
- 🖥️ Panel desktop-first (tableaux, filtres, actions groupées)
- 📚 CRUD modules + séances + quiz builder
- ✅ Validation manuelle des inscriptions
- 🎓 Publication de bourses + review candidatures
- 🛡️ Gestion des responsables avec permissions granulaires
- 📊 Journal d'audit complet
- 📈 Dashboard avec KPI

## 🏗️ Stack

| Couche | Technologie |
|---|---|
| **Backend** | Node.js 20 + Express + better-sqlite3 |
| **Frontend** | React 18 + Vite + Tailwind CSS |
| **Auth** | JWT + bcrypt |
| **Temps réel** | Socket.IO |
| **PDF** | PDFKit + QRCode |
| **Upload** | Multer + Sharp |
| **Cron** | node-cron |
| **Docker** | Multi-stage build + Nginx |

## 🚀 Démarrage rapide

### Avec Docker (recommandé)

\`\`\`bash
git clone https://github.com/votre-org/alkher-academy.git
cd alkher-academy
docker compose up -d --build
docker compose exec server npm run migrate
docker compose exec server npm run seed
\`\`\`

**Accès** :
- Frontend : http://localhost:5173
- API : http://localhost:4000
- Health : http://localhost:4000/health

**Compte admin par défaut** :
- Email : `admin@alkher.com`
- Mot de passe : `Admin@2026`

⚠️ **Changez ces identifiants en production !**

### Sans Docker

\`\`\`bash
# Backend
cd server
npm install
cp .env.example .env
npm run migrate
npm run seed
npm run dev

# Frontend (autre terminal)
cd client
npm install
npm run dev
\`\`\`

## 📁 Structure

\`\`\`
alkher-academy/
├── server/          Backend Node.js + Express
│   ├── src/
│   │   ├── config/      Configuration (env, db, constants)
│   │   ├── db/          Schéma SQL + migrations
│   │   ├── repositories/ Accès données
│   │   ├── services/    Logique métier
│   │   ├── controllers/ Handlers HTTP
│   │   ├── middleware/  Auth, permissions, uploads
│   │   ├── validators/  Validation express-validator
│   │   ├── routes/      Routes API
│   │   ├── jobs/        Cron jobs
│   │   └── sockets/     Socket.IO
│   └── uploads/     Fichiers (avatars, docs, certificats)
│
├── client/          Frontend React
│   ├── src/
│   │   ├── api/         Client Axios
│   │   ├── context/     AuthContext, NotificationContext
│   │   ├── hooks/       useDeviceType, usePWA
│   │   ├── layouts/     AdminLayout, LearnerLayout
│   │   ├── pages/       public, learner, admin
│   │   ├── components/  UI réutilisables
│   │   └── utils/       Helpers
│   └── public/      manifest.json, sw.js, icons/
│
├── scripts/         Scripts utilitaires
├── docker-compose.yml
├── docker-compose.prod.yml
├── DEPLOY.md
└── README.md
\`\`\`

## 🔑 Variables d'environnement

Voir `server/.env.example` :

\`\`\`env
NODE_ENV=development
PORT=4000
BASE_URL=http://localhost:4000
CLIENT_URL=http://localhost:5173
JWT_SECRET=change_me
JWT_EXPIRES_IN=7d
CERT_SECRET=change_me_too
DB_PATH=./alkher.db
ALKHERPAY_API_KEY=
ALKHERPAY_WEBHOOK_SECRET=
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM="ALKHER ACADEMY <noreply@alkher-academy.com>"
UPLOAD_DIR=./uploads
MAX_UPLOAD_MB=5
\`\`\`

## 🧪 Tests

\`\`\`bash
# Test end-to-end (serveurs doivent tourner)
./scripts/e2e-test.sh

# Test manuel
curl http://localhost:4000/health
\`\`\`

## 📚 Documentation

- [Guide de déploiement](./DEPLOY.md)
- [Documentation API](./docs/API.md)
- [Guide administrateur](./docs/GUIDE_ADMIN.md)
- [Guide apprenante](./docs/GUIDE_APPRENANTE.md)

## 🔒 Sécurité

- Mots de passe hashés (bcrypt, 10 rounds)
- JWT signés avec secret fort
- Certificats signés HMAC-SHA256
- Webhook AlkherPay validé par signature
- Rate limiting (global, auth, uploads)
- Permissions granulaires pour responsables
- Journal d'audit complet
- Headers sécurité (Helmet + Nginx)

## 📄 Licence

Propriétaire — ALKHER ACADEMY © 2026

## 👥 Contact

- Site : https://alkher-academy.com
- Email : contact@alkher-academy.com