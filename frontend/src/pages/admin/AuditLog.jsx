import { useEffect, useState } from 'react';
import {
  Activity, Search, Download, RefreshCw, ChevronRight, X,
  ShieldCheck, User, GraduationCap, Bot, Eye, Filter,
} from 'lucide-react';
import api from '../../api/axios';
import { ENDPOINTS } from '../../api/endpoints';
import Toast from '../../components/Toast';
import Spinner from '../../components/Spinner';
import { formatDateTime } from '../../utils/formatDate';

const ACTOR_TYPES = [
  { value: '', label: 'Tous les acteurs' },
  { value: 'admin', label: 'Admin', icon: ShieldCheck, color: 'bg-red-100 text-red-700' },
  { value: 'responsible', label: 'Responsable', icon: User, color: 'bg-purple-100 text-purple-700' },
  { value: 'learner', label: 'Apprenante', icon: GraduationCap, color: 'bg-alkher-100 text-alkher-700' },
  { value: 'system', label: 'Système', icon: Bot, color: 'bg-gray-100 text-gray-700' },
];

const ACTION_COLORS = {
  validate_enrollment: 'bg-green-100 text-green-700',
  reject_enrollment: 'bg-red-100 text-red-700',
  activate_enrollment: 'bg-green-100 text-green-700',
  create_module: 'bg-alkher-100 text-alkher-700',
  update_module: 'bg-blue-100 text-blue-700',
  delete_module: 'bg-red-100 text-red-700',
  create_scholarship: 'bg-alkher-100 text-alkher-700',
  publish_scholarship: 'bg-green-100 text-green-700',
  close_scholarship: 'bg-orange-100 text-orange-700',
  create_responsible: 'bg-purple-100 text-purple-700',
  delete_responsible: 'bg-red-100 text-red-700',
};

