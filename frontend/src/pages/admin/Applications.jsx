import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileCheck, Search, Filter, Clock, CheckCircle2, XCircle,
  User, Mail, Calendar, Briefcase, ChevronRight, Download,
  FileText, MapPin, Phone, X, Send,
} from 'lucide-react';
import api from '../../api/axios';
import { ENDPOINTS } from '../../api/endpoints';
import Toast from '../../components/Toast';
import Spinner from '../../components/Spinner';
import { formatDate, formatDateTime } from '../../utils/formatDate';

const BASE = import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000';

const STATUS = {
  pending: { label: 'En attente', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  accepted: { label: 'Acceptée', color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
  rejected: { label: 'Refusée', color: 'bg-red-100 text-red-800', icon: XCircle },
};

export default function AdminApplications() {
  const [state, setState] = useState({ loading: true, items: [], stats: null });
  const [toast, setToast] = useState(null);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);

  async function load() {
    setState((s) => ({ ...s, loading: true }));
    try {
      const { data } = await api.get(ENDPOINTS.admin.allApplications, {
        params: { status: filter !== 'all' ? filter : undefined },
      });
      setState({ loading: false, items: data.items || [], stats: data.stats });
    } catch {
      setState({ loading: false, items: [], stats: null });
      setToast({ type: 'error', message: 'Erreur de chargement' });
    }
  }

  useEffect(() => { load(); }, [filter]);

  async function review(appId, status, note) {
    try {
      await api.post(ENDPOINTS.admin.reviewApplication(appId), {
        status,
        review_note: note,
      });
      setToast({
        type: 'success',
        message: status === 'accepted' ? 'Candidature acceptée' : 'Candidature refusée',
      });
      setSelected(null);
      await load();
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.error || 'Erreur' });
    }
  }

  const filtered = state.items.filter((a) => {
    if (filter !== 'all' && a.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        a.learner_name?.toLowerCase().includes(q) ||
        a.learner_email?.toLowerCase().includes(q) ||
        a.scholarship_title?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileCheck className="h-6 w-6 text-alkher-600" />
            Demandes de bourse
          </h1>
          <p className="text-sm text-gray-500">
            Toutes les candidatures, toutes bourses confondues
          </p>
        </div>
        <Link to="/admin/scholarships" className="btn-secondary text-sm">
          Voir les bourses
        </Link>
      </div>

      {/* Stats */}
      {state.stats && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard label="Total" value={state.stats.total} color="alkher" />
          <StatCard label="En attente" value={state.stats.pending} color="yellow" />
          <StatCard label="Acceptées" value={state.stats.accepted} color="green" />
          <StatCard label="Refusées" value={state.stats.rejected} color="red" />
        </div>
      )}

      {/* Filtres */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par nom, email ou bourse..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-9 text-sm"
          />
        </div>
        <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
          {[
            { key: 'all', label: 'Toutes' },
            { key: 'pending', label: 'En attente' },
            { key: 'accepted', label: 'Acceptées' },
            { key: 'rejected', label: 'Refusées' },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                filter === f.key ? 'bg-white text-alkher-700 shadow-sm' : 'text-gray-600'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {state.loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-12">
          <FileCheck className="mx-auto mb-3 h-10 w-10 text-gray-400" />
          <p className="text-gray-500">
            {state.items.length === 0 ? 'Aucune candidature' : 'Aucun résultat pour ces filtres'}
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Apprenante</th>
                <th className="px-4 py-3">Bourse</th>
                <th className="px-4 py-3">Soumise</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((a) => {
                const cfg = STATUS[a.status] || STATUS.pending;
                const Icon = cfg.icon;
                return (
                  <tr
                    key={a.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => setSelected(a)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-alkher-100 text-xs font-bold text-alkher-700">
                          {a.learner_name?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium">{a.learner_name}</p>
                          <p className="text-xs text-gray-500">{a.learner_email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{a.scholarship_title}</p>
                      <p className="text-xs text-gray-500">{a.organization || a.scholarship_type}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {formatDate(a.applied_at)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${cfg.color}`}>
                        <Icon className="mr-1 h-3 w-3" />
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setSelected(a)}
                        className="rounded-lg p-1.5 text-alkher-600 hover:bg-alkher-50"
                        title="Voir le dossier"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Drawer détail */}
      {selected && (
        <ApplicationDrawer
          application={selected}
          onClose={() => setSelected(null)}
          onReview={review}
        />
      )}
    </div>
  );
}

function StatCard({ label, value, color }) {
  const colors = {
    alkher: 'border-alkher-200 bg-alkher-50 text-alkher-700',
    yellow: 'border-yellow-200 bg-yellow-50 text-yellow-700',
    green: 'border-green-200 bg-green-50 text-green-700',
    red: 'border-red-200 bg-red-50 text-red-700',
  };
  return (
    <div className={`card border-2 p-4 ${colors[color]}`}>
      <p className="text-xs opacity-75">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

function ApplicationDrawer({ application, onClose, onReview }) {
  const [reviewNote, setReviewNote] = useState(application.review_note || '');
  const [processing, setProcessing] = useState(false);
  const cfg = STATUS[application.status] || STATUS.pending;
  const Icon = cfg.icon;

  let extraDocs = [];
  try {
    extraDocs = application.extra_docs_json ? JSON.parse(application.extra_docs_json) : [];
  } catch {}

  async function handleReview(status) {
    setProcessing(true);
    await onReview(application.id, status, reviewNote);
    setProcessing(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
      <aside className="flex h-full w-full max-w-2xl flex-col bg-white shadow-xl">
        <header className="flex items-center justify-between border-b p-4">
          <h2 className="font-bold flex items-center gap-2">
            <User className="h-5 w-5 text-alkher-600" />
            Dossier de candidature
          </h2>
          <button onClick={onClose} className="rounded p-1 hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Statut actuel */}
          <div className={`rounded-lg p-3 ${cfg.color}`}>
            <div className="flex items-center gap-2">
              <Icon className="h-5 w-5" />
              <p className="font-medium">{cfg.label}</p>
            </div>
            <p className="mt-1 text-xs">
              Soumise le {formatDateTime(application.applied_at)}
              {application.reviewed_at && ` · Traitée le ${formatDateTime(application.reviewed_at)}`}
            </p>
          </div>

          {/* Bourse */}
          <div className="card">
            <p className="text-xs text-gray-500">Bourse</p>
            <Link
              to={`/admin/scholarships/${application.scholarship_id}/applications`}
              className="text-lg font-bold hover:text-alkher-600"
            >
              {application.scholarship_title}
            </Link>
            <p className="text-sm text-gray-600">{application.organization}</p>
            <span className="badge bg-alkher-100 text-alkher-700 mt-1">
              {application.scholarship_type}
            </span>
          </div>

          {/* Identité apprenante */}
          <div className="card">
            <p className="mb-2 text-xs text-gray-500">Apprenante</p>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-alkher-100 text-lg font-bold text-alkher-700">
                {application.learner_name?.[0]?.toUpperCase()}
              </div>
              <div>
                <p className="font-bold">{application.learner_name}</p>
                <p className="text-xs text-gray-500">
                  <Mail className="mr-1 inline h-3 w-3" />
                  {application.learner_email}
                </p>
                {application.phone && (
                  <p className="text-xs text-gray-500">
                    <Phone className="mr-1 inline h-3 w-3" />
                    {application.phone}
                  </p>
                )}
                {application.birth_date && (
                  <p className="text-xs text-gray-500">
                    <Calendar className="mr-1 inline h-3 w-3" />
                    Née le {formatDate(application.birth_date)}
                  </p>
                )}
                {application.country && (
                  <p className="text-xs text-gray-500">
                    <MapPin className="mr-1 inline h-3 w-3" />
                    {application.country}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Lettre de motivation */}
          {application.motivation_letter && (
            <div>
              <h3 className="mb-2 flex items-center gap-2 text-sm font-bold">
                <FileText className="h-4 w-4" />Lettre de motivation
              </h3>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <p className="whitespace-pre-line text-sm text-gray-800">
                  {application.motivation_letter}
                </p>
              </div>
            </div>
          )}

          {/* CV */}
          {application.cv_url && (
            <div>
              <h3 className="mb-2 flex items-center gap-2 text-sm font-bold">
                <FileText className="h-4 w-4" />CV
              </h3>
              <a
                href={`${BASE}${application.cv_url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg border border-gray-200 p-3 transition hover:bg-gray-50"
              >
                <FileText className="h-5 w-5 text-red-500" />
                <span className="flex-1 text-sm">Télécharger le CV</span>
                <Download className="h-4 w-4 text-gray-400" />
              </a>
            </div>
          )}

          {/* Documents additionnels */}
          {extraDocs.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-bold">Documents additionnels</h3>
              <div className="space-y-2">
                {extraDocs.map((d, i) => (
                  <a
                    key={i}
                    href={`${BASE}${d.url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-lg border border-gray-200 p-2 text-sm hover:bg-gray-50"
                  >
                    <FileText className="h-4 w-4 text-gray-500" />
                    <span className="flex-1">{d.name || `Document ${i + 1}`}</span>
                    <Download className="h-3 w-3 text-gray-400" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Note de review existante */}
          {application.status !== 'pending' && application.review_note && (
            <div>
              <h3 className="mb-2 text-sm font-bold">Note de review</h3>
              <div className="rounded-lg bg-gray-50 p-3 text-sm">{application.review_note}</div>
            </div>
          )}

          {/* Zone action */}
          {application.status === 'pending' && (
            <div>
              <label className="mb-1 block text-sm font-medium">Note (optionnelle)</label>
              <textarea
                className="input-field min-h-[80px] text-sm"
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                placeholder="Motif de la décision..."
              />
            </div>
          )}
        </div>

        {application.status === 'pending' && (
          <footer className="flex gap-2 border-t p-4">
            <button
              onClick={() => handleReview('rejected')}
              disabled={processing}
              className="btn-danger flex-1"
            >
              <XCircle className="mr-2 h-4 w-4" />Refuser
            </button>
            <button
              onClick={() => handleReview('accepted')}
              disabled={processing}
              className="btn-primary flex-1"
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />Accepter
            </button>
          </footer>
        )}

        {application.status !== 'pending' && (
          <footer className="border-t p-4">
            <button onClick={onClose} className="btn-secondary w-full">Fermer</button>
          </footer>
        )}
      </aside>
    </div>
  );
}
