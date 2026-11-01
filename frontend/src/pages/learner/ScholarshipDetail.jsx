import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Building2, Calendar, DollarSign, FileText,
  CheckCircle2, Upload, XCircle, AlertCircle,
} from 'lucide-react';
import api from '../../api/axios';
import { ENDPOINTS } from '../../api/endpoints';
import Spinner from '../../components/Spinner';
import Toast from '../../components/Toast';
import FormField from '../../components/FormField';
import { formatDate } from '../../utils/formatDate';

export default function ScholarshipDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [state, setState] = useState({ loading: true, data: null, error: null });
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [form, setForm] = useState({ motivation_letter: '', cv: null });

  async function load() {
    try {
      const { data } = await api.get(ENDPOINTS.scholarship(id));
      setState({ loading: false, data, error: null });
    } catch (err) {
      setState({
        loading: false,
        data: null,
        error: err.response?.data?.error || 'Erreur de chargement',
      });
    }
  }

  useEffect(() => { load(); }, [id]);

  async function submit(e) {
    e.preventDefault();
    if (!form.cv) {
      setToast({ type: 'error', message: 'CV requis' });
      return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('motivation_letter', form.motivation_letter);
      fd.append('cv', form.cv);
      await api.post(ENDPOINTS.scholarshipApply(id), fd);
      setToast({ type: 'success', message: 'Candidature envoyée !' });
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
  if (state.error) {
    return (
      <div className="card">
        <p className="text-red-600">{state.error}</p>
        <button onClick={() => navigate(-1)} className="btn-secondary mt-3">Retour</button>
      </div>
    );
  }

  const { scholarship: s, my_application: app } = state.data;
  const closed = s.status === 'closed' || (s.closing_date && s.closing_date < new Date().toISOString().split('T')[0]);

  return (
    <div className="space-y-4">
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />

      <Link to="/scholarships" className="inline-flex items-center gap-1 text-sm text-alkher-600 hover:underline">
        <ArrowLeft className="h-4 w-4" /> Retour
      </Link>

      {/* Header */}
      <div className="card">
        <div className="mb-3 flex items-start justify-between gap-2">
          <div>
            <span className="badge bg-alkher-100 text-alkher-700">{s.type}</span>
            <h1 className="mt-2 text-xl font-bold">{s.title}</h1>
            {s.organization && (
              <p className="mt-1 flex items-center gap-1 text-sm text-gray-600">
                <Building2 className="h-4 w-4" /> {s.organization}
              </p>
            )}
          </div>
          <span
            className={`badge ${
              closed ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
            }`}
          >
            {closed ? 'Clôturée' : 'Ouverte'}
          </span>
        </div>

        <div className="grid gap-3 border-t pt-3 text-sm md:grid-cols-2">
          {s.amount && (
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-gray-500" />
              <span><strong>{s.amount}</strong></span>
            </div>
          )}
          {s.opening_date && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span>Ouverture : {formatDate(s.opening_date)}</span>
            </div>
          )}
          {s.closing_date && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span><strong>Clôture : {formatDate(s.closing_date)}</strong></span>
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      {s.description && (
        <div className="card">
          <h2 className="mb-2 font-bold">Description</h2>
          <p className="whitespace-pre-line text-sm text-gray-700">{s.description}</p>
        </div>
      )}

      {/* Éligibilité */}
      {s.eligibility && (
        <div className="card">
          <h2 className="mb-2 font-bold">Critères d'éligibilité</h2>
          <p className="whitespace-pre-line text-sm text-gray-700">{s.eligibility}</p>
        </div>
      )}

      {/* Documents requis */}
      {s.required_documents?.length > 0 && (
        <div className="card">
          <h2 className="mb-2 flex items-center gap-2 font-bold">
            <FileText className="h-4 w-4" /> Documents requis
          </h2>
          <ul className="space-y-1 text-sm">
            {s.required_documents.map((d, i) => (
              <li key={i} className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" /> {d.name}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Candidature existante */}
      {app ? (
        <div className="card">
          <div className="flex items-start gap-3">
            {app.status === 'accepted' ? (
              <CheckCircle2 className="h-6 w-6 flex-shrink-0 text-green-600" />
            ) : app.status === 'rejected' ? (
              <XCircle className="h-6 w-6 flex-shrink-0 text-red-600" />
            ) : (
              <AlertCircle className="h-6 w-6 flex-shrink-0 text-yellow-600" />
            )}
            <div>
              <p className="font-bold">
                {app.status === 'pending' && 'Candidature en cours d\'examen'}
                {app.status === 'accepted' && 'Candidature acceptée 🎉'}
                {app.status === 'rejected' && 'Candidature refusée'}
              </p>
              <p className="mt-1 text-sm text-gray-600">
                Soumise le {formatDate(app.applied_at)}
              </p>
              {app.review_note && (
                <p className="mt-2 rounded bg-gray-50 p-2 text-sm text-gray-700">
                  <strong>Note :</strong> {app.review_note}
                </p>
              )}
            </div>
          </div>
        </div>
      ) : closed ? (
        <div className="card text-center">
          <XCircle className="mx-auto mb-2 h-8 w-8 text-red-500" />
          <p className="font-medium">Les candidatures sont fermées</p>
        </div>
      ) : (
        <form onSubmit={submit} className="card">
          <h2 className="mb-4 font-bold">Postuler</h2>

          <FormField
            label="Lettre de motivation"
            required
            id="motivation_letter"
            hint="50 à 2000 caractères. Expliquez pourquoi vous êtes motivée."
          >
            <textarea
              id="motivation_letter"
              className="input-field min-h-[120px]"
              minLength={50}
              maxLength={2000}
              required
              value={form.motivation_letter}
              onChange={(e) => setForm({ ...form, motivation_letter: e.target.value })}
              placeholder="Je souhaite obtenir cette bourse parce que..."
            />
          </FormField>

          <FormField label="CV (PDF, DOC, DOCX)" required id="cv">
            <input
              id="cv"
              type="file"
              accept=".pdf,.doc,.docx"
              required
              onChange={(e) => setForm({ ...form, cv: e.target.files[0] })}
              className="block w-full text-sm text-gray-500 file:mr-3 file:rounded-lg file:border-0 file:bg-alkher-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-alkher-700 hover:file:bg-alkher-100"
            />
          </FormField>

          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? <Spinner size="sm" className="mr-2 !border-white" /> : <Upload className="mr-2 h-4 w-4" />}
            Envoyer ma candidature
          </button>
        </form>
      )}
    </div>
  );
}