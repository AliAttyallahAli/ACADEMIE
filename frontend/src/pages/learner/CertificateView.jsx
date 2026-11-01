import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Award, Download, ExternalLink, CheckCircle2, BookOpen,
  Shield, QrCode,
} from 'lucide-react';
import api from '../../api/axios';
import { ENDPOINTS } from '../../api/endpoints';
import Spinner from '../../components/Spinner';
import { formatDate } from '../../utils/formatDate';

export default function CertificateView() {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const [state, setState] = useState({ loading: true, data: null, error: null });
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`${ENDPOINTS.certificates}/${uuid}`);
        setState({ loading: false, data, error: null });
      } catch (err) {
        setState({
          loading: false,
          data: null,
          error: err.response?.data?.error || 'Certificat introuvable',
        });
      }
    })();
  }, [uuid]);

  async function download() {
    setDownloading(true);
    try {
      const response = await api.get(
        `${ENDPOINTS.certificates}/${uuid}/download`,
        { responseType: 'blob' }
      );
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ALKHER-Certificat-${uuid}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Erreur de téléchargement');
    } finally {
      setDownloading(false);
    }
  }

  if (state.loading) {
    return <div className="flex min-h-[60vh] items-center justify-center"><Spinner size="lg" /></div>;
  }

  if (state.error) {
    return (
      <div className="card text-center">
        <p className="text-red-600">{state.error}</p>
        <Link to="/dashboard" className="btn-secondary mt-3 inline-flex">Retour</Link>
      </div>
    );
  }

  const { data } = state;
  const snapshot = data.modules_snapshot || {};
  const verifyUrl = `${window.location.origin}/verify/${data.certificate_uuid}`;

  return (
    <div className="space-y-4">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1 text-sm text-alkher-600">
        <ArrowLeft className="h-4 w-4" /> Retour
      </button>

      {/* Carte certificat visuelle */}
      <div className="relative overflow-hidden rounded-2xl border-4 border-double border-gold-500 bg-gradient-to-br from-yellow-50 via-white to-yellow-50 p-6 shadow-xl">
        <div className="text-center">
          <div className="mx-auto mb-3 w-fit rounded-full bg-gold-100 p-3">
            <Award className="h-10 w-10 text-gold-600" />
          </div>
          <p className="text-xs font-medium uppercase tracking-widest text-gold-700">
            ALKHER ACADEMY
          </p>
          <h1 className="mt-2 text-lg font-bold uppercase tracking-wide text-gray-900">
            Attestation de fin de formation
          </h1>

          <p className="mt-6 text-xs text-gray-500">Décernée à</p>
          <p className="mt-1 text-2xl font-bold text-alkher-900">
            {snapshot.learner?.full_name}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Née le {formatDate(snapshot.learner?.birth_date)}
          </p>

          <div className="my-6 border-t border-dashed border-gray-300" />

          <p className="text-xs text-gray-500">Pour avoir suivi avec succès :</p>
          <div className="mt-2 space-y-1">
            {snapshot.modules?.map((m, i) => (
              <div key={i} className="text-xs text-gray-700">
                <strong>{m.title}</strong>
                <br />
                <span className="text-gray-500">
                  du {formatDate(m.start_date)} au {formatDate(m.completed_at)}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-center justify-center gap-2">
            <Shield className="h-4 w-4 text-green-600" />
            <span className="text-xs text-green-700">
              Certificat authentifié par QR code
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="card">
        <h2 className="mb-3 font-bold">Télécharger et partager</h2>
        <div className="space-y-2">
          <button
            onClick={download}
            disabled={downloading}
            className="btn-primary w-full"
          >
            {downloading ? (
              <Spinner size="sm" className="mr-2 !border-white" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Télécharger le PDF
          </button>

          <a
            href={verifyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary flex w-full items-center justify-center"
          >
            <ExternalLink className="mr-2 h-4 w-4" /> Voir la page de vérification
          </a>
        </div>
      </div>

      {/* Détails techniques */}
      <div className="card">
        <h2 className="mb-3 flex items-center gap-2 font-bold">
          <QrCode className="h-4 w-4" /> Détails du certificat
        </h2>
        <dl className="space-y-2 text-sm">
          <div>
            <dt className="text-xs text-gray-500">Numéro unique</dt>
            <dd className="break-all font-mono text-xs text-gray-800">{data.certificate_uuid}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500">Date d'émission</dt>
            <dd className="text-gray-800">{formatDate(data.issued_at)}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500">URL de vérification</dt>
            <dd className="break-all text-xs text-alkher-600">{verifyUrl}</dd>
          </div>
        </dl>
      </div>

      {/* Info vérification */}
      <div className="card bg-green-50 text-center">
        <CheckCircle2 className="mx-auto mb-2 h-6 w-6 text-green-600" />
        <p className="text-sm font-medium text-green-900">Certificat vérifiable en ligne</p>
        <p className="mt-1 text-xs text-green-700">
          Partagez le lien ou le QR code : recruteurs et institutions
          peuvent authentifier votre certificat en temps réel.
        </p>
      </div>
    </div>
  );
}