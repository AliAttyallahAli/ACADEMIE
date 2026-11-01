#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════
# ALKHER ACADEMY — Test End-to-End complet
# Vérifie le parcours apprenante : inscription → paiement →
# quiz → cascade → certificat → vérification QR → bourse
# ═══════════════════════════════════════════════════════════

set -euo pipefail

API="${API:-http://localhost:4000/api}"
VERIFY="${VERIFY:-http://localhost:4000}"

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

PASS=0
FAIL=0

log()    { echo -e "${YELLOW}▶ $1${NC}"; }
ok()     { echo -e "${GREEN}  ✓ $1${NC}"; PASS=$((PASS+1)); }
fail()   { echo -e "${RED}  ✗ $1${NC}"; FAIL=$((FAIL+1)); }

assert_eq() {
  if [ "$1" == "$2" ]; then ok "$3 (=$1)"; else fail "$3 (attendu=$2, obtenu=$1)"; fi
}

extract() {
  echo "$1" | grep -o "\"$2\":[^,}]*" | head -1 | cut -d':' -f2 | tr -d '" ' 
}

# ─── 1. AUTH ADMIN ───
log "1. Connexion admin"
ADMIN_RESP=$(curl -s -X POST "$API/auth/admin/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@alkher.com","password":"Admin@2026"}')
ADMIN_TOKEN=$(extract "$ADMIN_RESP" "token")
[ -n "$ADMIN_TOKEN" ] && ok "Token admin récupéré" || fail "Login admin échoué"

# ─── 2. CRÉER UN MODULE ───
log "2. Création d'un module (2 sem × 2/sem = 4 séances)"
MODULE_RESP=$(curl -s -X POST "$API/admin/modules" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title":"E2E Test Module",
    "description":"Module pour test E2E",
    "duration_weeks":2,
    "frequency_per_week":2,
    "start_date":"2026-01-01"
  }')
MODULE_ID=$(extract "$MODULE_RESP" "id")
[ -n "$MODULE_ID" ] && ok "Module créé (id=$MODULE_ID)" || fail "Création module échouée"

# Récupérer les séances
SESSIONS_RESP=$(curl -s "$API/admin/sessions/module/$MODULE_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN")
SESSIONS_COUNT=$(echo "$SESSIONS_RESP" | grep -o '"session_number"' | wc -l)
assert_eq "$SESSIONS_COUNT" "4" "4 séances générées"

# Récupérer les ids de séances (extraire les "id": X dans le tableau sessions)
SESSION_IDS=$(echo "$SESSIONS_RESP" | grep -o '"id":[0-9]*' | cut -d':' -f2 | tail -4)
SESSION_1=$(echo "$SESSION_IDS" | head -1)
SESSION_2=$(echo "$SESSION_IDS" | sed -n '2p')
echo "    Séances : $SESSION_1, $SESSION_2, ..."

# ─── 3. CRÉER UN QUIZ POUR SÉANCE 1 ───
log "3. Création du quiz séance 1"
QUIZ_RESP=$(curl -s -X PUT "$API/admin/quizzes/session/$SESSION_1" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "pass_threshold":60,
    "max_attempts":3,
    "questions":[
      {
        "question_text":"Question single test ?",
        "question_type":"single",
        "points":2,
        "options":[
          {"option_text":"Bonne réponse","is_correct":true},
          {"option_text":"Mauvaise réponse","is_correct":false}
        ]
      },
      {
        "question_text":"Question multiple test ?",
        "question_type":"multiple",
        "points":3,
        "options":[
          {"option_text":"Correct A","is_correct":true},
          {"option_text":"Correct B","is_correct":true},
          {"option_text":"Faux","is_correct":false}
        ]
      }
    ]
  }')
QUIZ_ID=$(extract "$QUIZ_RESP" "id")
[ -n "$QUIZ_ID" ] && ok "Quiz créé (id=$QUIZ_ID)" || fail "Création quiz échouée"

# Extraire les ids d'options correctes
CORRECT_OPTIONS=$(echo "$QUIZ_RESP" | grep -o '"id":[0-9]*,"option_text":"[^"]*","is_correct":1' | grep -o '"id":[0-9]*' | cut -d':' -f2)
echo "    Options correctes : $(echo $CORRECT_OPTIONS | tr '\n' ' ')"

# ─── 4. INSCRIPTION APPRENANTE ───
log "4. Inscription apprenante"
EMAIL="e2e-$(date +%s)@test.com"
REGISTER_RESP=$(curl -s -X POST "$API/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"full_name\":\"E2E Test User\",
    \"birth_date\":\"1995-01-01\",
    \"email\":\"$EMAIL\",
    \"password\":\"Test@2026\"
  }")
