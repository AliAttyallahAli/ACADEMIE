# 👨‍💼 Guide administrateur ALKHER ACADEMY

## 1. Connexion

1. Aller sur `https://alkher-academy.com/admin/login`
2. Choisir l'onglet **Super-admin** ou **Responsable**
3. Saisir email + mot de passe
4. **Note** : Le panel admin nécessite un ordinateur (≥ 1280px recommandé)

## 2. Créer un module

1. Menu **Modules** → bouton **+ Nouveau module**
2. Remplir :
   - Titre (ex : "Bureautique niveau 1")
   - Description
   - **Durée en semaines** (ex : 4)
   - **Fréquence** (ex : 2 fois/semaine)
   - Date de début de référence
3. **Aperçu** : "8 séances seront générées"
4. Créer → les séances sont générées automatiquement

## 3. Éditer le contenu d'une séance

1. Dans la liste modules → cliquer sur 👁️ d'un module
2. Trouver la séance → cliquer ✏️
3. Remplir :
   - **Titre** ("Introduction à Word")
   - **Type** : Texte / Vidéo (URL) / PDF (URL)
   - **Contenu**
   - **Date programmée**
4. Enregistrer

## 4. Créer un quiz pour une séance

1. Dans la liste séances → cliquer 📝 (icône quiz)
2. **Configurer** :
   - Seuil de réussite (défaut 60%)
   - Tentatives max (défaut 3)
3. **Ajouter des questions** :
   - Cliquer **+ Ajouter une question**
   - Saisir le texte
   - Choisir **Choix unique** ou **Choix multiple**
   - Points (1-10)
   - Ajouter des options
   - **Cliquer ⭕** sur la/les bonne(s) réponse(s)
4. Enregistrer

⚠️ **Règle métier** : L'apprenante doit obtenir **≥ 60%** pour débloquer la séance suivante.

## 5. Valider une inscription

1. Menu **Inscriptions** → onglet **En attente**
2. Voir la liste des inscriptions `payment_status = 'pending'`
3. **Valider** :
   - Cliquer ✅ → note optionnelle ("Paiement espèces reçu...")
   - Confirmer → **les séances sont générées immédiatement**
4. **Rejeter** :
   - Cliquer ❌ → motif obligatoire

### Créer une inscription manuelle

Pour paiement hors plateforme, bourse accordée, geste commercial :

1. Onglet **Créer manuelle**
2. Saisir :
   - **ID apprenante** (récupérable via `/admin/enrollments` ou support)
   - Module
   - Date de début
   - Note (traçabilité)
3. Créer → **activation immédiate**

## 6. Publier une bourse

1. Menu **Bourses** → **+ Nouvelle bourse**
2. Remplir :
   - Type (formation / recherche / stage)
   - Titre, description
   - Organisme, montant
   - Dates d'ouverture / clôture
   - Critères d'éligibilité
3. Enregistrer → statut **Brouillon**
4. Cliquer 📤 **Publier** → **toutes les apprenantes reçoivent une notification**

### Traiter les candidatures

1. Cliquer 👥 sur la bourse
2. Voir la liste des candidatures (lettre + CV téléchargeable)
3. Cliquer **Traiter cette candidature** → note → **Accepter** / **Refuser**
4. L'apprenante reçoit une notification automatique

## 7. Gérer les responsables

⚠️ **Réservé au super-admin.**

1. Menu **Responsables** → **+ Nouveau responsable**
2. Remplir :
   - Nom complet
   - Email
   - **Rôle** (pédagogique / inscriptions / bourses / support / lecture)
3. **Permissions granulaires** : pré-remplies selon le rôle, ajustables
4. Créer → **note le mot de passe temporaire affiché** (à communiquer de façon sécurisée)

### Actions sur un responsable

- ✏️ **Modifier** (rôle, permissions)
- 📊 **Voir l'activité** (historique des actions)
- 🔑 **Réinitialiser mot de passe** (nouveau mot de passe temporaire généré)
- ⏸️ **Désactiver** (bloque connexion, garde l'historique)
- 🗑️ **Supprimer** (définitif)

## 8. Consulter le journal d'audit

1. Menu **Journal d'audit**
2. **Filtrer** :
   - Par type d'acteur (admin / responsable / apprenante / système)
   - Par type d'action (`validate_enrollment`, `publish_scholarship`, etc.)
3. **Exporter CSV** pour analyse externe

## 9. Support

1. Menu **Support** → voir tous les tickets
2. Filtrer par statut (ouverts / répondus / clôturés)
3. Cliquer un ticket → lire le message
4. **Répondre** → l'apprenante reçoit une notification
5. **Clôturer** sans répondre si nécessaire

## 🎯 Bonnes pratiques

- ✅ Tester chaque quiz avant publication
- ✅ Vérifier les dates de séances (régénérer si besoin)
- ✅ Rédiger des notes de validation (traçabilité)
- ✅ Notifier les apprenantes via les bourses
- ✅ Consulter régulièrement le journal d'audit
- ✅ Sauvegarder la base chaque semaine

## 🆘 Problèmes courants

| Problème | Solution |
|---|---|
| Apprenante n'accède pas à une séance | Vérifier inscription payée + séance précédente validée |
| Séance verrouillée par date | Attendre `scheduled_date` ou régénérer |
| Certificat non généré | Vérifier 100% séances validées (tous modules) |
| Notification non reçue | Vérifier Socket.IO connecté (DevTools > Network) |
| Webhook AlkherPay échoue | Vérifier signature secret dans `.env` |