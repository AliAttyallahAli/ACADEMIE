import { useEffect, useState } from 'react';
import { Users, Search, Mail, Phone, Calendar, Award, BookOpen, Trash2, X } from 'lucide-react';
import api from '../../api/axios';
import { ENDPOINTS } from '../../api/endpoints';
import Toast from '../../components/Toast';
import Spinner from '../../components/Spinner';
import { formatDate } from '../../utils/formatDate';

export default function AdminLearners() {
  const [state, setState] = useState({ loading: true, items: [] });
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState(null);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState({ loading: false, data: null });

  async function load() {
    setState((s) => ({ ...s, loading: true }));
    try {
      const { data } = await api.get(ENDPOINTS.admin.learners, {
        params: { search: search || undefined },
      });
      setState({ loading: false, items: data.items || [] });
    } catch {
      setState({ loading: false, items: [] });
    }
  }

  useEffect(() => { load(); }, [search]);

  async function openDetail(learner) {
    setSelected(learner);
    setDetail({ loading: true, data: null });
    try {
      const { data } = await api.get(ENDPOINTS.admin.learner(learner.id));
      setDetail({ loading: false, data });
    } catch {
      setDetail({ loading: false, data: null });
    }
  }

  async function remove(id) {
    if (!confirm('Supprimer cette apprenante ?')) return;
    try {
      await api.delete(ENDPOINTS.admin.learner(id));
      setToast({ type: 'success', message: 'Apprenante supprimée' });
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
          <h1 className="text-2xl font-bold">Apprenantes</h1>
          <p className="text-sm text-gray-500">
            {state.items.length} apprenante{state.items.length > 1 ? 's' : ''} inscrite{state.items.length > 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher par nom ou email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-alkher-500 focus:outline-none"
        />
      </div>

      {state.loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : state.items.length === 0 ? (
        <div className="card text-center py-8">
          <Users className="mx-auto mb-3 h-10 w-10 text-gray-400" />
          <p className="text-gray-500">Aucune apprenante</p>
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Apprenante</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Inscriptions</th>
                <th className="px-4 py-3">Progression</th>
                <th className="px-4 py-3">Inscrite le</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {state.items.map((l) => (
                <tr key={l.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => openDetail(l)}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-alkher-100 text-xs font-bold text-alkher-700">
                        {l.full_name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium">{l.full_name}</p>
                        <p className="text-xs text-gray-500">Née le {formatDate(l.birth_date)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs">{l.email}</p>
                    {l.phone && <p className="text-xs text-gray-500">{l.phone}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <span className="badge bg-alkher-100 text-alkher-700">{l.enrollments_count}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs">
                      {l.sessions_completed} séances · {l.modules_completed} modules
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{formatDate(l.created_at)}</td>
                  <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => remove(l.id)}
                      className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                      title="Supprimer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
          <aside className="flex h-full w-full max-w-2xl flex-col bg-white shadow-xl">
            <header className="flex items-center justify-between border-b p-4">
              <h2 className="font-bold">Détails — {selected.full_name}</h2>
              <button onClick={() => setSelected(null)} className="rounded p-1 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {detail.loading ? (
                <div className="flex justify-center py-8"><Spinner /></div>
              ) : !detail.data ? (
                <p className="text-sm text-gray-500">Erreur de chargement</p>
              ) : (
                <>
                  {/* Identité */}
                  <div className="card">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-alkher-100 text-lg font-bold text-alkher-700">
                        {detail.data.full_name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold">{detail.data.full_name}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Mail className="h-3 w-3" />{detail.data.email}
                        </p>
                        {detail.data.phone && (
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <Phone className="h-3 w-3" />{detail.data.phone}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />Née le {formatDate(detail.data.birth_date)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Inscriptions */}
                  <div>
                    <h3 className="mb-2 flex items-center gap-2 font-bold">
                      <BookOpen className="h-4 w-4" />Inscriptions ({detail.data.enrollments.length})
                    </h3>
                    {detail.data.enrollments.length === 0 ? (
                      <p className="text-sm text-gray-500">Aucune inscription</p>
                    ) : (
                      <div className="space-y-2">
                        {detail.data.enrollments.map((e) => (
                          <div key={e.id} className="card flex items-center justify-between">
                            <div>
                              <p className="font-medium text-sm">{e.module_title}</p>
                              <p className="text-xs text-gray-500">
                                {formatDate(e.enrolled_at)} · {e.payment_status}
                              </p>
                            </div>
                            <span className={`badge ${e.status === 'completed' ? 'bg-green-100 text-green-700' : e.payment_status === 'paid' ? 'bg-alkher-100 text-alkher-700' : 'bg-yellow-100 text-yellow-700'}`}>
                              {e.status === 'completed' ? 'Terminé' : e.payment_status === 'paid' ? 'Payée' : 'En attente'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Certificats */}
                  {detail.data.certificates.length > 0 && (
                    <div>
                      <h3 className="mb-2 flex items-center gap-2 font-bold">
                        <Award className="h-4 w-4" />Certificats ({detail.data.certificates.length})
                      </h3>
                      <div className="space-y-1">
                        {detail.data.certificates.map((c) => (
                          <div key={c.certificate_uuid} className="flex items-center justify-between rounded-lg border p-2 text-xs">
                            <span className="font-mono truncate">{c.certificate_uuid.slice(0, 20)}...</span>
                            <span className="text-gray-500">{formatDate(c.issued_at)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}