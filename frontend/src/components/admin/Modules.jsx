import { useEffect, useState } from 'react';
import {
  Plus, Edit, Trash2, BookOpen, FileQuestion, ChevronRight,
  ArrowLeft, Eye, RefreshCw, Lock, CheckCircle2, AlertCircle,
} from 'lucide-react';
import api from '../../api/axios';
import { ENDPOINTS } from '../../api/endpoints';
import DataTable from '../../components/admin/DataTable';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import ModuleForm from '../../components/admin/ModuleForm';
import SessionForm from '../../components/admin/SessionForm';
import QuizBuilder from '../../components/admin/QuizBuilder';
import Toast from '../../components/Toast';
import Spinner from '../../components/Spinner';
import { formatDate } from '../../utils/formatDate';

export default function Modules() {
  const [view, setView] = useState('list'); // 'list' | 'sessions'
  const [selectedModule, setSelectedModule] = useState(null);

  return (
    <div className="space-y-6">
      {view === 'list' ? (
        <ModulesList
          onSelect={(m) => { setSelectedModule(m); setView('sessions'); }}
        />
      ) : (
        <ModuleSessions
          module={selectedModule}
          onBack={() => { setSelectedModule(null); setView('list'); }}
        />
      )}
    </div>
  );
}

// ═══════════════ LISTE DES MODULES ═══════════════
function ModulesList({ onSelect }) {
  const [state, setState] = useState({ loading: true, items: [] });
  const [toast, setToast] = useState(null);
  const [modal, setModal] = useState(null); // 'create' | 'edit' | 'delete'
  const [selected, setSelected] = useState(null);
  const [processing, setProcessing] = useState(false);

  async function load() {
    setState((s) => ({ ...s, loading: true }));
    try {
      const { data } = await api.get(ENDPOINTS.admin.modules, { params: { limit: 100 } });
      setState({ loading: false, items: data.items || [] });
    } catch {
      setState({ loading: false, items: [] });
    }
  }

  useEffect(() => { load(); }, []);

  async function handleDelete() {
    setProcessing(true);
    try {
      await api.delete(ENDPOINTS.admin.module(selected.id));
      setToast({ type: 'success', message: 'Module supprimé' });
      setModal(null);
      await load();
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.error || 'Erreur' });
    } finally {
      setProcessing(false);
    }
  }

  const columns = [
    {
      key: 'title',
      label: 'Titre',
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-alkher-50 p-1.5">
            <BookOpen className="h-4 w-4 text-alkher-600" />
          </div>
          <span className="font-medium">{row.title}</span>
        </div>
      ),
    },
    {
      key: 'duration_weeks',
      label: 'Durée',
      render: (row) => `${row.duration_weeks} sem.`,
    },
    {
      key: 'frequency_per_week',
      label: 'Fréquence',
      render: (row) => `${row.frequency_per_week}x/sem`,
    },
    {
      key: 'total_sessions',
      label: 'Séances',
      render: (row) => (
        <span className="badge bg-gray-100 text-gray-700">{row.total_sessions}</span>
      ),
    },
    {
      key: 'total_enrollments',
      label: 'Inscrites',
      render: (row) => row.total_enrollments || 0,
    },
    {
      key: 'created_at',
      label: 'Créé le',
      render: (row) => formatDate(row.created_at),
    },
  ];

  const actions = (row) => (
    <div className="flex justify-end gap-1">
      <button
        onClick={() => onSelect(row)}
        className="rounded-lg p-2 text-alkher-600 hover:bg-alkher-50"
        title="Gérer les séances"
      >
        <Eye className="h-4 w-4" />
      </button>
      <button
        onClick={() => { setSelected(row); setModal('edit'); }}
        className="rounded-lg p-2 text-gray-600 hover:bg-gray-100"
        title="Modifier"
      >
        <Edit className="h-4 w-4" />
      </button>
      <button
        onClick={() => { setSelected(row); setModal('delete'); }}
        className="rounded-lg p-2 text-red-600 hover:bg-red-50"
        title="Supprimer"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );

  return (
    <>
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Modules</h1>
          <p className="text-sm text-gray-500">
            Gérez les modules, leurs séances et leurs quiz
          </p>
        </div>
        <button onClick={() => setModal('create')} className="btn-primary">
          <Plus className="mr-2 h-4 w-4" />
          Nouveau module
        </button>
      </div>

      {state.loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : (
        <DataTable
          columns={columns}
          data={state.items}
          searchKeys={['title', 'description']}
          actions={actions}
          emptyMessage="Aucun module"
        />
      )}

      {/* Formulaire création/édition */}
      {(modal === 'create' || modal === 'edit') && (
        <ModuleForm
          initial={modal === 'edit' ? selected : null}
          onClose={() => setModal(null)}
          onSaved={(msg) => {
            setToast({ type: 'success', message: msg });
            setModal(null);
            load();
          }}
          onError={(msg) => setToast({ type: 'error', message: msg })}
        />
      )}

      <ConfirmDialog
        open={modal === 'delete'}
        title="Supprimer ce module ?"
        message={`"${selected?.title}" sera supprimé avec toutes ses séances et quiz. Les inscriptions associées ne seront plus accessibles.`}
        variant="danger"
        confirmLabel="Supprimer"
        loading={processing}
        onConfirm={handleDelete}
        onCancel={() => setModal(null)}
      />
    </>
  );
}

