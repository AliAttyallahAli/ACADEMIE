import { useEffect, useState } from 'react';
import { LifeBuoy, Plus, ChevronRight, Clock, CheckCircle2, XCircle, MessageSquare } from 'lucide-react';
import api from '../../api/axios';
import { ENDPOINTS } from '../../api/endpoints';
import Spinner from '../../components/Spinner';
import EmptyState from '../../components/EmptyState';
import Toast from '../../components/Toast';
import FormField from '../../components/FormField';
import { formatDateTime } from '../../utils/formatDate';

const STATUS_CONFIG = {
  open: { label: 'Ouvert', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  replied: { label: 'Répondu', color: 'bg-alkher-100 text-alkher-700', icon: MessageSquare },
  closed: { label: 'Clôturé', color: 'bg-gray-100 text-gray-600', icon: CheckCircle2 },
};

export default function Support() {
  const [state, setState] = useState({ loading: true, items: [] });
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState(null);
  const [form, setForm] = useState({ subject: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [openedTicket, setOpenedTicket] = useState(null);

  async function load() {
    try {
      const { data } = await api.get(ENDPOINTS.support.list);
      setState({ loading: false, items: data.items });
    } catch {
      setState({ loading: false, items: [] });
    }
  }

  useEffect(() => { load(); }, []);

  async function submit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post(ENDPOINTS.support.create, form);
      setForm({ subject: '', message: '' });
      setShowForm(false);
      setToast({ type: 'success', message: 'Ticket envoyé ! L\'équipe vous répondra bientôt.' });
      await load();
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.error || 'Erreur' });
    } finally {
      setSubmitting(false);
    }
  }

  if (state.loading) {
    return <div className="flex min-h-[60vh] items-center justify-center"><Spinner size="lg" /></div>;
  }

  if (openedTicket) {
    return <TicketDetail ticketId={openedTicket} onBack={() => setOpenedTicket(null)} />;
  }

  return (
    <div className="space-y-4">
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Support</h1>
          <p className="text-sm text-gray-500">Contactez l'équipe pédagogique</p>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="btn-primary">
            <Plus className="mr-1 h-4 w-4" />
            Nouveau ticket
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={submit} className="card">
          <h2 className="mb-3 font-bold">Nouveau ticket</h2>
          <FormField label="Sujet" required id="subject">
            <input
              id="subject"
              className="input-field"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              minLength={3}
              maxLength={200}
              required
              placeholder="Ex : Problème d'accès à la séance 3"
            />
          </FormField>
          <FormField label="Message" required id="message">
            <textarea
              id="message"
              className="input-field min-h-[120px]"
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              minLength={10}
              maxLength={2000}
              required
              placeholder="Décrivez votre problème en détail..."
            />
          </FormField>
          <div className="flex gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
              Annuler
            </button>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? 'Envoi...' : 'Envoyer'}
            </button>
          </div>
        </form>
      )}

      {state.items.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={LifeBuoy}
            title="Aucun ticket"
            description="Créez votre premier ticket pour contacter l'équipe."
          />
        </div>
      ) : (
        <div className="space-y-2">
          {state.items.map((t) => {
            const cfg = STATUS_CONFIG[t.status] || STATUS_CONFIG.open;
            const Icon = cfg.icon;
            return (
              <button
                key={t.id}
                onClick={() => setOpenedTicket(t.id)}
                className="card flex w-full items-start gap-3 text-left transition hover:border-alkher-300"
              >
                <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${cfg.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-sm">{t.subject}</p>
                    <span className={`badge ${cfg.color}`}>{cfg.label}</span>
                  </div>
                  <p className="mt-1 line-clamp-1 text-xs text-gray-500">{t.message}</p>
                  <p className="mt-1 text-xs text-gray-400">
                    {formatDateTime(t.created_at)}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 flex-shrink-0 text-gray-400" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TicketDetail({ ticketId, onBack }) {
  const [state, setState] = useState({ loading: true, ticket: null });

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(ENDPOINTS.support.ticket(ticketId));
        setState({ loading: false, ticket: data });
      } catch {
        setState({ loading: false, ticket: null });
      }
    })();
  }, [ticketId]);

  if (state.loading) {
    return <div className="flex min-h-[60vh] items-center justify-center"><Spinner size="lg" /></div>;
  }
  if (!state.ticket) {
    return <div className="card"><p className="text-red-600">Ticket introuvable</p></div>;
  }

  const t = state.ticket;
  const cfg = STATUS_CONFIG[t.status] || STATUS_CONFIG.open;

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="text-sm text-alkher-600 hover:underline">← Retour</button>

      <div className="card">
        <div className="mb-3 flex items-start justify-between gap-2">
          <div>
            <h1 className="text-lg font-bold">{t.subject}</h1>
            <p className="text-xs text-gray-500">{formatDateTime(t.created_at)}</p>
          </div>
          <span className={`badge ${cfg.color}`}>{cfg.label}</span>
        </div>
        <div className="whitespace-pre-line rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
          {t.message}
        </div>
      </div>
    </div>
  );
}