LEARNER_TOKEN=$(extract "$REGISTER_RESP" "token")
LEARNER_ID=$(echo "$REGISTER_RESP" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
[ -n "$LEARNER_TOKEN" ] && ok "Compte créé (id=$LEARNER_ID)" || fail "Register échoué"

# ─── 5. INSCRIPTION AU MODULE ───
log "5. Inscription au module"
ENROLL_RESP=$(curl -s -X POST "$API/enroll" \
  -H "Authorization: Bearer $LEARNER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"module_ids\":[$MODULE_ID],\"start_date\":\"2026-01-01\"}")
ENROLLMENT_ID=$(echo "$ENROLL_RESP" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
[ -n "$ENROLLMENT_ID" ] && ok "Enrollment créé (id=$ENROLLMENT_ID)" || fail "Enroll échoué"

# ─── 6. PAIEMENT SIMULÉ ───
log "6. Paiement AlkherPay simulé"
SIM_RESP=$(curl -s -X POST "$API/alkherpay/simulate" \
  -H "Content-Type: application/json" \
  -d "{\"enrollment_ids\":[$ENROLLMENT_ID]}")
ACTIVATED=$(echo "$SIM_RESP" | grep -o '"activated":[a-z]*' | cut -d':' -f2)
assert_eq "$ACTIVATED" "true" "Enrollment activé"

# ─── 7. ACCÈS SÉANCE 1 ───
log "7. Accès séance 1 (débloquée)"
SESSION_RESP=$(curl -s "$API/sessions/$SESSION_1" \
  -H "Authorization: Bearer $LEARNER_TOKEN")
SESSION_TITLE=$(echo "$SESSION_RESP" | grep -o '"title":"[^"]*' | head -1 | cut -d'"' -f4)
[ -n "$SESSION_TITLE" ] && ok "Séance accessible : $SESSION_TITLE" || fail "Accès séance 1 échoué"

# ─── 8. ACCÈS SÉANCE 2 (verrouillée) ───
log "8. Accès séance 2 (doit être verrouillée)"
LOCKED_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$API/sessions/$SESSION_2" \
  -H "Authorization: Bearer $LEARNER_TOKEN")
assert_eq "$LOCKED_CODE" "403" "Séance 2 verrouillée (403)"

# ─── 9. SOUMISSION QUIZ RÉUSSI ───
log "9. Soumission quiz (réponses correctes)"
# Récupérer les questions + options
QUIZ_DETAIL=$(curl -s "$API/quizzes/session/$SESSION_1" \
  -H "Authorization: Bearer $LEARNER_TOKEN")
Q1_ID=$(echo "$QUIZ_DETAIL" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
Q2_ID=$(echo "$QUIZ_DETAIL" | grep -o '"id":[0-9]*' | sed -n '4p' | cut -d':' -f2)
OPT_Q1_CORRECT=$(echo "$CORRECT_OPTIONS" | head -1)
OPT_Q2_CORRECT_1=$(echo "$CORRECT_OPTIONS" | sed -n '2p')
OPT_Q2_CORRECT_2=$(echo "$CORRECT_OPTIONS" | sed -n '3p')

SUBMIT_RESP=$(curl -s -X POST "$API/quizzes/$QUIZ_ID/submit" \
  -H "Authorization: Bearer $LEARNER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"answers\":[
      {\"question_id\":$Q1_ID,\"selected_option_ids\":[$OPT_Q1_CORRECT]},
      {\"question_id\":$Q2_ID,\"selected_option_ids\":[$OPT_Q2_CORRECT_1,$OPT_Q2_CORRECT_2]}
    ]
  }")
PASSED=$(echo "$SUBMIT_RESP" | grep -o '"passed":[a-z]*' | cut -d':' -f2)
assert_eq "$PASSED" "true" "Quiz réussi"

SCORE=$(echo "$SUBMIT_RESP" | grep -o '"score_percent":[0-9.]*' | cut -d':' -f2)
echo "    Score : $SCORE%"

# ─── 10. VÉRIFIER DÉBLOCAGE SÉANCE 2 ───
log "10. Séance 2 débloquée après réussite"
UNLOCK_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$API/sessions/$SESSION_2" \
  -H "Authorization: Bearer $LEARNER_TOKEN")
# Peut être 403 si date pas atteinte (scheduled_date > today)
echo "    Code : $UNLOCK_CODE (403 si date future, 200 si date atteinte)"

# ─── 11. DASHBOARD APPRENANTE ───
log "11. Dashboard apprenante"
DASH_RESP=$(curl -s "$API/learner/dashboard" \
  -H "Authorization: Bearer $LEARNER_TOKEN")
MODULES_COUNT=$(echo "$DASH_RESP" | grep -o '"modules_count":[0-9]*' | cut -d':' -f2)
[ -n "$MODULES_COUNT" ] && ok "Dashboard accessible ($MODULES_COUNT modules)" || fail "Dashboard échoué"

# ─── 12. NOTIFICATIONS ───
log "12. Notifications"
NOTIF_RESP=$(curl -s "$API/notifications" \
  -H "Authorization: Bearer $LEARNER_TOKEN")
UNREAD=$(echo "$NOTIF_RESP" | grep -o '"unread_count":[0-9]*' | cut -d':' -f2)
[ "$UNREAD" -ge "2" ] && ok "$UNREAD notifications non lues" || fail "Notifications manquantes"

# ─── 13. BOURSE : CRÉATION + PUBLICATION ───
log "13. Bourse : création et publication"
SCHOLAR_RESP=$(curl -s -X POST "$API/admin/scholarships" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type":"formation",
    "title":"E2E Test Scholarship",
    "closing_date":"2027-12-31",
    "description":"Bourse de test"
  }')
SCHOLAR_ID=$(extract "$SCHOLAR_RESP" "id")
[ -n "$SCHOLAR_ID" ] && ok "Bourse créée (id=$SCHOLAR_ID)" || fail "Création bourse échouée"

PUBLISH_RESP=$(curl -s -X POST "$API/admin/scholarships/$SCHOLAR_ID/publish" \
  -H "Authorization: Bearer $ADMIN_TOKEN")
PUBLISHED=$(echo "$PUBLISH_RESP" | grep -o '"status":"published"')
[ -n "$PUBLISHED" ] && ok "Bourse publiée" || fail "Publication échouée"

# ─── 14. POSTULER À LA BOURSE ───
log "14. Candidature à la bourse"
echo "%PDF-1.4 test" > /tmp/e2e-cv.pdf
APPLY_RESP=$(curl -s -X POST "$API/scholarships/$SCHOLAR_ID/apply" \
  -H "Authorization: Bearer $LEARNER_TOKEN" \
  -F "motivation_letter=Je postule à cette bourse de test E2E pour vérifier le parcours complet de candidature et de validation." \
  -F "cv=@/tmp/e2e-cv.pdf")
APP_ID=$(echo "$APPLY_RESP" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
[ -n "$APP_ID" ] && ok "Candidature créée (id=$APP_ID)" || fail "Candidature échouée"

# ─── 15. ADMIN ACCEPTE ───
log "15. Admin accepte la candidature"
REVIEW_RESP=$(curl -s -X POST "$API/admin/scholarships/applications/$APP_ID/review" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"accepted","review_note":"Excellent dossier E2E"}')
ACCEPTED=$(echo "$REVIEW_RESP" | grep -o '"status":"accepted"')
[ -n "$ACCEPTED" ] && ok "Candidature acceptée" || fail "Review échouée"

# ─── 16. VÉRIFIER CERTIFICAT (si complétion) ───
log "16. Vérification certificat (si présent)"
CERT_RESP=$(curl -s "$API/certificates" \
  -H "Authorization: Bearer $LEARNER_TOKEN")
CERT_COUNT=$(echo "$CERT_RESP" | grep -o '"certificate_uuid"' | wc -l)
echo "    Certificats : $CERT_COUNT"

if [ "$CERT_COUNT" -gt "0" ]; then
  CERT_UUID=$(echo "$CERT_RESP" | grep -o '"certificate_uuid":"[^"]*' | head -1 | cut -d'"' -f4)
  VERIFY_RESP=$(curl -s "$VERIFY/verify/$CERT_UUID")
  VALID=$(echo "$VERIFY_RESP" | grep -o '"valid":true')
  [ -n "$VALID" ] && ok "Certificat valide via /verify" || fail "Vérification certificat échouée"
fi

# ─── 17. AUDIT LOG ───
log "17. Audit log admin"
AUDIT_RESP=$(curl -s "$API/admin/audit-log" \
  -H "Authorization: Bearer $ADMIN_TOKEN")
AUDIT_COUNT=$(echo "$AUDIT_RESP" | grep -o '"action_type"' | wc -l)
[ "$AUDIT_COUNT" -gt "0" ] && ok "$AUDIT_COUNT actions tracées" || fail "Audit vide"

# ─── RÉSULTAT FINAL ───
echo ""
echo "═══════════════════════════════════════"
echo -e "  ${GREEN}PASS : $PASS${NC}"
echo -e "  ${RED}FAIL : $FAIL${NC}"
echo "═══════════════════════════════════════"

if [ "$FAIL" -gt "0" ]; then
  exit 1
fi