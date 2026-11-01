import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle2, XCircle, AlertCircle, Send, Trophy,
  RotateCcw, ArrowRight, Loader2,
} from 'lucide-react';
import api from '../../api/axios';
import { ENDPOINTS } from '../../api/endpoints';
import Spinner from '../../components/Spinner';
import Toast from '../../components/Toast';

export default function QuizPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [state, setState] = useState({
    loading: true,
    quiz: null,
    error: null,
    locked: null,
  });
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(ENDPOINTS.quizBySession(sessionId));
        setState({ loading: false, quiz: data, error: null, locked: null });
      } catch (err) {
        const status = err.response?.status;
        const data = err.response?.data;
        if (status === 403) {
          setState({ loading: false, quiz: null, error: null, locked: data });
        } else {
          setState({ loading: false, quiz: null, error: data?.error || 'Erreur', locked: null });
        }
      }
    })();
  }, [sessionId]);

  function toggleOption(question, optionId) {
    setAnswers((prev) => {
      const current = prev[question.id] || [];
      if (question.question_type === 'single') {
        return { ...prev, [question.id]: [optionId] };
      }
      if (current.includes(optionId)) {
        return { ...prev, [question.id]: current.filter((x) => x !== optionId) };
      }
      return { ...prev, [question.id]: [...current, optionId] };
    });
  }

  async function submit() {
    const missing = state.quiz.questions.filter((q) => !answers[q.id]?.length);
    if (missing.length > 0) {
      setToast({ type: 'error', message: `Répondez à toutes les questions (${missing.length} restante(s))` });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        answers: Object.entries(answers).map(([qid, oids]) => ({
          question_id: Number(qid),
          selected_option_ids: oids,
        })),
      };
      const { data } = await api.post(ENDPOINTS.quizSubmit(state.quiz.id), payload);
      setResult(data);
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.error || 'Erreur de soumission' });
    } finally {
      setSubmitting(false);
    }
  }

  if (state.loading) {
    return <div className="flex min-h-[60vh] items-center justify-center"><Spinner size="lg" /></div>;
  }

  if (state.locked) {
    return (
      <div className="space-y-4">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1 text-sm text-alkher-600">
          <ArrowLeft className="h-4 w-4" /> Retour
        </button>
        <div className="card text-center">
          <AlertCircle className="mx-auto mb-3 h-10 w-10 text-gray-400" />
          <p className="text-sm text-gray-600">{state.locked.error}</p>
        </div>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="card">
        <p className="text-red-600">{state.error}</p>
        <button onClick={() => navigate(-1)} className="btn-secondary mt-3">Retour</button>
      </div>
    );
  }

  // ─── Écran résultat ───
  if (result) {
    return (
      <div className="space-y-4">
        <div className={`card text-center ${result.passed ? 'border-2 border-green-500' : 'border-2 border-red-500'}`}>
          {result.passed ? (
            <>
              <div className="mx-auto mb-3 rounded-full bg-green-100 p-4">
                <Trophy className="h-10 w-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-green-700">Félicitations ! 🎉</h2>
              <p className="mt-1 text-gray-600">Vous avez réussi le quiz.</p>
            </>
          ) : (
            <>
              <div className="mx-auto mb-3 rounded-full bg-red-100 p-4">
                <XCircle className="h-10 w-10 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-red-700">Quiz échoué</h2>
              <p className="mt-1 text-gray-600">Il faut {result.threshold}% pour réussir. Retentez !</p>
            </>
          )}

          <div className="my-6 grid grid-cols-3 gap-3">
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-xs text-gray-500">Score</p>
              <p className="text-2xl font-bold">{result.score_percent.toFixed(0)}%</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-xs text-gray-500">Points</p>
              <p className="text-2xl font-bold">{result.earned_points}/{result.total_points}</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-xs text-gray-500">Tentatives restantes</p>
              <p className="text-2xl font-bold">{result.attempts_left}</p>
            </div>
          </div>

          {result.unlock?.unlocked && (
            <div className="rounded-lg bg-green-50 p-3 text-sm text-green-800">
              <CheckCircle2 className="mr-1 inline h-4 w-4" />
              La séance suivante a été débloquée !
            </div>
          )}
          {result.unlock?.module_completed && (
            <div className="rounded-lg bg-alkher-50 p-3 text-sm text-alkher-800">
              🎓 Module terminé !
            </div>
          )}

          <div className="mt-6 space-y-2">
            {result.unlock?.next_session_id && (
              <Link to={`/sessions/${result.unlock.next_session_id}`} className="btn-primary w-full">
                Aller à la séance suivante <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            )}
            {!result.passed && result.attempts_left > 0 && (
              <button onClick={() => { setResult(null); setAnswers({}); }} className="btn-secondary w-full">
                <RotateCcw className="mr-1 h-4 w-4" /> Retenter
              </button>
            )}
            <Link to="/dashboard" className="btn-secondary block w-full text-center">
              Retour au tableau de bord
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ─── Formulaire du quiz ───
  const { quiz } = state;
  const answeredCount = quiz.questions.filter((q) => answers[q.id]?.length > 0).length;
  const totalQuestions = quiz.questions.length;

  return (
    <div className="space-y-4">
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />

      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1 text-sm text-alkher-600">
        <ArrowLeft className="h-4 w-4" /> Retour à la séance
      </button>

      <div className="card">
        <h1 className="text-lg font-bold">Quiz d'évaluation</h1>
        <p className="mt-1 text-sm text-gray-600">
          {totalQuestions} question{totalQuestions > 1 ? 's' : ''} · Seuil de réussite : {quiz.pass_threshold}%
        </p>
        <div className="mt-3 flex items-center gap-2">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200">
            <div className="h-2 rounded-full bg-alkher-500 transition-all"
                 style={{ width: `${(answeredCount / totalQuestions) * 100}%` }} />
          </div>
          <span className="text-xs font-medium text-gray-600">{answeredCount} / {totalQuestions}</span>
        </div>
      </div>

      {quiz.questions.map((q, idx) => (
        <div key={q.id} className="card">
          <div className="mb-3 flex items-start gap-2">
            <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-alkher-100 text-xs font-bold text-alkher-700">
              {idx + 1}
            </span>
            <div className="flex-1">
              <p className="font-medium">{q.question_text}</p>
              <p className="text-xs text-gray-500">
                {q.question_type === 'single' ? 'Une seule réponse' : 'Plusieurs réponses possibles'}
                {' · '}{q.points} point{q.points > 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {q.options.map((opt) => {
              const selected = (answers[q.id] || []).includes(opt.id);
              return (
                <label key={opt.id}
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition ${
                    selected ? 'border-alkher-500 bg-alkher-50' : 'border-gray-200 hover:bg-gray-50'
                  }`}>
                  <input
                    type={q.question_type === 'single' ? 'radio' : 'checkbox'}
                    name={`q-${q.id}`}
                    checked={selected}
                    onChange={() => toggleOption(q, opt.id)}
                    className="mt-1 h-4 w-4 text-alkher-600"
                  />
                  <span className="flex-1 text-sm">{opt.option_text}</span>
                </label>
              );
            })}
          </div>
        </div>
      ))}

      <div className="sticky bottom-20 z-10 lg:bottom-4">
        <button onClick={submit} disabled={submitting || answeredCount < totalQuestions}
          className="btn-primary w-full shadow-lg">
          {submitting ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Soumission...</>
          ) : (
            <><Send className="mr-2 h-4 w-4" /> Soumettre mes réponses</>
          )}
        </button>
      </div>
    </div>
  );
}