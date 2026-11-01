import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Briefcase, Users, CheckCircle2, XCircle, Clock,
  Search, Filter, FileText, Download, X, User, Mail, Calendar,
  MapPin, Phone, AlertCircle, Send,
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

export default function ScholarshipApplications() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [state, setState] = useState({
    loading: true,
    scholarship: null,
    items: [],
    stats: null,
  });
  const [toast, setToast] = useState(null);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);

  async function load() {
    setState((s) => ({ ...s, loading: true }));
    try {
      const { data } = await api.get(ENDPOINTS.admin.scholarshipApplications(id));
      setState({
        loading: false,
        scholarship: data.scholarship,
        items: data.items || [],
        stats: data.stats,
      });
    } catch {
      setState({ loading: false, scholarship: null, items: [], stats: null });
      setToast({ type: 'error', message: 'Erreur de chargement' });
    }
  }

  useEffect(() => { load(); }, [id]);

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
        a.learner_email?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  if (state.loading) return <div className="flex min-h-[60vh] items-center justify-center"><Spinner size="lg" /></div>;

  if (!state.scholarship) return <div className="card"><p className="text-red-600">Bourse introuvable</p></div>;

  return (
    <div className="space-y-6">
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />

      <button onClick={() => navigate('/admin/scholarships')} className="inline-flex items-center gap-1 text-sm text-alkher-600 hover:underline">
        <ArrowLeft className="h-4 w-4" />Retour aux bourses
      </button>

      {/* Header bourse */}
      <div className="card">
        <div className="flex items-start gap-4">
          {state.scholarship.cover_image_url ? (
            <img
              src={`${BASE}${state.scholarship.cover_image_url}`}
              alt=""
              className="h-24 w-40 flex-shrink-0 rounded-lg object-cover"
            />
          ) : (
            <div className="flex h-24 w-40 flex-shrink-0 items-center justify-center rounded-lg bg-alkher-50 text-alkher-600">
              <Briefcase className="h-10 w-10" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <span className={`badge ${state.scholarship.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
              {state.scholarship.status}
            </span>
            <h1 className="mt-1 text-xl font-bold">{state.scholarship.title}</h1>
            <p className="text-sm text-gray-600">{state.scholarship.organization}</p>
            {state.scholarship.closing_date && (
              <p className="mt-1 text-xs text-gray-500">
                <Calendar className="mr-1 inline h-3 w-3" />
                Clôture : {formatDate(state.scholarship.closing_date)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Statistiques */}
      {state.stats && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="card p-4">
            <p className="text-xs text-gray-500">Total candidatures</p>
            <p className="text-2xl font-bold">{state.stats.total}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-gray-500">En attente</p>
            <p className="text-2xl font-bold text-yellow-600">{state.stats.pending}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-gray-500">Acceptées</p>
            <p className="text-2xl font-bold text-green-600">{state.stats.accepted}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-gray-500">Refusées</p>
            <p className="text-2xl font-bold text-red-600">{state.stats.rejected}</p>
          </div>
        </div>
      )}

      {/* Filtres */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par nom ou email..."
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

      {/* Liste des candidatures */}
      {filtered.length === 0 ? (
        <div className="card text-center py-12">
          <Users className="mx-auto mb-3 h-10 w-10 text-gray-400" />
          <p className="text-gray-500">
            {state.items.length === 0 ? 'Aucune candidature' : 'Aucun résultat pour ce filtre'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((a) => {
            const cfg = STATUS[a.status] || STATUS.pending;
            const Icon = cfg.icon;
            return (
              <div key={a.id} className="card">
                <div className="flex items-start gap-3">
                  <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${cfg.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">{a.learner_name}</p>
                        <p className="text-xs text-gray-500">{a.learner_email}</p>
                        <p className="mt-0.5 text-xs text-gray-400">
                          Soumise le {formatDateTime(a.applied_at)}
                        </p>
                      </div>
                      <span className={`badge ${cfg.color}`}>{cfg.label}</span>
                    </div>

                    {a.motivation_letter && (
                      <p className="mt-2 line-clamp-2 text-xs text-gray-600 bg-gray-50 p-2 rounded">
                        {a.motivation_letter}
                      </p>
                    )}

                    {a.review_note && a.status !== 'pending' && (
                      <p className="mt-2 text-xs text-gray-600">
                        <strong>Note :</strong> {a.review_note}
                      </p>
                    )}

                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        onClick={() => setSelected(a)}
                        className="inline-flex items-center gap-1 rounded-lg bg-alkher-50 px-3 py-1.5 text-xs font-medium text-alkher-700 hover:bg-alkher-100"
                      >
                        <FileText className="h-3 w-3" />Voir le dossier
                      </button>

                      {a.status === 'pending' && (
                        <>
                          <button
                            onClick={() => review(a.id, 'accepted', '')}
                            className="inline-flex items-center gap-1 rounded-lg bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100"
                          >
                            <CheckCircle2 className="h-3 w-3" />Accepter
                          </button>
                          <button
                            onClick={() => {
                              const note = prompt('Motif du refus (optionnel) :');
                              if (note !== null) review(a.id, 'rejected', note);
                            }}
                            className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100"
                          >
                            <XCircle className="h-3 w-3" />Refuser
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Drawer détail */}
      {selected && (
        <ApplicationDetail
          application={selected}
          onClose={() => setSelected(null)}
          onReview={review}
        />
      )}
    </div>
  );
}

function ApplicationDetail({ application, onClose, onReview }) {
  const [reviewNote, setReviewNote] = useState(application.review_note || '');
  const cfg = STATUS[application.status] || STATUS.pending;
  const Icon = cfg.icon;

  let extraDocs = [];
  try {
    extraDocs = application.extra_docs_json ? JSON.parse(application.extra_docs_json) : [];
  } catch {}

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
          {/* Identité */}
          <div className="card">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-alkher-100 text-xl font-bold text-alkher-700">
                {application.learner_name?.[0]?.toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-lg">{application.learner_name}</p>
                <p className="text-sm text-gray-500">
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

          {/* Statut */}
          <div className={`card ${cfg.color}`}>
            <div className="flex items-center gap-2">
              <Icon className="h-5 w-5" />
              <p className="font-medium">{cfg.label}</p>
            </div>
            <p className="mt-1 text-xs">
              Soumise le {formatDateTime(application.applied_at)}
              {application.reviewed_at && ` · Traitée le ${formatDateTime(application.reviewed_at)}`}
            </p>
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

          {/* Note de review */}
          {application.status !== 'pending' && application.review_note && (
            <div>
              <h3 className="mb-2 text-sm font-bold">Note de review</h3>
              <div className="rounded-lg bg-gray-50 p-3 text-sm">{application.review_note}</div>
            </div>
          )}

          {/* Zone d'action */}
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
              onClick={() => onReview(application.id, 'rejected', reviewNote)}
              className="btn-danger flex-1"
            >
              <XCircle className="mr-2 h-4 w-4" />Refuser
            </button>
            <button
              onClick={() => onReview(application.id, 'accepted', reviewNote)}
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
