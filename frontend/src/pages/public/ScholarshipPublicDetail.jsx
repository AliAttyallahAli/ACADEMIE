import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Building2, Calendar, DollarSign, FileText,
  CheckCircle2, XCircle, AlertCircle, UserPlus, LogIn,
  Share2, Star, Clock, MapPin,
} from 'lucide-react';
import api from '../../api/axios';
import { ENDPOINTS } from '../../api/endpoints';
import Spinner from '../../components/Spinner';
import ShareButton from '../../components/ShareButton';
import { formatDate } from '../../utils/formatDate';

const BASE = import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000';

const TYPE_LABELS = {
  formation: { label: 'Formation', color: 'bg-alkher-100 text-alkher-700' },
  recherche: { label: 'Recherche', color: 'bg-purple-100 text-purple-700' },
  stage: { label: 'Stage', color: 'bg-green-100 text-green-700' },
  autre: { label: 'Autre', color: 'bg-gray-100 text-gray-700' },
};

export default function ScholarshipPublicDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [state, setState] = useState({ loading: true, scholarship: null, error: null });

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(ENDPOINTS.public.scholarship(id));
        setState({ loading: false, scholarship: data, error: null });
      } catch (err) {
        const status = err.response?.status;
        setState({
          loading: false,
          scholarship: null,
          error: status === 404
            ? 'Cette bourse n\'existe pas ou n\'est plus disponible'
            : err.response?.data?.error || 'Erreur de chargement',
        });
      }
    })();
  }, [id]);

  if (state.loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Spinner size="lg" />
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md rounded-xl bg-white p-8 text-center shadow-lg">
          <XCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
          <h1 className="mb-2 text-xl font-bold">Bourse introuvable</h1>
          <p className="mb-6 text-sm text-gray-600">{state.error}</p>
          <Link to="/" className="btn-primary">
            <ArrowLeft className="mr-2 h-4 w-4" />Retour à l'accueil
          </Link>
        </div>
      </div>
    );
  }

  const s = state.scholarship;
  const cfg = TYPE_LABELS[s.type] || TYPE_LABELS.autre;
  const shareUrl = `${window.location.origin}/public/scholarships/${s.id}`;
  const closingDate = s.closing_date ? new Date(s.closing_date) : null;
  const now = new Date();
  const daysLeft = closingDate ? Math.ceil((closingDate - now) / (1000 * 60 * 60 * 24)) : null;
  const isClosing = daysLeft !== null && daysLeft <= 7 && daysLeft > 0;
  const isClosed = closingDate && closingDate < now;

  let requiredDocs = [];
  try {
    requiredDocs = s.required_documents_json ? JSON.parse(s.required_documents_json) : [];
  } catch {}

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER */}
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2 text-sm font-medium text-alkher-700 hover:underline">
            <ArrowLeft className="h-4 w-4" />
            Retour à l'accueil
          </Link>
          <Link to="/register" className="btn-primary text-sm">
            <UserPlus className="mr-2 h-4 w-4" />S'inscrire
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        {/* ─── COUVERTURE ─── */}
        {s.cover_image_url && (
          <div className="mb-6 overflow-hidden rounded-2xl">
            <img
              src={`${BASE}${s.cover_image_url}`}
              alt={s.title}
              className="h-64 w-full object-cover md:h-80"
            />
          </div>
        )}

        {/* ─── EN-TÊTE ─── */}
        <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${cfg.color}`}>
                  {cfg.label}
                </span>
                {isClosed ? (
                  <span className="badge bg-red-100 text-red-700">
                    <XCircle className="mr-1 h-3 w-3" />Clôturée
                  </span>
                ) : isClosing ? (
                  <span className="badge bg-orange-100 text-orange-700">
                    <Clock className="mr-1 h-3 w-3" />Clôture dans {daysLeft} jour{daysLeft > 1 ? 's' : ''}
                  </span>
                ) : (
                  <span className="badge bg-green-100 text-green-700">
                    <CheckCircle2 className="mr-1 h-3 w-3" />Ouverte
                  </span>
                )}
              </div>

              <h1 className="mb-2 text-2xl font-bold text-gray-900 md:text-3xl">{s.title}</h1>

              {s.organization && (
                <p className="mb-1 flex items-center gap-1 text-gray-600">
                  <Building2 className="h-4 w-4" />
                  <span>{s.organization}</span>
                </p>
              )}
            </div>

            <ShareButton
              url={shareUrl}
              title={s.title}
              description={s.description}
              variant="full"
            />
          </div>

          {/* Infos clés */}
          <div className="grid gap-3 border-t pt-4 text-sm md:grid-cols-3">
            {s.amount && (
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-green-50 p-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Montant</p>
                  <p className="font-bold">{s.amount}</p>
                </div>
              </div>
            )}

            {s.opening_date && (
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-alkher-50 p-2">
                  <Calendar className="h-4 w-4 text-alkher-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Ouverture</p>
                  <p className="font-medium">{formatDate(s.opening_date)}</p>
                </div>
              </div>
            )}

            {s.closing_date && (
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-red-50 p-2">
                  <Calendar className="h-4 w-4 text-red-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Clôture</p>
                  <p className="font-medium">{formatDate(s.closing_date)}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ─── DESCRIPTION ─── */}
        {s.description && (
          <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="mb-3 flex items-center gap-2 text-lg font-bold">
              <FileText className="h-5 w-5 text-alkher-600" />
              Description
            </h2>
            <p className="whitespace-pre-line text-sm text-gray-700 leading-relaxed">
              {s.description}
            </p>
          </div>
        )}

        {/* ─── ÉLIGIBILITÉ ─── */}
        {s.eligibility && (
          <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="mb-3 flex items-center gap-2 text-lg font-bold">
              <CheckCircle2 className="h-5 w-5 text-alkher-600" />
              Critères d'éligibilité
            </h2>
            <p className="whitespace-pre-line text-sm text-gray-700 leading-relaxed">
              {s.eligibility}
            </p>
          </div>
        )}

        {/* ─── DOCUMENTS REQUIS ─── */}
        {requiredDocs.length > 0 && (
          <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="mb-3 flex items-center gap-2 text-lg font-bold">
              <FileText className="h-5 w-5 text-alkher-600" />
              Documents requis
            </h2>
            <ul className="space-y-2 text-sm">
              {requiredDocs.map((d, i) => (
                <li key={i} className="flex items-center gap-2 rounded-lg bg-gray-50 p-2">
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-green-600" />
                  <span>{d.name || d}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* ─── STATS CANDIDATURES ─── */}
        {s.applications_count !== undefined && (
          <div className="mb-6 rounded-2xl bg-alkher-50 p-4 text-center">
            <p className="text-sm text-alkher-800">
              <Star className="mr-1 inline h-4 w-4" />
              <strong>{s.applications_count}</strong> candidature{s.applications_count > 1 ? 's' : ''} déjà soumise{s.applications_count > 1 ? 's' : ''}
            </p>
          </div>
        )}

        {/* ─── CTA ─── */}
        <div className="rounded-2xl bg-gradient-to-br from-alkher-600 to-alkher-800 p-6 text-white shadow-lg">
          {isClosed ? (
            <>
              <AlertCircle className="mb-2 h-8 w-8" />
              <h2 className="mb-1 text-xl font-bold">Candidatures closes</h2>
              <p className="mb-4 text-sm text-white/80">
                La date de clôture est dépassée. Cette bourse n'accepte plus de candidatures.
              </p>
              <Link to="/" className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-alkher-800 hover:bg-gray-100">
                <ArrowLeft className="h-4 w-4" />Voir d'autres bourses
              </Link>
            </>
          ) : (
            <>
              <h2 className="mb-1 text-xl font-bold">Intéressée par cette bourse ?</h2>
              <p className="mb-4 text-sm text-white/90">
                Créez votre compte gratuitement pour postuler et suivre votre candidature.
              </p>
              <div className="flex flex-wrap gap-2">
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-alkher-800 hover:bg-gray-100"
                >
                  <UserPlus className="h-4 w-4" />Créer mon compte
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium hover:bg-white/20"
                >
                  <LogIn className="h-4 w-4" />Se connecter
                </Link>
              </div>
            </>
          )}
        </div>

        {/* ─── BOUTON RETOUR BAS ─── */}
        <div className="mt-6 text-center">
          <button onClick={() => navigate(-1)} className="text-sm text-alkher-600 hover:underline">
            ← Retour
          </button>
        </div>
      </main>
    </div>
  );
}
