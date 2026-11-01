import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Lock, Unlock, Clock, FileText, Video, Play,
  BookOpen, CheckCircle2, AlertCircle, Download, FileQuestion,
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
            loading: false,
            data: null,
            error: null,
            locked: {
              reason: data?.error,
              availableOn: data?.available_on,
            },
          });
        } else {
          setState({
            loading: false,
            data: null,
            error: data?.error || 'Erreur',
            locked: null,
          });
        }
      }
    })();
  }, [id]);

  if (state.loading) {
    return <div className="flex min-h-[60vh] items-center justify-center"><Spinner size="lg" /></div>;
  }

  // Cas verrouillé
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
          <h2 className="text-lg font-bold">
            {isDateLock ? 'Séance pas encore disponible' : 'Séance verrouillée'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {isDateLock
              ? `Cette séance sera disponible le ${formatDate(availableOn)}.`
              : reason || 'Terminez la séance précédente pour la débloquer.'}
          </p>
          {!isDateLock && (
            <Link to="/modules" className="btn-primary mt-4 inline-flex">Voir mes modules</Link>
          )}
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

  return (
    <div className="space-y-4">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1 text-sm text-alkher-600 hover:underline">
        <ArrowLeft className="h-4 w-4" /> Retour
      </button>

      {/* Header séance */}
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

      {/* Ressources */}
      {resources && resources.length > 0 && (
        <div className="card">
          <h2 className="mb-3 flex items-center gap-2 font-bold">
            <FileText className="h-4 w-4 text-alkher-600" /> Ressources
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

      {/* Quiz */}
      {quiz && (
        <div className="card">
          <h2 className="mb-3 flex items-center gap-2 font-bold">
            <FileQuestion className="h-4 w-4 text-alkher-600" /> Quiz d'évaluation
          </h2>

          {progress.is_completed === 1 ? (
            <div className="rounded-lg bg-green-50 p-4 text-sm text-green-800">
              <CheckCircle2 className="mr-1 inline h-4 w-4" />
              Quiz déjà validé. Score maximal : <strong>{attempts?.best_score?.toFixed(0)}%</strong>
            </div>
          ) : (
            <>
              <div className="mb-3 text-sm text-gray-600">
                <p>Seuil de réussite : <strong>{quiz.pass_threshold}%</strong></p>
                <p>Tentatives : <strong>{attempts?.used} / {quiz.max_attempts}</strong></p>
                {attempts?.best_score !== null && attempts?.best_score !== undefined && (
                  <p>Meilleur score : <strong>{attempts.best_score.toFixed(0)}%</strong></p>
                )}
              </div>

              {attempts?.remaining > 0 ? (
                <Link to={`/quiz/${session.id}`} className="btn-primary w-full">
                  <Play className="mr-2 h-4 w-4" />
                  {attempts.used === 0 ? 'Commencer le quiz' : 'Retenter le quiz'}
                </Link>
              ) : (
                <div className="rounded-lg bg-red-50 p-4 text-sm text-red-800">
                  <AlertCircle className="mr-1 inline h-4 w-4" />
                  Nombre maximum de tentatives atteint.
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function SessionContent({ session }) {
  if (!session.content) {
    return <p className="text-sm italic text-gray-500">Contenu à venir...</p>;
  }

  if (session.content_type === 'video') {
    return (
      <div className="aspect-video overflow-hidden rounded-lg bg-black">
        <iframe
          src={session.content}
          className="h-full w-full"
          allowFullScreen
          title={session.title}
        />
      </div>
    );
  }

  if (session.content_type === 'pdf') {
    return (
      <a
        href={session.content}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 hover:bg-gray-50"
      >
        <FileText className="h-8 w-8 text-red-500" />
        <div className="flex-1">
          <p className="font-medium">Document PDF</p>
          <p className="text-xs text-gray-500">Cliquez pour ouvrir</p>
        </div>
        <Download className="h-5 w-5 text-gray-400" />
      </a>
    );
  }

  // Texte
  return (
    <div
      className="prose prose-sm max-w-none whitespace-pre-line text-gray-700"
      dangerouslySetInnerHTML={{ __html: session.content }}
    />
  );
}