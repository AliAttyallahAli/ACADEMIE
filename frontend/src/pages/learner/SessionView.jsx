import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Lock, Unlock, Clock, FileText, Video, Play,
  BookOpen, CheckCircle2, AlertCircle, Download, FileQuestion,
  ChevronRight, ChevronUp,
} from 'lucide-react';
import api from '../../api/axios';
import { ENDPOINTS } from '../../api/endpoints';
import Spinner from '../../components/Spinner';
import { formatDate } from '../../utils/formatDate';

const BASE = import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000';

export default function SessionView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [state, setState] = useState({ loading: true, data: null, error: null, locked: null });
  const [stickyCollapsed, setStickyCollapsed] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(ENDPOINTS.sessions(id));
        setState({ loading: false, data, error: null, locked: null });
      } catch (err) {
        const status = err.response?.status;
        const data = err.response?.data;
        if (status === 403) {
          setState({
            loading: false, data: null, error: null,
            locked: { reason: data?.error, availableOn: data?.available_on },
          });
        } else {
          setState({ loading: false, data: null, error: data?.error || 'Erreur', locked: null });
        }
      }
    })();
  }, [id]);

  if (state.loading) return <div className="flex min-h-[60vh] items-center justify-center"><Spinner size="lg" /></div>;

  if (state.locked) {
    const { reason, availableOn } = state.locked;
    const isDateLock = !!availableOn;
    return (
      <div className="space-y-4">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1 text-sm text-alkher-600 hover:underline">
          <ArrowLeft className="h-4 w-4" /> Retour
        </button>
        <div className="card text-center">
          <div className="mx-auto mb-3 rounded-full bg-gray-100 p-4">
            {isDateLock ? <Clock className="h-8 w-8 text-gray-400" /> : <Lock className="h-8 w-8 text-gray-400" />}
          </div>
          <h2 className="text-lg font-bold">{isDateLock ? 'Pas encore disponible' : 'Verrouillée'}</h2>
          <p className="mt-2 text-sm text-gray-600">
            {isDateLock ? `Disponible le ${formatDate(availableOn)}.` : reason || 'Terminez la séance précédente.'}
          </p>
          {!isDateLock && <Link to="/modules" className="btn-primary mt-4 inline-flex">Voir mes modules</Link>}
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

  const { session, progress, quiz, attempts, resources } = state.data;
  const quizPending = quiz && progress.is_completed !== 1 && attempts?.remaining > 0;

  return (
    <div className={`space-y-4 ${quizPending ? 'pb-32 lg:pb-4' : ''}`}>
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1 text-sm text-alkher-600 hover:underline">
        <ArrowLeft className="h-4 w-4" /> Retour
      </button>

      {/* Header */}
      <div className="card">
        <div className="mb-2 flex items-center gap-2">
          <span className="badge bg-alkher-100 text-alkher-700">Séance {session.session_number || ''}</span>
          {progress.is_completed === 1 && (
            <span className="badge bg-green-100 text-green-700">
              <CheckCircle2 className="mr-1 h-3 w-3" /> Validée
            </span>
          )}
          {progress.is_unlocked === 1 && progress.is_completed === 0 && (
            <span className="badge bg-yellow-100 text-yellow-700">
              <Unlock className="mr-1 h-3 w-3" /> En cours
            </span>
          )}
        </div>
        <h1 className="text-xl font-bold">{session.title}</h1>
        <p className="mt-1 flex items-center gap-1 text-xs text-gray-500">
          <Clock className="h-3 w-3" /> Prévue le {formatDate(session.scheduled_date)}
        </p>
      </div>

      {/* Contenu */}
      <div className="card">
        <h2 className="mb-3 flex items-center gap-2 font-bold">
          <BookOpen className="h-4 w-4 text-alkher-600" /> Contenu
        </h2>
        <SessionContent session={session} />
      </div>

      {/* Quiz (inline) */}
      {quiz && (
        <div className={`card ${quizPending ? 'border-2 border-alkher-300 bg-alkher-50/30' : ''}`}>
          <h2 className="mb-3 flex items-center gap-2 font-bold">
            <FileQuestion className="h-4 w-4 text-alkher-600" /> Quiz d'évaluation
          </h2>

          {progress.is_completed === 1 ? (
            <div className="rounded-lg bg-green-100 p-4 text-sm text-green-800">
              <CheckCircle2 className="mr-1 inline h-4 w-4" />
              Quiz validé. Score : <strong>{attempts?.best_score?.toFixed(0) ?? 0}%</strong>
            </div>
          ) : (
            <>
              <div className="mb-3 grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded-lg bg-white p-2">
                  <p className="text-gray-500">Seuil</p>
                  <p className="text-base font-bold text-alkher-700">{quiz.pass_threshold}%</p>
                </div>
                <div className="rounded-lg bg-white p-2">
                  <p className="text-gray-500">Tentatives</p>
                  <p className="text-base font-bold">{attempts?.used} / {quiz.max_attempts}</p>
                </div>
                <div className="rounded-lg bg-white p-2">
                  <p className="text-gray-500">Meilleur</p>
                  <p className="text-base font-bold">
                    {attempts?.best_score != null ? `${attempts.best_score.toFixed(0)}%` : '—'}
                  </p>
                </div>
              </div>

              {attempts?.remaining > 0 ? (
                <Link to={`/quiz/${session.id}`} className="btn-primary w-full">
                  <Play className="mr-2 h-4 w-4" />
                  {attempts.used === 0 ? 'Commencer le quiz' : 'Retenter le quiz'}
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              ) : (
                <div className="rounded-lg bg-red-100 p-4 text-sm text-red-800">
                  <AlertCircle className="mr-1 inline h-4 w-4" />
                  Nombre maximum de tentatives atteint.
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Ressources */}
      {resources && resources.length > 0 && (
        <div className="card">
          <h2 className="mb-3 flex items-center gap-2 font-bold">
            <FileText className="h-4 w-4 text-alkher-600" /> Ressources complémentaires
          </h2>
          <div className="space-y-2">
            {resources.map((r) => (
              <a
                key={r.id}
                href={`${BASE}${r.file_url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 hover:bg-gray-50"
              >
                {r.file_type === 'pdf' ? <FileText className="h-5 w-5 text-red-500" /> :
                 r.file_type === 'video' ? <Video className="h-5 w-5 text-purple-500" /> :
                 <FileText className="h-5 w-5 text-gray-500" />}
                <span className="flex-1 text-sm">{r.title}</span>
                <Download className="h-4 w-4 text-gray-400" />
              </a>
            ))}
          </div>
        </div>
      )}

      <div className="text-center pt-2">
        <Link to="/modules" className="text-sm text-alkher-600 hover:underline">
          ← Retour à mes modules
        </Link>
      </div>

      {/* ✅ Sticky mobile (raccourci) */}
      {quizPending && (
        <div className="fixed inset-x-0 bottom-20 z-30 px-4 lg:hidden">
          <div className="rounded-xl border-2 border-alkher-500 bg-white p-3 shadow-2xl">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileQuestion className="h-4 w-4 text-alkher-600" />
                <p className="text-sm font-bold">Quiz disponible</p>
              </div>
              <button onClick={() => setStickyCollapsed(!stickyCollapsed)} className="text-gray-400">
                <ChevronUp className={`h-4 w-4 transition ${stickyCollapsed ? 'rotate-180' : ''}`} />
              </button>
            </div>
            {!stickyCollapsed && (
              <p className="mb-2 text-xs text-gray-500">
                {attempts?.used} / {quiz.max_attempts} tentatives · Seuil {quiz.pass_threshold}%
              </p>
            )}
            <Link to={`/quiz/${session.id}`} className="btn-primary w-full text-sm">
              <Play className="mr-2 h-4 w-4" />
              {attempts.used === 0 ? 'Commencer' : 'Retenter'}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function SessionContent({ session }) {
  if (!session.content) return <p className="text-sm italic text-gray-500">Contenu à venir...</p>;
  if (session.content_type === 'video') {
    return (
      <div className="aspect-video overflow-hidden rounded-lg bg-black">
        <iframe src={session.content} className="h-full w-full" allowFullScreen title={session.title} />
      </div>
    );
  }
  if (session.content_type === 'pdf') {
    return (
      <a href={session.content} target="_blank" rel="noopener noreferrer"
        className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 hover:bg-gray-50">
        <FileText className="h-8 w-8 text-red-500" />
        <div className="flex-1">
          <p className="font-medium">Document PDF</p>
          <p className="text-xs text-gray-500">Cliquez pour ouvrir</p>
        </div>
        <Download className="h-5 w-5 text-gray-400" />
      </a>
    );
  }
  return (
    <div
      className="prose prose-sm max-w-none whitespace-pre-line text-gray-700"
      dangerouslySetInnerHTML={{ __html: session.content }}
    />
  );
}
