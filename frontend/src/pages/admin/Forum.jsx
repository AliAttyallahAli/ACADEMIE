import { useEffect, useState } from 'react';
import {
  MessageSquare, ArrowLeft, Trash2, User, Clock, ChevronRight,
  BookOpen, X, AlertCircle,
} from 'lucide-react';
import api from '../../api/axios';
import { ENDPOINTS } from '../../api/endpoints';
import Toast from '../../components/Toast';
import Spinner from '../../components/Spinner';
import { formatDateTime, relativeTime } from '../../utils/formatDate';

export default function AdminForum() {
  const [view, setView] = useState('modules'); // 'modules' | 'threads' | 'thread'
  const [state, setState] = useState({ loading: true, items: [] });
  const [selectedModule, setSelectedModule] = useState(null);
  const [selectedThread, setSelectedThread] = useState(null);
  const [toast, setToast] = useState(null);

  // ─── Charger les modules ───
  async function loadModules() {
    setState({ loading: true, items: [] });
    try {
      const { data } = await api.get(ENDPOINTS.admin.forumModules);
      setState({ loading: false, items: data.items || [] });
    } catch {
      setState({ loading: false, items: [] });
      setToast({ type: 'error', message: 'Erreur de chargement' });
    }
  }

  useEffect(() => {
    if (view === 'modules') loadModules();
  }, [view]);

  // ─── Charger les threads d'un module ───
  async function openModule(moduleId) {
    setSelectedModule(moduleId);
    setView('threads');
    setState({ loading: true, items: [] });
    try {
      const { data } = await api.get(ENDPOINTS.admin.forumByModule(moduleId));
      setState({ loading: false, items: data.threads || [] });
    } catch {
      setState({ loading: false, items: [] });
    }
  }

  // ─── Ouvrir un thread ───
  async function openThread(threadId) {
    setSelectedThread(threadId);
    setView('thread');
    setState({ loading: true, items: [] });
    try {
      const { data } = await api.get(ENDPOINTS.admin.forumThread(threadId));
      setState({ loading: false, items: data });
    } catch {
      setState({ loading: false, items: null });
    }
  }

  // ─── Supprimer un post ───
  async function deletePost(postId) {
    if (!confirm('Supprimer ce post ?')) return;
    try {
      await api.delete(ENDPOINTS.admin.forumDeletePost(postId));
      setToast({ type: 'success', message: 'Post supprimé' });
      if (view === 'thread') openThread(selectedThread);
      else if (view === 'threads') openModule(selectedModule);
    } catch {
      setToast({ type: 'error', message: 'Erreur' });
    }
  }

  function goBack() {
    if (view === 'thread') {
      setView('threads');
      if (selectedModule) openModule(selectedModule);
    } else if (view === 'threads') {
      setView('modules');
    }
  }

  // ═══════════ VUE MODULES ═══════════
  if (view === 'modules') {
    return (
      <div className="space-y-6">
        <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />

        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-alkher-600" />
            Forum — Modération
          </h1>
          <p className="text-sm text-gray-500">
            Consultez et modérez les discussions par module
          </p>
        </div>

        {state.loading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : state.items.length === 0 ? (
          <div className="card text-center py-8">
            <MessageSquare className="mx-auto mb-3 h-10 w-10 text-gray-400" />
            <p className="text-gray-500">Aucun module</p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {state.items.map((m) => (
              <button
                key={m.id}
                onClick={() => openModule(m.id)}
                className="card text-left transition hover:border-alkher-300"
              >
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-alkher-50 p-2">
                    <BookOpen className="h-5 w-5 text-alkher-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium line-clamp-1">{m.title}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      {m.threads_count} sujet{m.threads_count > 1 ? 's' : ''} · {m.posts_count} message{m.posts_count > 1 ? 's' : ''}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 flex-shrink-0 text-gray-400" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ═══════════ VUE THREADS D'UN MODULE ═══════════
  if (view === 'threads') {
    return (
      <div className="space-y-6">
        <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />

        <button onClick={goBack} className="inline-flex items-center gap-1 text-sm text-alkher-600 hover:underline">
          <ArrowLeft className="h-4 w-4" />Retour aux modules
        </button>

        <div>
          <h1 className="text-2xl font-bold">Threads du module</h1>
          <p className="text-sm text-gray-500">
            {state.items.length} sujet{state.items.length > 1 ? 's' : ''}
          </p>
        </div>

        {state.loading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : state.items.length === 0 ? (
          <div className="card text-center py-8">
            <MessageSquare className="mx-auto mb-3 h-10 w-10 text-gray-400" />
            <p className="text-gray-500">Aucun sujet dans ce module</p>
          </div>
        ) : (
          <div className="space-y-2">
            {state.items.map((t) => (
              <div key={t.id} className="card">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-alkher-100 text-sm font-bold text-alkher-700">
                    {t.author_name?.[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-sm">{t.author_name}</p>
                      <span className="text-xs text-gray-400">{relativeTime(t.created_at)}</span>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">{t.author_email}</p>
                    <p className="mt-2 line-clamp-2 text-sm text-gray-700">{t.content}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <button
                        onClick={() => openThread(t.id)}
                        className="text-xs text-alkher-600 hover:underline"
                      >
                        Voir {t.replies_count} réponse{t.replies_count > 1 ? 's' : ''} →
                      </button>
                      <button
                        onClick={() => deletePost(t.id)}
                        className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-100"
                      >
                        <Trash2 className="h-3 w-3" />Supprimer
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ═══════════ VUE THREAD DÉTAIL ═══════════
  if (view === 'thread') {
    const data = state.items;
    return (
      <div className="space-y-6">
        <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />

        <button onClick={goBack} className="inline-flex items-center gap-1 text-sm text-alkher-600 hover:underline">
          <ArrowLeft className="h-4 w-4" />Retour aux threads
        </button>

        {state.loading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : !data ? (
          <div className="card text-center py-8">
            <AlertCircle className="mx-auto mb-3 h-10 w-10 text-red-400" />
            <p className="text-gray-500">Thread introuvable</p>
          </div>
        ) : (
          <>
            <div className="card">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-alkher-100 text-sm font-bold text-alkher-700">
                  {data.post.author_name?.[0]?.toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="font-medium">{data.post.author_name}</p>
                      <p className="text-xs text-gray-500">{data.post.author_email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">{formatDateTime(data.post.created_at)}</span>
                      <button
                        onClick={() => deletePost(data.post.id)}
                        className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                        title="Supprimer le thread"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <p className="mt-2 whitespace-pre-line text-sm text-gray-800">{data.post.content}</p>
                  <p className="mt-2 text-xs text-gray-500">
                    <BookOpen className="mr-1 inline h-3 w-3" />
                    {data.post.module_title}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="mb-2 font-bold text-sm text-gray-700">
                {data.replies.length} réponse{data.replies.length > 1 ? 's' : ''}
              </h2>
              {data.replies.length === 0 ? (
                <p className="text-sm text-gray-500">Aucune réponse.</p>
              ) : (
                <div className="space-y-2">
                  {data.replies.map((r) => (
                    <div key={r.id} className="card ml-6 border-l-4 border-alkher-200">
                      <div className="flex items-start gap-3">
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-alkher-100 text-xs font-bold text-alkher-700">
                          {r.author_name?.[0]?.toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <p className="text-sm font-medium">{r.author_name}</p>
                              <p className="text-xs text-gray-500">{r.author_email}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-400">{relativeTime(r.created_at)}</span>
                              <button
                                onClick={() => deletePost(r.id)}
                                className="rounded-lg p-1.5 text-red-600 hover:bg-red-50"
                                title="Supprimer la réponse"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                          <p className="mt-2 whitespace-pre-line text-sm text-gray-700">{r.content}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    );
  }

  return null;
}
