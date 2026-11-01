import { useEffect, useState } from 'react';
import {
  CheckCircle2, XCircle, Clock, Plus, Search, Filter,
} from 'lucide-react';
import api from '../../api/axios';
import { ENDPOINTS } from '../../api/endpoints';
import DataTable from '../../components/admin/DataTable';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import Drawer from '../../components/admin/Drawer';
import Toast from '../../components/Toast';
import Spinner from '../../components/Spinner';
import FormField from '../../components/FormField';
import { formatDate, formatDateTime } from '../../utils/formatDate';

const TABS = [
  { key: 'pending', label: 'En attente', icon: Clock },
  { key: 'all', label: 'Toutes', icon: Filter },
  { key: 'manual', label: 'Créer manuelle', icon: Plus },
];

export default function Enrollments() {
  const [tab, setTab] = useState('pending');
  const [toast, setToast] = useState(null);

  return (
    <div className="space-y-6">
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
      <div>
        <h1 className="text-2xl font-bold">Gestion des inscriptions</h1>
        <p className="text-sm text-gray-500">
          Validez les inscriptions en attente ou créez-en manuellement
        </p>
      </div>

      {/* Onglets */}
      <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition ${
                tab === t.key ? 'bg-white text-alkher-700 shadow-sm' : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'pending' && <PendingTab onToast={setToast} />}
      {tab === 'all' && <AllTab onToast={setToast} />}
      {tab === 'manual' && <ManualTab onToast={setToast} />}
    </div>
  );
}

// ═══════════════ ONGLET PENDING ═══════════════
function PendingTab({ onToast }) {
  const [state, setState] = useState({ loading: true, items: [] });
  const [confirm, setConfirm] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [note, setNote] = useState('');

  async function load() {
    setState((s) => ({ ...s, loading: true }));
    try {
      const { data } = await api.get(ENDPOINTS.admin.enrollmentsPending);
      setState({ loading: false, items: data.items });
    } catch {
      setState({ loading: false, items: [] });
    }
  }

  useEffect(() => { load(); }, []);

  async function validate(id) {
    setProcessing(true);
    try {
      await api.post(ENDPOINTS.admin.enrollmentValidate(id), { note });
      onToast({ type: 'success', message: 'Inscription validée' });
      setConfirm(null);
      setNote('');
      await load();
    } catch (err) {
      onToast({ type: 'error', message: err.response?.data?.error || 'Erreur' });
    } finally {
      setProcessing(false);
    }
  }

  async function reject(id) {
    setProcessing(true);
    try {
      await api.post(ENDPOINTS.admin.enrollmentReject(id), { note });
      onToast({ type: 'success', message: 'Inscription rejetée' });
      setConfirm(null);
      setNote('');
      await load();
    } catch (err) {
      onToast({ type: 'error', message: err.response?.data?.error || 'Erreur' });
    } finally {
      setProcessing(false);
    }
  }

  const columns = [
    {
      key: 'learner_name',
      label: 'Apprenante',
      render: (row) => (
        <div>
          <p className="font-medium">{row.learner_name}</p>
          <p className="text-xs text-gray-500">{row.learner_email}</p>
        </div>
      ),
    },
    { key: 'module_title', label: 'Module' },
    {
      key: 'enrolled_at',
      label: 'Date',
      render: (row) => formatDate(row.enrolled_at),
    },
    {
      key: 'start_date',
      label: 'Début',
      render: (row) => formatDate(row.start_date),
    },
  ];

  const actions = (row) => (
    <div className="flex justify-end gap-1">
      <button
        onClick={() => setConfirm({ type: 'validate', row })}
        className="rounded-lg bg-green-50 p-2 text-green-700 hover:bg-green-100"
        title="Valider"
      >
        <CheckCircle2 className="h-4 w-4" />
      </button>
      <button
        onClick={() => setConfirm({ type: 'reject', row })}
        className="rounded-lg bg-red-50 p-2 text-red-700 hover:bg-red-100"
        title="Rejeter"
      >
        <XCircle className="h-4 w-4" />
      </button>
    </div>
  );

  return (
    <>
      {state.loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : (
        <>
          <div className="mb-3 text-sm text-gray-500">
            {state.items.length} inscription(s) en attente
          </div>
          <DataTable
            columns={columns}
            data={state.items}
            searchKeys={['learner_name', 'learner_email', 'module_title']}
            actions={actions}
            emptyMessage="Aucune inscription en attente"
          />
        </>
      )}

      <ConfirmDialog
        open={!!confirm}
        title={confirm?.type === 'validate' ? 'Valider l\'inscription ?' : 'Rejeter l\'inscription ?'}
        message={
          confirm?.type === 'validate'
            ? `L'inscription de ${confirm?.row?.learner_name} au module "${confirm?.row?.module_title}" sera activée immédiatement.`
            : `L'inscription de ${confirm?.row?.learner_name} sera rejetée.`
        }
        variant={confirm?.type === 'validate' ? 'primary' : 'danger'}
        confirmLabel={confirm?.type === 'validate' ? 'Valider' : 'Rejeter'}
        loading={processing}
        onConfirm={() => {
          if (confirm.type === 'validate') validate(confirm.row.id);
          else reject(confirm.row.id);
        }}
        onCancel={() => { setConfirm(null); setNote(''); }}
      />

      {confirm && (
        <div className="fixed bottom-24 left-1/2 z-50 w-full max-w-md -translate-x-1/2 px-4">
          <div className="rounded-lg border bg-white p-3 shadow-lg">
            <label className="mb-1 block text-xs font-medium text-gray-700">
              Note (optionnelle)
            </label>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ex : Paiement espèces reçu le..."
              className="input-field text-sm"
            />
          </div>
        </div>
      )}
    </>
  );
}