// ═══════════════ SÉANCES D'UN MODULE ═══════════════
function ModuleSessions({ module, onBack }) {
  const [state, setState] = useState({ loading: true, sessions: [] });
  const [toast, setToast] = useState(null);
  const [editingSession, setEditingSession] = useState(null);
  const [buildingQuiz, setBuildingQuiz] = useState(null);
  const [regenerating, setRegenerating] = useState(false);

  async function load() {
    setState((s) => ({ ...s, loading: true }));
    try {
      const { data } = await api.get(ENDPOINTS.admin.sessionsByModule(module.id));
      setState({ loading: false, sessions: data.sessions || [] });
    } catch {
      setState({ loading: false, sessions: [] });
    }
  }

  useEffect(() => { load(); }, [module.id]);

  async function regenerate() {
    if (!confirm(
      `Régénérer toutes les séances ? Les ${state.sessions.length} séances existantes seront supprimées et recréées.`
    )) return;
    setRegenerating(true);
    try {
      const startDate = new Date().toISOString().split('T')[0];
      await api.post(ENDPOINTS.admin.moduleRegenerate(module.id), { start_date: startDate });
      setToast({ type: 'success', message: 'Séances régénérées' });
      await load();
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.error || 'Erreur' });
    } finally {
      setRegenerating(false);
    }
  }

  return (
    <>
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />

      <button onClick={onBack} className="inline-flex items-center gap-1 text-sm text-alkher-600 hover:underline">
        <ArrowLeft className="h-4 w-4" /> Retour aux modules
      </button>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{module.title}</h1>
          <p className="text-sm text-gray-500">
            {module.duration_weeks} semaines · {module.frequency_per_week}x/sem · {module.total_sessions} séances
          </p>
        </div>
        <button onClick={regenerate} disabled={regenerating} className="btn-secondary">
          <RefreshCw className={`mr-2 h-4 w-4 ${regenerating ? 'animate-spin' : ''}`} />
          Régénérer les séances
        </button>
      </div>

      {state.loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : state.sessions.length === 0 ? (
        <div className="card text-center">
          <AlertCircle className="mx-auto mb-3 h-10 w-10 text-yellow-500" />
          <p className="text-gray-600">Aucune séance. Cliquez sur "Régénérer les séances".</p>
        </div>
      ) : (
        <div className="space-y-2">
          {state.sessions.map((s) => (
            <div
              key={s.id}
              className="card flex flex-col gap-3 sm:flex-row sm:items-center"
            >
              <div className="flex items-center gap-3 sm:w-16">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-alkher-100 text-sm font-bold text-alkher-700">
                  {s.session_number}
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <p className="font-medium">{s.title || `Séance ${s.session_number}`}</p>
                <div className="mt-1 flex flex-wrap gap-3 text-xs text-gray-500">
                  <span>📅 {formatDate(s.scheduled_date)}</span>
                  {s.content ? (
                    <span className="text-green-600">✅ Contenu renseigné</span>
                  ) : (
                    <span className="text-yellow-600">⚠️ Sans contenu</span>
                  )}
                  {s.quiz_id ? (
                    <span className="text-green-600">📝 Quiz actif</span>
                  ) : (
                    <span className="text-gray-400">📝 Sans quiz</span>
                  )}
                </div>
              </div>

              <div className="flex gap-1">
                <button
                  onClick={() => setEditingSession(s)}
                  className="rounded-lg p-2 text-gray-600 hover:bg-gray-100"
                  title="Éditer le contenu"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setBuildingQuiz(s)}
                  className={`rounded-lg p-2 ${
                    s.quiz_id
                      ? 'text-green-600 hover:bg-green-50'
                      : 'text-alkher-600 hover:bg-alkher-50'
                  }`}
                  title={s.quiz_id ? 'Éditer le quiz' : 'Créer un quiz'}
                >
                  <FileQuestion className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editingSession && (
        <SessionForm
          session={editingSession}
          onClose={() => setEditingSession(null)}
          onSaved={load}
        />
      )}

      {buildingQuiz && (
        <QuizBuilder
          session={buildingQuiz}
          onClose={() => { setBuildingQuiz(null); load(); }}
        />
      )}
    </>
  );
}