import { useState, useEffect } from 'react';
import {
  Plus, Trash2, Save, CheckCircle2, Circle, AlertCircle,
} from 'lucide-react';
import api from '../../api/axios';
import { ENDPOINTS } from '../../api/endpoints';
import Drawer from './Drawer';
import FormField from '../FormField';
import Spinner from '../Spinner';
import Toast from '../Toast';

const EMPTY_QUESTION = () => ({
  question_text: '',
  question_type: 'single',
  points: 1,
  options: [
    { option_text: '', is_correct: true },
    { option_text: '', is_correct: false },
  ],
});

export default function QuizBuilder({ session, onClose }) {
  const [state, setState] = useState({ loading: true });
  const [config, setConfig] = useState({ pass_threshold: 60, max_attempts: 3 });
  const [questions, setQuestions] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(ENDPOINTS.admin.quizBySession(session.id));
        setConfig({
          pass_threshold: data.pass_threshold,
          max_attempts: data.max_attempts,
        });
        setQuestions(data.questions || []);
      } catch (err) {
        if (err.response?.status === 404) {
          // Aucun quiz existant : commencer avec une question vide
          setQuestions([EMPTY_QUESTION()]);
        }
      } finally {
        setState({ loading: false });
      }
    })();
  }, [session.id]);

  function addQuestion() {
    setQuestions((q) => [...q, EMPTY_QUESTION()]);
  }

  function removeQuestion(idx) {
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
        if (question.options.length <= 2) return question; // minimum 2 options
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
          options: question.options.map((opt, j) =>
            j === oIdx ? { ...opt, ...updates } : opt
          ),
        };
      })
    );
  }

  function toggleCorrect(qIdx, oIdx) {
    setQuestions((q) =>
      q.map((question, i) => {
        if (i !== qIdx) return question;
        if (question.question_type === 'single') {
          // Une seule correcte
          return {
            ...question,
            options: question.options.map((opt, j) => ({
              ...opt,
              is_correct: j === oIdx,
            })),
          };
        }
        // Multiple : toggle
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
        // Réinitialiser les is_correct pour single
        let options = question.options;
        if (newType === 'single') {
          const firstCorrect = options.findIndex((o) => o.is_correct);
          options = options.map((o, j) => ({ ...o, is_correct: j === Math.max(0, firstCorrect) }));
        }
        return { ...question, question_type: newType, options };
      })
    );
  }

  function validateForm() {
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question_text.trim()) {
        return `Question ${i + 1} : texte requis`;
      }
      if (q.options.length < 2) {
        return `Question ${i + 1} : au moins 2 options requises`;
      }
      for (let j = 0; j < q.options.length; j++) {
        if (!q.options[j].option_text.trim()) {
          return `Question ${i + 1}, option ${j + 1} : texte requis`;
        }
      }
      if (!q.options.some((o) => o.is_correct)) {
        return `Question ${i + 1} : au moins une bonne réponse requise`;
      }
    }
    return null;
  }

  async function save() {
    const error = validateForm();
    if (error) {
      setToast({ type: 'error', message: error });
      return;
    }
    setSubmitting(true);
    try {
      await api.put(ENDPOINTS.admin.quizBySession(session.id), {
        pass_threshold: config.pass_threshold,
        max_attempts: config.max_attempts,
        questions,
      });
      setToast({ type: 'success', message: 'Quiz enregistré' });
      setTimeout(onClose, 800);
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.error || 'Erreur' });
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteQuiz() {
    if (!confirm('Supprimer ce quiz ?')) return;
    setSubmitting(true);
    try {
      await api.delete(ENDPOINTS.admin.quizBySession(session.id));
      setToast({ type: 'success', message: 'Quiz supprimé' });
      setTimeout(onClose, 800);
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.error || 'Erreur' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Drawer
      open
      onClose={onClose}
      title={`Quiz — ${session.title}`}
      width="max-w-3xl"
    >
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />

      {state.loading ? (
        <div className="flex justify-center py-8"><Spinner /></div>
      ) : (
        <>
          {/* Config */}
          <div className="mb-4 grid gap-3 rounded-lg bg-gray-50 p-3 md:grid-cols-2">
            <FormField label="Seuil de réussite (%)" id="pass_threshold">
              <input
                id="pass_threshold"
                type="number"
                min={1}
                max={100}
                className="input-field"
                value={config.pass_threshold}
                onChange={(e) => setConfig({ ...config, pass_threshold: Number(e.target.value) })}
              />
            </FormField>
            <FormField label="Tentatives max" id="max_attempts">
              <input
                id="max_attempts"
                type="number"
                min={1}
                max={20}
                className="input-field"
                value={config.max_attempts}
                onChange={(e) => setConfig({ ...config, max_attempts: Number(e.target.value) })}
              />
            </FormField>
          </div>

          {/* Questions */}
          <div className="space-y-4">
            {questions.map((q, qIdx) => (
              <div key={qIdx} className="rounded-lg border border-gray-200 p-4">
                <div className="mb-3 flex items-start justify-between gap-2">
                  <span className="rounded bg-alkher-100 px-2 py-1 text-xs font-bold text-alkher-700">
                    Q{qIdx + 1}
                  </span>
                  <button
                    onClick={() => removeQuestion(qIdx)}
                    className="rounded p-1 text-red-500 hover:bg-red-50"
                    title="Supprimer cette question"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <FormField label="Question" required>
                  <textarea
                    className="input-field min-h-[60px]"
                    value={q.question_text}
                    onChange={(e) => updateQuestion(qIdx, { question_text: e.target.value })}
                    placeholder="Ex : Que signifie WYSIWYG ?"
                  />
                </FormField>

                <div className="mb-3 grid gap-3 md:grid-cols-2">
                  <FormField label="Type">
                    <select
                      className="input-field"
                      value={q.question_type}
                      onChange={(e) => changeType(qIdx, e.target.value)}
                    >
                      <option value="single">Choix unique</option>
                      <option value="multiple">Choix multiple</option>
                    </select>
                  </FormField>
                  <FormField label="Points">
                    <input
                      type="number"
                      min={1}
                      max={10}
                      className="input-field"
                      value={q.points}
                      onChange={(e) => updateQuestion(qIdx, { points: Number(e.target.value) })}
                    />
                  </FormField>
                </div>

                <p className="mb-2 text-xs text-gray-500">
                  Cliquez sur ⭕ pour marquer la ou les bonnes réponses
                </p>

                <div className="space-y-2">
                  {q.options.map((opt, oIdx) => (
                    <div key={oIdx} className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleCorrect(qIdx, oIdx)}
                        className={`flex-shrink-0 ${
                          opt.is_correct ? 'text-green-600' : 'text-gray-400'
                        }`}
                      >
                        {opt.is_correct ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : (
                          <Circle className="h-5 w-5" />
                        )}
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
          </div>

          <button
            type="button"
            onClick={addQuestion}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 p-3 text-sm text-gray-600 hover:border-alkher-400 hover:text-alkher-600"
          >
            <Plus className="h-4 w-4" />
            Ajouter une question
          </button>

          {/* Footer */}
          <div className="mt-6 flex justify-between">
            <button onClick={deleteQuiz} className="btn-danger">
              <Trash2 className="mr-2 h-4 w-4" /> Supprimer le quiz
            </button>
            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="btn-secondary">Annuler</button>
              <button onClick={save} disabled={submitting} className="btn-primary">
                {submitting ? <Spinner size="sm" className="mr-2 !border-white" /> : <Save className="mr-2 h-4 w-4" />}
                Enregistrer le quiz
              </button>
            </div>
          </div>
        </>
      )}
    </Drawer>
  );
}