export default function AdminAuditLog() {
  const [state, setState] = useState({ loading: true, items: [], stats: [], pagination: null });
  const [toast, setToast] = useState(null);
  const [filters, setFilters] = useState({ actor_type: '', action_type: '', search: '' });
  const [selected, setSelected] = useState(null);
  const [page, setPage] = useState(1);

  async function load() {
    setState((s) => ({ ...s, loading: true }));
    try {
      const { data } = await api.get(ENDPOINTS.admin.auditLog, {
        params: {
          actor_type: filters.actor_type || undefined,
          action_type: filters.action_type || undefined,
          search: filters.search || undefined,
          page,
          limit: 50,
        },
      });
      setState({
        loading: false,
        items: data.items || [],
        stats: data.stats || [],
        pagination: data.pagination,
      });
    } catch {
      setState({ loading: false, items: [], stats: [], pagination: null });
      setToast({ type: 'error', message: 'Erreur de chargement' });
    }
  }

  useEffect(() => { load(); }, [filters.actor_type, filters.action_type, page]);

  function handleSearch(e) {
    e.preventDefault();
    setPage(1);
    load();
  }

  function resetFilters() {
    setFilters({ actor_type: '', action_type: '', search: '' });
    setPage(1);
  }

  function exportCsv() {
    const url = `${import.meta.env.VITE_API_URL || 'http://localhost:4000/api'}/admin/audit-log/export/csv`;
    const token = localStorage.getItem('alkher_token');
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.blob())
      .then((blob) => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `audit-log-${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(a.href);
      })
      .catch(() => setToast({ type: 'error', message: 'Erreur export' }));
  }

  return (
    <div className="space-y-6">
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="h-6 w-6 text-alkher-600" />
            Journal d'audit
          </h1>
          <p className="text-sm text-gray-500">
            Historique complet des actions sur la plateforme
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="btn-secondary">
            <RefreshCw className="mr-2 h-4 w-4" />Rafraîchir
          </button>
          <button onClick={exportCsv} className="btn-secondary">
            <Download className="mr-2 h-4 w-4" />Export CSV
          </button>
        </div>
      </div>

      {/* Statistiques top actions */}
      {state.stats.length > 0 && (
        <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
          {state.stats.slice(0, 5).map((s) => (
            <div key={s.action_type} className="card p-3">
              <p className="text-xs text-gray-500 line-clamp-1">{s.action_type.replace(/_/g, ' ')}</p>
              <p className="text-xl font-bold">{s.count}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filtres */}
      <div className="card">
        <form onSubmit={handleSearch} className="flex flex-wrap items-end gap-3">
          <div className="min-w-[200px] flex-1">
            <label className="mb-1 block text-xs font-medium text-gray-600">
              <Search className="mr-1 inline h-3 w-3" />Rechercher
            </label>
            <input
              type="text"
              placeholder="Nom, action, détails..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="input-field text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Acteur</label>
            <select
              value={filters.actor_type}
              onChange={(e) => { setFilters({ ...filters, actor_type: e.target.value }); setPage(1); }}
              className="input-field text-sm"
            >
              {ACTOR_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Action</label>
            <input
              type="text"
              placeholder="ex: validate_enrollment"
              value={filters.action_type}
              onChange={(e) => setFilters({ ...filters, action_type: e.target.value })}
              className="input-field text-sm"
            />
          </div>
          <button type="submit" className="btn-primary text-sm">Filtrer</button>
          <button type="button" onClick={resetFilters} className="btn-secondary text-sm">Réinitialiser</button>
        </form>
      </div>

      {/* Tableau */}
      {state.loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : state.items.length === 0 ? (
        <div className="card text-center py-12">
          <Activity className="mx-auto mb-3 h-10 w-10 text-gray-400" />
          <p className="text-gray-500">Aucune action enregistrée</p>
        </div>
      ) : (
        <>
          <div className="rounded-lg border border-gray-200 bg-white overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Acteur</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Cible</th>
                  <th className="px-4 py-3 text-right">Détails</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {state.items.map((a) => {
                  const actorCfg = ACTOR_TYPES.find((t) => t.value === a.actor_type) || ACTOR_TYPES[4];
                  const ActorIcon = actorCfg.icon;
                  return (
                    <tr
                      key={a.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => setSelected(a)}
                    >
                      <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">
                        {formatDateTime(a.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className={`badge ${actorCfg.color}`}>
                            <ActorIcon className="mr-1 h-3 w-3" />
                            {actorCfg.label}
                          </span>
                          {a.actor_name && (
                            <span className="text-xs text-gray-600">{a.actor_name}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`badge ${ACTION_COLORS[a.action_type] || 'bg-gray-100 text-gray-700'}`}>
                          {a.action_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">
                        {a.target_type ? `${a.target_type} #${a.target_id}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelected(a); }}
                          className="rounded-lg p-1.5 text-alkher-600 hover:bg-alkher-50"
                          title="Voir les détails"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {state.pagination && state.pagination.pages > 1 && (
            <div className="flex items-center justify-between rounded-lg border bg-white p-3 text-sm">
              <span className="text-gray-500">
                Page {state.pagination.page} / {state.pagination.pages} — {state.pagination.total} entrées
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={state.pagination.page <= 1}
                  className="btn-secondary text-xs"
                >
                  ← Précédent
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(state.pagination.pages, p + 1))}
                  disabled={state.pagination.page >= state.pagination.pages}
                  className="btn-secondary text-xs"
                >
                  Suivant →
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Drawer de détail */}
      {selected && (
        <AuditDetailDrawer entry={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

function AuditDetailDrawer({ entry, onClose }) {
  const actorCfg = ACTOR_TYPES.find((t) => t.value === entry.actor_type) || ACTOR_TYPES[4];
  const ActorIcon = actorCfg.icon;

  let details = null;
  try {
    details = entry.details_json ? JSON.parse(entry.details_json) : null;
  } catch {}

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
      <aside className="flex h-full w-full max-w-lg flex-col bg-white shadow-xl">
        <header className="flex items-center justify-between border-b p-4">
          <h2 className="font-bold flex items-center gap-2">
            <Activity className="h-5 w-5 text-alkher-600" />
            Détail de l'action
          </h2>
          <button onClick={onClose} className="rounded p-1 hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* ID et date */}
          <div className="rounded-lg bg-gray-50 p-3">
            <p className="text-xs text-gray-500">Entrée #{entry.id}</p>
            <p className="text-sm font-medium">{formatDateTime(entry.created_at)}</p>
          </div>

          {/* Acteur */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Acteur</label>
            <div className="flex items-center gap-2 rounded-lg border border-gray-200 p-3">
              <div className={`rounded-lg p-2 ${actorCfg.color}`}>
                <ActorIcon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium">{actorCfg.label}</p>
                {entry.actor_name && (
                  <p className="text-xs text-gray-500">
                    {entry.actor_name} (ID: {entry.actor_id})
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Action */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Action</label>
            <div className="rounded-lg border border-gray-200 p-3">
              <span className={`badge ${ACTION_COLORS[entry.action_type] || 'bg-gray-100 text-gray-700'}`}>
                {entry.action_type}
              </span>
            </div>
          </div>

          {/* Cible */}
          {entry.target_type && (
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Cible</label>
              <div className="rounded-lg border border-gray-200 p-3">
                <p className="text-sm">
                  <strong>{entry.target_type}</strong>
                  {entry.target_id && ` #${entry.target_id}`}
                </p>
              </div>
            </div>
          )}

          {/* Détails JSON */}
          {details && (
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Détails</label>
              <div className="rounded-lg bg-gray-900 p-3 overflow-x-auto">
                <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap">
                  {JSON.stringify(details, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {!details && entry.details_json && (
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Détails bruts</label>
              <div className="rounded-lg bg-gray-50 p-3">
                <pre className="text-xs text-gray-700 font-mono whitespace-pre-wrap break-all">
                  {entry.details_json}
                </pre>
              </div>
            </div>
          )}
        </div>

        <footer className="border-t p-4">
          <button onClick={onClose} className="btn-secondary w-full">
            Fermer
          </button>
        </footer>
      </aside>
    </div>
  );
}
