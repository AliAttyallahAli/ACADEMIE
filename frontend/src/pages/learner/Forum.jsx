import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  MessageCircle, Plus, ArrowLeft, Send, Trash2, User,
} from 'lucide-react';
import api from '../../api/axios';
import { ENDPOINTS } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import Spinner from '../../components/Spinner';
import EmptyState from '../../components/EmptyState';
import Toast from '../../components/Toast';
import { formatDate, relativeTime } from '../../utils/formatDate';

const BASE = import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000';

export default function Forum() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const initialModule = searchParams.get('module');

  const [modules, setModules] = useState([]);
  const [selectedModule, setSelectedModule] = useState(initialModule ? Number(initialModule) : null);
  const [threads, setThreads] = useState([]);
  const [openedThread, setOpenedThread] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [toast, setToast] = useState(null);

  // Charger les modules suivis
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(ENDPOINTS.myEnrollments);
        const paid = data.items.filter((e) => e.payment_status === 'paid');
        setModules(paid);
        if (!initialModule && paid.length > 0) {
          setSelectedModule(paid[0].module_id);
        }
      } catch {
        setToast({ type: 'error', message: 'Erreur de chargement' });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Charger les threads du module
  useEffect(() => {
    if (!selectedModule) return;
    (async () => {
      try {
        const { data } = await api.get(ENDPOINTS.forum.moduleThreads(selectedModule));
        setThreads(data.threads);
      } catch (err) {
        setThreads([]);
      }
    })();
  }, [selectedModule]);

  async function createThread(e) {
    e.preventDefault();
    if (newContent.trim().length < 5) {
      setToast({ type: 'error', message: 'Message trop court' });
      return;
    }
    setCreating(true);
    try {
      await api.post(ENDPOINTS.forum.createPost, {
        module_id: selectedModule,
        content: newContent,
      });
      setNewContent('');
      setToast({ type: 'success', message: 'Sujet publié' });
      // Recharger
      const { data } = await api.get(ENDPOINTS.forum.moduleThreads(selectedModule));
      setThreads(data.threads);
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.error || 'Erreur' });
    } finally {
      setCreating(false);
    }
  }

  if (loading) {
    return <div className="flex min-h-[60vh] items-center justify-center"><Spinner size="lg" /></div>;
  }

  // Vue thread détail
  if (openedThread) {
    return (
      <ThreadDetail
        threadId={openedThread}
        onBack={() => setOpenedThread(null)}
      />
    );
  }

  return (
    <div className="space-y-4">
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />

      <div>
        <h1 className="text-xl font-bold">Forum</h1>
        <p className="text-sm text-gray-500">Échangez avec les autres apprenantes</p>
      </div>

      {modules.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={MessageCircle}
            title="Aucun module suivi"
            description="Inscrivez-vous à un module pour accéder au forum."
          />
        </div>
      ) : (
        <>
          {/* Sélecteur de module */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {modules.map((m) => (
              <button
                key={m.module_id}
                onClick={() => setSelectedModule(m.module_id)}
                className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  selectedModule === m.module_id
                    ? 'bg-alkher-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {m.module_title}
              </button>
            ))}
          </div>

          {/* Nouveau sujet */}
          <form onSubmit={createThread} className="card">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Créer un nouveau sujet
            </label>
            <textarea
              className="input-field min-h-[80px]"
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="Posez votre question ou partagez une réflexion..."
              minLength={5}
              maxLength={2000}
            />
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-gray-400">
                {newContent.length} / 2000
              </span>
              <button
                type="submit"
                disabled={creating || newContent.trim().length < 5}
                className="btn-primary"
              >
                {creating ? <Spinner size="sm" className="mr-2 !border-white" /> : <Plus className="mr-2 h-4 w-4" />}
                Publier
              </button>
            </div>
          </form>

          {/* Liste threads */}
          {threads.length === 0 ? (
            <div className="card">
              <EmptyState
                icon={MessageCircle}
                title="Aucun sujet"
                description="Soyez la première à lancer la discussion !"
              />
            </div>
          ) : (
            <div className="space-y-2">
              {threads.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setOpenedThread(t.id)}
                  className="card block w-full text-left transition hover:border-alkher-300"
                >
                  <div className="flex items-start gap-3">
                    {t.author_photo ? (
                      <img
                        src={`${BASE}${t.author_photo}`}
                        alt=""
                        className="h-9 w-9 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-alkher-100 text-xs font-bold text-alkher-700">
                        {t.author_name?.[0]?.toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-sm">{t.author_name}</p>
                        <span className="text-xs text-gray-400">
                          {relativeTime(t.created_at)}
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm text-gray-700">{t.content}</p>
                      {t.replies_count > 0 && (
                        <p className="mt-2 flex items-center gap-1 text-xs text-alkher-600">
                          <MessageCircle className="h-3 w-3" />
                          {t.replies_count} réponse{t.replies_count > 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ThreadDetail({ threadId, onBack }) {
  const { user } = useAuth();
  const [state, setState] = useState({ loading: true, post: null, replies: [] });
  const [newReply, setNewReply] = useState('');
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState(null);

  async function load() {
    try {
      const { data } = await api.get(ENDPOINTS.forum.thread(threadId));
      setState({ loading: false, post: data.post, replies: data.replies });
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.error || 'Erreur' });
      setState({ loading: false, post: null, replies: [] });
    }
  }

  useEffect(() => { load(); }, [threadId]);

  async function sendReply(e) {
    e.preventDefault();
    if (newReply.trim().length < 5) return;
    setSending(true);
    try {
      await api.post(ENDPOINTS.forum.createPost, {
        module_id: state.post.module_id,
        parent_id: threadId,
        content: newReply,
      });
      setNewReply('');
      await load();
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.error || 'Erreur' });
    } finally {
      setSending(false);
    }
  }

  async function deleteThread() {
    if (!confirm('Supprimer ce sujet et toutes ses réponses ?')) return;
    try {
      await api.delete(ENDPOINTS.forum.deletePost(threadId));
      onBack();
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.error || 'Erreur' });
    }
  }

  if (state.loading) {
    return <div className="flex min-h-[60vh] items-center justify-center"><Spinner size="lg" /></div>;
  }

  if (!state.post) {
    return <div className="card"><p className="text-red-600">Sujet introuvable</p></div>;
  }

  const isAuthor = state.post.learner_id === user.id;

  return (
    <div className="space-y-4">
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />

      <button onClick={onBack} className="inline-flex items-center gap-1 text-sm text-alkher-600">
        <ArrowLeft className="h-4 w-4" /> Retour au forum
      </button>

      {/* Post principal */}
      <div className="card">
        <div className="mb-3 flex items-start gap-3">
          {state.post.author_photo ? (
            <img src={`${BASE}${state.post.author_photo}`} alt="" className="h-10 w-10 rounded-full object-cover" />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-alkher-100 text-sm font-bold text-alkher-700">
              {state.post.author_name?.[0]?.toUpperCase()}
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className="font-medium">{state.post.author_name}</p>
              <span className="text-xs text-gray-400">{formatDate(state.post.created_at)}</span>
            </div>
            <p className="mt-1 text-sm text-gray-500">{state.post.module_title}</p>
          </div>
          {isAuthor && (
            <button onClick={deleteThread} className="rounded-lg p-2 text-red-500 hover:bg-red-50">
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
        <p className="whitespace-pre-line text-sm text-gray-800">{state.post.content}</p>
      </div>

      {/* Réponses */}
      <div>
        <h2 className="mb-2 text-sm font-bold text-gray-700">
          {state.replies.length} réponse{state.replies.length > 1 ? 's' : ''}
        </h2>
        {state.replies.length === 0 ? (
          <p className="text-xs text-gray-500">Soyez la première à répondre.</p>
        ) : (
          <div className="space-y-2">
            {state.replies.map((r) => (
              <div key={r.id} className="card ml-4 border-l-4 border-alkher-200">
                <div className="mb-2 flex items-center gap-2">
                  {r.author_photo ? (
                    <img src={`${BASE}${r.author_photo}`} alt="" className="h-7 w-7 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-alkher-100 text-xs font-bold text-alkher-700">
                      {r.author_name?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <p className="text-sm font-medium">{r.author_name}</p>
                  <span className="text-xs text-gray-400">· {relativeTime(r.created_at)}</span>
                </div>
                <p className="whitespace-pre-line text-sm text-gray-700">{r.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Formulaire réponse */}
      <form onSubmit={sendReply} className="card">
        <textarea
          className="input-field min-h-[80px]"
          value={newReply}
          onChange={(e) => setNewReply(e.target.value)}
          placeholder="Votre réponse..."
          minLength={5}
          maxLength={2000}
        />
        <div className="mt-2 flex justify-end">
          <button
            type="submit"
            disabled={sending || newReply.trim().length < 5}
            className="btn-primary"
          >
            {sending ? <Spinner size="sm" className="mr-2 !border-white" /> : <Send className="mr-2 h-4 w-4" />}
            Répondre
          </button>
        </div>
      </form>
    </div>
  );
}