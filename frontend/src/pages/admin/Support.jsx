import { useEffect, useState } from 'react';
import { LifeBuoy, MessageSquare, CheckCircle2, Clock, Send, ChevronRight, X } from 'lucide-react';
import api from '../../api/axios';
import { ENDPOINTS } from '../../api/endpoints';
import Toast from '../../components/Toast';
import Spinner from '../../components/Spinner';
import { formatDateTime } from '../../utils/formatDate';

const STATUS = {
  open: { label: 'Ouvert', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  replied: { label: 'Répondu', color: 'bg-alkher-100 text-alkher-700', icon: MessageSquare },
  closed: { label: 'Clôturé', color: 'bg-gray-100 text-gray-600', icon: CheckCircle2 },
};

export default function AdminSupport() {
  const [state, setState] = useState({ loading: true, items: [] });
  const [toast, setToast] = useState(null);
  const [selected, setSelected] = useState(null);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');

  async function load() {
    setState((s) => ({ ...s, loading: true }));
    try {
      const { data } = await api.get(ENDPOINTS.admin.supportTickets, {
        params: { status: statusFilter || undefined },
      });
      // ✅ Sécurité : garantir un tableau
      const items = Array.isArray(data) ? data : (data?.items ?? []);
      setState({ loading: false, items });
    } catch {
      setState({ loading: false, items: [] });
    }
  }

  useEffect(() => { load(); }, [statusFilter]);

  async function sendReply() {
    if (!reply.trim() || reply.trim().length < 3) {
      setToast({ type: 'error', message: 'Réponse trop courte' });
      return;
    }
    setSending(true);
    try {
      await api.post(ENDPOINTS.admin.supportReply(selected.id), { reply });
      setToast({ type: 'success', message: 'Réponse envoyée' });
      setSelected(null);
      setReply('');
      await load();
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.error || 'Erreur' });
    } finally {
      setSending(false);
    }
  }

  async function closeTicket(id) {
    if (!confirm('Clôturer ce ticket ?')) return;
    try {
      await api.post(ENDPOINTS.admin.supportClose(id));
      setToast({ type: 'success', message: 'Ticket clôturé' });
      setSelected(null);
      await load();
    } catch {
      setToast({ type: 'error', message: 'Erreur' });
    }
  }

  return (
    <div className="space-y-6">
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Support</h1>
          <p className="text-sm text-gray-500">Tickets des apprenantes</p>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">Tous les statuts</option>
          <option value="open">Ouverts</option>
          <option value="replied">Répondus</option>
          <option value="closed">Clôturés</option>
        </select>
      </div>

      {state.loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : state.items.length === 0 ? (
        <div className="card text-center py-8">
          <LifeBuoy className="mx-auto mb-3 h-10 w-10 text-gray-400" />
          <p className="text-gray-500">Aucun ticket</p>
        </div>
      ) : (
        <div className="space-y-2">
          {state.items.map((t) => {
            const cfg = STATUS[t.status] || STATUS.open;
            const Icon = cfg.icon;
            return (
              <button
                key={t.id}
                onClick={() => setSelected(t)}
                className="card flex w-full items-start gap-3 text-left transition hover:border-alkher-300"
              >
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${cfg.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate font-medium">{t.subject}</p>
                    <span className={`badge ${cfg.color}`}>{cfg.label}</span>
                  </div>
                  <p className="text-xs text-gray-500">{t.learner_name} · {t.learner_email}</p>
                  <p className="mt-1 line-clamp-1 text-xs text-gray-600">{t.message}</p>
                  <p className="mt-1 text-xs text-gray-400">{formatDateTime(t.created_at)}</p>
                </div>
                <ChevronRight className="h-4 w-4 flex-shrink-0 text-gray-400" />
              </button>
            );
          })}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
          <aside className="flex h-full w-full max-w-2xl flex-col bg-white shadow-xl">
            <header className="flex items-center justify-between border-b p-4">
              <h2 className="font-bold">Ticket — {selected.subject}</h2>
              <button onClick={() => setSelected(null)} className="rounded p-1 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="text-sm font-medium">{selected.learner_name}</p>
                <p className="text-xs text-gray-500">{selected.learner_email}</p>
                <p className="mt-1 text-xs text-gray-400">{formatDateTime(selected.created_at)}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="mb-2 text-xs font-medium text-gray-500">Message :</p>
                <p className="whitespace-pre-line text-sm text-gray-800">{selected.message}</p>
              </div>

              {selected.status !== 'closed' && (
                <div>
                  <label className="mb-1 block text-sm font-medium">Répondre</label>
                  <textarea
                    className="input-field min-h-[120px]"
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Votre réponse..."
                    minLength={3}
                    maxLength={2000}
                  />
                </div>
              )}
            </div>

            <footer className="flex justify-between gap-2 border-t p-4">
              {selected.status !== 'closed' && (
                <>
                  <button onClick={() => closeTicket(selected.id)} className="btn-secondary">
                    Clôturer sans répondre
                  </button>
                  <button onClick={sendReply} disabled={sending} className="btn-primary">
                    {sending ? <Spinner size="sm" className="mr-2 !border-white" /> : <Send className="mr-2 h-4 w-4" />}
                    Envoyer
                  </button>
                </>
              )}
              {selected.status === 'closed' && (
                <p className="w-full text-center text-sm text-gray-500">Ce ticket est clôturé</p>
              )}
            </footer>
          </aside>
        </div>
      )}
    </div>
  );
}