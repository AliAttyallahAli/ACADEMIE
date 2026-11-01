import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Plus, Trash2, Save, CheckCircle2, Circle, AlertCircle,
  FileQuestion, Eye, EyeOff, Users, BarChart3, X, Edit,
} from 'lucide-react';
import api from '../../api/axios';
import { ENDPOINTS } from '../../api/endpoints';
import Toast from '../../components/Toast';
import Spinner from '../../components/Spinner';
import { formatDateTime } from '../../utils/formatDate';

const EMPTY_QUESTION = () => ({
  question_text: '',
  question_type: 'single',
  points: 1,
  options: [
    { option_text: '', is_correct: true },
    { option_text: '', is_correct: false },
  ],
});

export default function QuizEditor() {
  const { id: moduleId, sessionId } = useParams();
  const navigate = useNavigate();
  const [state, setState] = useState({ loading: true, session: null, quiz: null, questions: [] });
  const [toast, setToast] = useState(null);
  const [config, setConfig] = useState({ pass_threshold: 60, max_attempts: 3 });
  const [questions, setQuestions] = useState([]);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);
  const [showAttempts, setShowAttempts] = useState(false);

  async function load() {
    setState((s) => ({ ...s, loading: true }));
    try {
      const { data } = await api.get(ENDPOINTS.admin.quizBySession(sessionId));
      setState({
        loading: false,
        session: data.session,
        quiz: data.quiz,
        questions: data.questions || [],
      });
      setConfig({
        pass_threshold: data.quiz?.pass_threshold ?? 60,
        max_attempts: data.quiz?.max_attempts ?? 3,
      });
      setQuestions(
        data.questions?.length > 0
          ? data.questions.map((q) => ({
              question_text: q.question_text,
              question_type: q.question_type,
              points: q.points,
              options: q.options.map((o) => ({
                option_text: o.option_text,
                is_correct: o.is_correct === 1,
              })),
            }))
          : [EMPTY_QUESTION()]
      );
    } catch {
      setState({ loading: false, session: null, quiz: null, questions: [] });
      setToast({ type: 'error', message: 'Erreur de chargement' });
    }
  }

  useEffect(() => { load(); }, [sessionId]);

  // ─── Manipulation des questions ───
  function addQuestion() {
    setQuestions((q) => [...q, EMPTY_QUESTION()]);
  }

  function removeQuestion(idx) {
    if (questions.length === 1) {
      setToast({ type: 'error', message: 'Au moins une question requise' });
      return;
    }
    setQuestions((q) => q.filter((_, i) => i !== idx));
  }

  function updateQuestion(idx, updates) {
    setQuestions((q) =>
      q.map((question, i) => (i === idx ? { ...question, ...updates } : question))
    );
  }

  function addOption(qIdx) {
    setQuestions((q) =>
      q.map((question, i) =>
        i === qIdx
          ? { ...question, options: [...question.options, { option_text: '', is_correct: false }] }
          : question
      )
    );
  }

  function removeOption(qIdx, oIdx) {
    setQuestions((q) =>
      q.map((question, i) => {
        if (i !== qIdx) return question;
        if (question.options.length <= 2) return question;
        return { ...question, options: question.options.filter((_, j) => j !== oIdx) };
      })
    );
  }

  function updateOption(qIdx, oIdx, updates) {
    setQuestions((q) =>
      q.map((question, i) => {
        if (i !== qIdx) return question;
        return {
          ...question,
          options: question.options.map((opt, j) => (j === oIdx ? { ...opt, ...updates } : opt)),
        };
      })
    );
  }

  function toggleCorrect(qIdx, oIdx) {
    setQuestions((q) =>
      q.map((question, i) => {
        if (i !== qIdx) return question;
        if (question.question_type === 'single') {
          return {
            ...question,
            options: question.options.map((opt, j) => ({
              ...opt,
              is_correct: j === oIdx,
            })),
          };
        }
        return {
          ...question,
          options: question.options.map((opt, j) =>
            j === oIdx ? { ...opt, is_correct: !opt.is_correct } : opt
          ),
        };
      })
    );
  }

  function changeType(qIdx, newType) {
    setQuestions((q) =>
      q.map((question, i) => {
        if (i !== qIdx) return question;
        let options = question.options;
        if (newType === 'single') {
          const firstCorrect = options.findIndex((o) => o.is_correct);
          options = options.map((o, j) => ({ ...o, is_correct: j === Math.max(0, firstCorrect) }));
        }
        return { ...question, question_type: newType, options };
      })
    );
  }

  function validate() {
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question_text.trim()) return `Question ${i + 1} : texte requis`;
      if (q.options.length < 2) return `Question ${i + 1} : au moins 2 options`;
      for (let j = 0; j < q.options.length; j++) {
        if (!q.options[j].option_text.trim()) return `Question ${i + 1}, option ${j + 1} : texte requis`;
      }
      if (!q.options.some((o) => o.is_correct)) return `Question ${i + 1} : au moins une bonne réponse`;
    }
    return null;
  }

  async function save() {
    const error = validate();
    if (error) return setToast({ type: 'error', message: error });

    setSaving(true);
    try {
      await api.put(ENDPOINTS.admin.quizBySession(sessionId), {
        pass_threshold: config.pass_threshold,
        max_attempts: config.max_attempts,
        questions,
      });
      setToast({ type: 'success', message: 'Quiz enregistré' });
      await load();
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.error || 'Erreur' });
    } finally {
      setSaving(false);
    }
  }

  async function deleteQuiz() {
    if (!confirm('Supprimer ce quiz ?')) return;
    try {
      await api.delete(ENDPOINTS.admin.quizBySession(sessionId));
      setToast({ type: 'success', message: 'Quiz supprimé' });
      setQuestions([EMPTY_QUESTION()]);
      await load();
    } catch {
      setToast({ type: 'error', message: 'Erreur' });
    }
  }

  if (state.loading) return <div className="flex min-h-[60vh] items-center justify-center"><Spinner size="lg" /></div>;

  if (!state.session) return <div className="card"><p className="text-red-600">Séance introuvable</p></div>;

  return (
    <div className="space-y-6">
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />

      <button onClick={() => navigate(`/admin/modules/${moduleId}/sessions`)} className="inline-flex items-center gap-1 text-sm text-alkher-600 hover:underline">
        <ArrowLeft className="h-4 w-4" />Retour aux séances
      </button>

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileQuestion className="h-6 w-6 text-alkher-600" />
            Quiz — {state.session.title}
          </h1>
          <p className="text-sm text-gray-500">
            {state.session.module_title} · Séance {state.session.session_number}
          </p>
        </div>
        <div className="flex gap-2">
          {state.quiz && (
            <>
              <button onClick={() => setShowAttempts(true)} className="btn-secondary text-sm">
                <Users className="mr-2 h-4 w-4" />Tentatives
              </button>
              <button onClick={deleteQuiz} className="btn-danger text-sm">
                <Trash2 className="mr-2 h-4 w-4" />Supprimer
              </button>
            </>
          )}
          <button onClick={() => setPreview(!preview)} className="btn-secondary text-sm">
            {preview ? <><Edit className="mr-2 h-4 w-4" />Éditer</> : <><Eye className="mr-2 h-4 w-4" />Aperçu</>}
          </button>
        </div>
      </div>

      {/* Configuration */}
      <div className="card">
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Seuil de réussite (%)</label>
            <input
              type="number"
              min={1}
              max={100}
              className="input-field"
              value={config.pass_threshold}
              onChange={(e) => setConfig({ ...config, pass_threshold: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Tentatives maximum</label>
            <input
              type="number"
              min={1}
              max={20}
              className="input-field"
              value={config.max_attempts}
              onChange={(e) => setConfig({ ...config, max_attempts: Number(e.target.value) })}
            />
          </div>
        </div>
      </div>

      {/* Mode aperçu */}
      {preview ? (
        <QuizPreview questions={questions} config={config} />
      ) : (
        <>
          {/* Liste des questions */}
          {questions.map((q, qIdx) => (
            <div key={qIdx} className="card">
              <div className="mb-3 flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-alkher-100 px-2 py-1 text-xs font-bold text-alkher-700">
                    Q{qIdx + 1}
                  </span>
                  <span className={`badge ${q.question_type === 'single' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                    {q.question_type === 'single' ? 'Choix unique' : 'Choix multiple'}
                  </span>
                  <span className="badge bg-gray-100 text-gray-700">{q.points} pt{q.points > 1 ? 's' : ''}</span>
                </div>
                <button
                  onClick={() => removeQuestion(qIdx)}
                  className="rounded-lg p-1 text-red-600 hover:bg-red-50"
                  title="Supprimer la question"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="mb-3">
                <label className="mb-1 block text-xs font-medium text-gray-600">Question *</label>
                <textarea
                  className="input-field min-h-[60px] text-sm"
                  value={q.question_text}
                  onChange={(e) => updateQuestion(qIdx, { question_text: e.target.value })}
                  placeholder="Ex : Que signifie WYSIWYG ?"
                />
              </div>

              <div className="mb-3 grid gap-2 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Type</label>
                  <select
                    className="input-field text-sm"
                    value={q.question_type}
                    onChange={(e) => changeType(qIdx, e.target.value)}
                  >
                    <option value="single">Choix unique</option>
                    <option value="multiple">Choix multiple</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Points</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    className="input-field text-sm"
                    value={q.points}
                    onChange={(e) => updateQuestion(qIdx, { points: Number(e.target.value) })}
                  />
                </div>
              </div>

              <p className="mb-2 text-xs text-gray-500">
                Cliquez sur ⭕ pour marquer la bonne réponse (une seule pour "choix unique", plusieurs pour "choix multiple")
              </p>

              <div className="space-y-2">
                {q.options.map((opt, oIdx) => (
                  <div key={oIdx} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleCorrect(qIdx, oIdx)}
                      className={`flex-shrink-0 ${opt.is_correct ? 'text-green-600' : 'text-gray-300'}`}
                      title="Marquer comme correct"
                    >
                      {opt.is_correct ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
                    </button>
                    <input
                      className="input-field flex-1 text-sm"
                      value={opt.option_text}
                      onChange={(e) => updateOption(qIdx, oIdx, { option_text: e.target.value })}
                      placeholder={`Option ${oIdx + 1}`}
                    />
                    {q.options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOption(qIdx, oIdx)}
                        className="flex-shrink-0 text-red-400 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => addOption(qIdx)}
                className="mt-2 text-xs text-alkher-600 hover:underline"
              >
                + Ajouter une option
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={addQuestion}
            className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 p-4 text-sm text-gray-600 hover:border-alkher-400 hover:text-alkher-600"
          >
            <Plus className="h-4 w-4" />
            Ajouter une question
          </button>

          {/* Résumé */}
          <div className="card bg-alkher-50">
            <div className="flex items-center justify-between text-sm">
              <div className="flex gap-4">
                <span><strong>{questions.length}</strong> question{questions.length > 1 ? 's' : ''}</span>
                <span><strong>{questions.reduce((s, q) => s + q.points, 0)}</strong> points au total</span>
                <span>Seuil : <strong>{config.pass_threshold}%</strong></span>
              </div>
              <button onClick={save} disabled={saving} className="btn-primary">
                {saving ? <><Spinner size="sm" className="mr-2 !border-white" />Enregistrement...</> : <><Save className="mr-2 h-4 w-4" />Enregistrer</>}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Modal tentatives */}
      {showAttempts && state.quiz && (
        <AttemptsModal quizId={state.quiz.id} onClose={() => setShowAttempts(false)} />
      )}
    </div>
  );
}

// ─── Aperçu du quiz (mode lecture) ───
function QuizPreview({ questions, config }) {
  return (
    <div className="space-y-4">
      <div className="card bg-blue-50 text-sm text-blue-800">
        <Eye className="mr-2 inline h-4 w-4" />
        Aperçu — vue apprenante. Les bonnes réponses sont marquées en vert.
      </div>

      {questions.map((q, qIdx) => (
        <div key={qIdx} className="card">
          <div className="mb-3 flex items-start gap-3">
            <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-alkher-100 text-sm font-bold text-alkher-700">
              {qIdx + 1}
            </span>
            <div className="flex-1">
              <p className="font-medium">{q.question_text || <em className="text-gray-400">(question vide)</em>}</p>
              <p className="text-xs text-gray-500">
                {q.question_type === 'single' ? 'Une seule réponse' : 'Plusieurs réponses'} · {q.points} pt{q.points > 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {q.options.map((opt, oIdx) => (
              <div
                key={oIdx}
                className={`flex items-center gap-3 rounded-lg border p-3 ${
                  opt.is_correct ? 'border-green-500 bg-green-50' : 'border-gray-200'
                }`}
              >
                {opt.is_correct ? (
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-green-600" />
                ) : (
                  <Circle className="h-4 w-4 flex-shrink-0 text-gray-300" />
                )}
                <span className={`flex-1 text-sm ${opt.is_correct ? 'font-medium text-green-900' : 'text-gray-700'}`}>
                  {opt.option_text || <em className="text-gray-400">(vide)</em>}
                </span>
                {opt.is_correct && <span className="badge bg-green-100 text-green-700">✓ Correcte</span>}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Modal tentatives ───
function AttemptsModal({ quizId, onClose }) {
  const [state, setState] = useState({ loading: true, attempts: [], stats: null, quiz: null });

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(ENDPOINTS.admin.quizAttempts(quizId));
        setState({ loading: false, attempts: data.attempts || [], stats: data.stats, quiz: data.quiz });
      } catch {
        setState({ loading: false, attempts: [], stats: null, quiz: null });
      }
    })();
  }, [quizId]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
      <aside className="flex h-full w-full max-w-2xl flex-col bg-white shadow-xl">
        <header className="flex items-center justify-between border-b p-4">
          <h2 className="font-bold">Tentatives du quiz</h2>
          <button onClick={onClose} className="rounded p-1 hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {state.loading ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : (
            <>
              {state.stats && (
                <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                  <div className="card p-3">
                    <p className="text-xs text-gray-500">Total</p>
                    <p className="text-xl font-bold">{state.stats.total_attempts}</p>
                  </div>
                  <div className="card p-3">
                    <p className="text-xs text-gray-500">Apprenantes</p>
                    <p className="text-xl font-bold">{state.stats.total_unique_learners}</p>
                  </div>
                  <div className="card p-3">
                    <p className="text-xs text-gray-500">Score moyen</p>
                    <p className="text-xl font-bold">{state.stats.avg_score}%</p>
                  </div>
                  <div className="card p-3">
                    <p className="text-xs text-gray-500">Taux réussite</p>
                    <p className="text-xl font-bold">{state.stats.pass_rate}%</p>
                  </div>
                </div>
              )}

              {state.attempts.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Aucune tentative</p>
              ) : (
                <div className="space-y-2">
                  {state.attempts.map((a) => (
                    <div key={a.id} className="card flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                        a.passed ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {a.passed ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : (
                          <X className="h-5 w-5 text-red-600" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm">{a.learner_name}</p>
                        <p className="text-xs text-gray-500">{a.learner_email}</p>
                        <p className="text-xs text-gray-400">{formatDateTime(a.attempted_at)}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-bold ${a.passed ? 'text-green-600' : 'text-red-600'}`}>
                          {Math.round(a.score_percent)}%
                        </p>
                        <span className={`badge ${a.passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {a.passed ? 'Réussi' : 'Échoué'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </aside>
    </div>
  );
}