// ═══════════════ ONGLET ALL ═══════════════
function AllTab() {
  const [state, setState] = useState({ loading: true, items: [] });
  const [statusFilter, setStatusFilter] = useState('');

  async function load() {
    setState((s) => ({ ...s, loading: true }));
    try {
      const { data } = await api.get(ENDPOINTS.admin.enrollments, {
        params: { limit: 200, status: statusFilter || undefined },
      });
      setState({ loading: false, items: data.items });
    } catch {
      setState({ loading: false, items: [] });
    }
  }

  useEffect(() => { load(); }, [statusFilter]);

  const columns = [
    {
      key: 'learner_name',
      label: 'Apprenante',
      render: (row) => (
        <div>
          <p className="font-medium">{row.learner_name}</p>
          <p className="text-xs text-gray-500">{row.learner_email}</p>
        </div>
      ),
    },
    { key: 'module_title', label: 'Module' },
    {
      key: 'payment_status',
      label: 'Paiement',
      render: (row) => {
        const cfg = {
          paid: 'bg-green-100 text-green-700',
          pending: 'bg-yellow-100 text-yellow-700',
          rejected: 'bg-red-100 text-red-700',
        };
        const labels = { paid: 'Payée', pending: 'En attente', rejected: 'Rejetée' };
        return <span className={`badge ${cfg[row.payment_status]}`}>{labels[row.payment_status]}</span>;
      },
    },
    {
      key: 'validated_by',
      label: 'Validé par',
      render: (row) => row.validated_by ? (
        <span className="text-xs">
          {row.validated_by === 'admin' ? '👤 Admin' : '💳 AlkherPay'}
        </span>
      ) : '—',
    },
    {
      key: 'enrolled_at',
      label: 'Inscription',
      render: (row) => formatDate(row.enrolled_at),
    },
    {
      key: 'status',
      label: 'Statut',
      render: (row) => (
        <span className={`badge ${row.status === 'completed' ? 'bg-alkher-100 text-alkher-700' : 'bg-gray-100 text-gray-600'}`}>
          {row.status === 'completed' ? 'Terminé' : 'Actif'}
        </span>
      ),
    },
  ];

  return (
    <>
      <div className="mb-3 flex items-center gap-2">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">Tous les statuts</option>
          <option value="paid">Payées</option>
          <option value="pending">En attente</option>
          <option value="rejected">Rejetées</option>
        </select>
        <span className="text-sm text-gray-500">
          {state.items.length} résultat(s)
        </span>
      </div>

      {state.loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : (
        <DataTable
          columns={columns}
          data={state.items}
          searchKeys={['learner_name', 'learner_email', 'module_title']}
          emptyMessage="Aucune inscription"
        />
      )}
    </>
  );
}

