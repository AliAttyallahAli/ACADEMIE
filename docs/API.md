# 📡 ALKHER ACADEMY — API Reference

Base URL : `https://api.alkher-academy.com/api` (prod) ou `http://localhost:4000/api` (dev)

## Authentification

Toutes les routes protégées nécessitent le header :
\`\`\`
Authorization: Bearer <JWT_TOKEN>
\`\`\`

### Rôles
- `learner` — Apprenante
- `admin` — Super-admin
- `responsible` — Sous-admin avec permissions granulaires

---

## 🔐 Auth

### POST `/auth/register`
Crée un compte apprenante.

**Body** :
\`\`\`json
{
  "full_name": "Aminata Diallo",
  "birth_date": "1998-05-14",
  "email": "aminata@example.com",
  "password": "Test@2026"
}
\`\`\`

**Response** `201` :
\`\`\`json
{
  "success": true,
  "user": { "id": 1, "full_name": "Aminata Diallo", "email": "aminata@example.com" },
  "token": "eyJhbGc..."
}
\`\`\`

### POST `/auth/login`
Connexion apprenante.

### POST `/auth/admin/login`
Connexion super-admin.

### POST `/auth/responsible/login`
Connexion responsable.

### GET `/auth/me`
Retourne l'utilisateur connecté.

---

## 📚 Modules

### GET `/modules`
Catalogue public.

**Response** `200` :
\`\`\`json
{
  "items": [
    {
      "id": 1,
      "title": "Bureautique niveau 1",
      "description": "...",
      "duration_weeks": 4,
      "frequency_per_week": 2,
      "total_sessions": 8
    }
  ]
}
\`\`\`

---

## 💳 Inscriptions

### POST `/enroll`
Inscription à un ou plusieurs modules.

**Body** :
\`\`\`json
{
  "module_ids": [1, 2],
  "start_date": "2026-11-10"
}
\`\`\`

**Response** `201` :
\`\`\`json
{
  "success": true,
  "enrollments": [{ "id": 1, "module_id": 1 }],
  "payment": { "payment_url": "...", "reference": "ALK-1-..." },
  "amount": 25000
}
\`\`\`

### GET `/enroll/my`
Liste des inscriptions de l'apprenante connectée.

---

## 📖 Séances

### GET `/sessions/:id`
Contenu d'une séance (accès contrôlé : date + déblocage + inscription payée).

**Response** `200` :
\`\`\`json
{
  "session": { "id": 1, "title": "Séance 1", "content": "...", "scheduled_date": "2026-11-10" },
  "progress": { "is_unlocked": 1, "is_completed": 0 },
  "quiz": { "id": 1, "pass_threshold": 60, "max_attempts": 3 },
  "attempts": { "used": 0, "remaining": 3, "best_score": null },
  "resources": []
}
\`\`\`

**Erreurs** :
- `403` Séance verrouillée ou date non atteinte
- `403` Non inscrite

---

## 🎯 Quiz

### GET `/quizzes/session/:sessionId`
Récupère le quiz (sans les bonnes réponses).

### POST `/quizzes/:quizId/submit`
Soumet les réponses.

**Body** :
\`\`\`json
{
  "answers": [
    { "question_id": 1, "selected_option_ids": [2] },
    { "question_id": 2, "selected_option_ids": [4, 5] }
  ]
}
\`\`\`

**Response** `200` :
\`\`\`json
{
  "passed": true,
  "score_percent": 100,
  "earned_points": 5,
  "total_points": 5,
  "threshold": 60,
  "attempts_left": 2,
  "unlock": { "unlocked": true, "next_session_id": 2 }
}
\`\`\`

---

## 🎓 Certificats

### GET `/certificates`
Liste les certificats de l'apprenante.

### GET `/certificates/:uuid`
Détails d'un certificat.

### GET `/certificates/:uuid/download`
Télécharge le PDF.

### GET `/verify/:uuid`
**PUBLIC** — Vérification QR.

**Response** `200` :
\`\`\`json
{
  "valid": true,
  "certificate_uuid": "...",
  "issued_at": "2026-11-29T10:23:45.000Z",
  "learner": { "full_name": "Aminata Diallo", "birth_date": "1998-05-14" },
  "modules": [
    { "title": "Bureautique", "start_date": "2026-11-10", "completed_at": "2026-11-29" }
  ]
}
\`\`\`

---

## 💼 Bourses

### GET `/scholarships`
Liste des bourses publiées.

### GET `/scholarships/:id`
Détail d'une bourse + candidature existante.

### POST `/scholarships/:id/apply`
Postule (multipart : `motivation_letter`, `cv`, `extra_docs`).

### GET `/my-applications`
Mes candidatures.

---

## 🔔 Notifications

### GET `/notifications?unread=true&limit=20`
### GET `/notifications/count`
### POST `/notifications/:id/read`
### POST `/notifications/read-all`
### DELETE `/notifications/:id`

---

## 👤 Profil

### GET `/profile`
Retourne profil + stats.

### PUT `/profile`
Met à jour nom, téléphone, pays, bio.

### POST `/profile/photo`
Upload photo (multipart `photo`).

### DELETE `/profile/photo`
### PUT `/profile/password`

---

## 📊 Dashboard

### GET `/learner/dashboard`
Retourne tout agrégé :
- Profil
- Progression globale
- Liste modules avec progression
- Prochaine séance
- Notifications récentes
- Certificats
- Statistiques

---

## 🛡️ Admin (routes protégées)

Toutes les routes admin nécessitent un rôle `admin` ou `responsible` avec permissions.

### Modules
- `GET /admin/modules`
- `POST /admin/modules`
- `PUT /admin/modules/:id`
- `DELETE /admin/modules/:id`
- `POST /admin/modules/:id/regenerate-sessions`

### Séances
- `GET /admin/sessions/module/:moduleId`
- `PUT /admin/sessions/:id`
- `DELETE /admin/sessions/:id`

### Quiz
- `GET /admin/quizzes/session/:sessionId`
- `PUT /admin/quizzes/session/:sessionId`
- `DELETE /admin/quizzes/session/:sessionId`

### Inscriptions
- `GET /admin/enrollments/pending`
- `GET /admin/enrollments`
- `POST /admin/enrollments/:id/validate`
- `POST /admin/enrollments/:id/reject`
- `POST /admin/enrollments/manual`

### Bourses
- `GET /admin/scholarships`
- `POST /admin/scholarships`
- `PUT /admin/scholarships/:id`
- `DELETE /admin/scholarships/:id`
- `POST /admin/scholarships/:id/publish`
- `POST /admin/scholarships/:id/close`
- `GET /admin/scholarships/:id/applications`
- `POST /admin/scholarships/applications/:id/review`

### Responsables (super-admin uniquement)
- `GET /admin/responsibles`
- `POST /admin/responsibles`
- `PUT /admin/responsibles/:id`
- `DELETE /admin/responsibles/:id`
- `PATCH /admin/responsibles/:id/toggle`
- `POST /admin/responsibles/:id/reset-password`
- `GET /admin/responsibles/:id/activity`

### Audit
- `GET /admin/audit-log?actor_type=&action_type=&page=1&limit=50`

---

## 📋 Codes HTTP

| Code | Signification |
|---|---|
| `200` | Succès |
| `201` | Créé |
| `400` | Requête invalide |
| `401` | Non authentifié |
| `403` | Non autorisé |
| `404` | Introuvable |
| `409` | Conflit (ex: email existant) |
| `422` | Validation échouée |
| `429` | Rate limit |
| `500` | Erreur serveur |