// ═══════════════ ONGLET MANUAL ═══════════════
function ManualTab({ onToast }) {
  const [learners, setLearners] = useState([]);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    learner_id: '',
    module_id: '',
    start_date: new Date().toISOString().split('T')[0],
    note: '',
  });

  useEffect(() => {
    (async () => {
      try {
        // Utiliser les endpoints existants pour peupler les selects
        const [modulesRes] = await Promise.all([
          api.get(ENDPOINTS.admin.modules, { params: { limit: 100 } }),
        ]);
        setModules(modulesRes.data.items || []);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function submit(e) {
    e.preventDefault();
    if (!form.learner_id || !form.module_id) {
      onToast({ type: 'error', message: 'Champs requis manquants' });
      return;
    }
    setSubmitting(true);
    try {
      await api.post(ENDPOINTS.admin.enrollmentManual, {
        learner_id: Number(form.learner_id),
        module_ids: [Number(form.module_id)],
        start_date: form.start_date,
        note: form.note || 'Inscription manuelle admin',
      });
      onToast({ type: 'success', message: 'Inscription créée et activée' });
      setForm({
        learner_id: '',
        module_id: '',
        start_date: new Date().toISOString().split('T')[0],
        note: '',
      });
    } catch (err) {
      onToast({ type: 'error', message: err.response?.data?.error || 'Erreur' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="card max-w-xl">
      <h2 className="mb-4 font-bold">Créer une inscription manuelle</h2>
      <p className="mb-4 text-sm text-gray-600">
        Pour les paiements en espèces, mobile money hors plateforme, bourses accordées ou gestes commerciaux.
      </p>

      <form onSubmit={submit}>
        <FormField label="ID de l'apprenante" required id="learner_id" hint="Saisir l'ID du compte apprenante existant">
          <input
            id="learner_id"
            type="number"
            className="input-field"
            value={form.learner_id}
            onChange={(e) => setForm({ ...form, learner_id: e.target.value })}
            required
          />
        </FormField>

        <FormField label="Module" required id="module_id">
          <select
            id="module_id"
            className="input-field"
            value={form.module_id}
            onChange={(e) => setForm({ ...form, module_id: e.target.value })}
            required
          >
            <option value="">Sélectionner...</option>
            {modules.map((m) => (
              <option key={m.id} value={m.id}>{m.title}</option>
            ))}
          </select>
        </FormField>

        <FormField label="Date de début" required id="start_date">
          <input
            id="start_date"
            type="date"
            className="input-field"
            value={form.start_date}
            onChange={(e) => setForm({ ...form, start_date: e.target.value })}
            required
          />
        </FormField>

        <FormField label="Note" id="note" hint="Traçabilité (paiement espèces, bourse, etc.)">
          <input
            id="note"
            className="input-field"
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
            placeholder="Ex : Bourse accordée — dossier n°2024-12"
          />
        </FormField>

        <button type="submit" disabled={submitting} className="btn-primary">
          {submitting ? <Spinner size="sm" className="mr-2 !border-white" /> : <Plus className="mr-2 h-4 w-4" />}
          Créer et activer l'inscription
        </button>
      </form>
    </div>
  );
}