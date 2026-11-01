import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  CheckCircle2, XCircle, GraduationCap, Calendar, User, BookOpen,
} from 'lucide-react';
import api from '../../api/axios';
import { ENDPOINTS } from '../../api/endpoints';
import { formatDate } from '../../utils/formatDate';
import Spinner from '../../components/Spinner';

export default function VerifyPage() {
  const { uuid } = useParams();
  const [state, setState] = useState({ loading: true, data: null, error: null });

  useEffect(() => {
    async function fetchVerify() {
      try {
        const { data } = await api.get(ENDPOINTS.verify(uuid));
        setState({ loading: false, data, error: null });
      } catch (err) {
        setState({
          loading: false,
          data: null,
          error: err.response?.data?.error || 'Erreur lors de la vérification',
        });
      }
    }
    fetchVerify();
  }, [uuid]);

  if (state.loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const { data, error } = state;
  const valid = data?.valid === true;

  return (
    <div className="min-h-screen bg-gradient-to-br from-alkher-50 via-white to-alkher-50 px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <Link to="/" className="mb-6 flex items-center justify-center gap-2">
          <GraduationCap className="h-7 w-7 text-alkher-700" />
          <span className="text-xl font-bold text-alkher-800">ALKHER ACADEMY</span>
        </Link>

        <div className="rounded-2xl bg-white p-8 shadow-xl">
          {/* Statut */}
          <div className={`mb-6 flex flex-col items-center text-center`}>
            {valid ? (
              <div className="mb-3 rounded-full bg-green-100 p-3">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </div>
            ) : (
              <div className="mb-3 rounded-full bg-red-100 p-3">
                <XCircle className="h-10 w-10 text-red-600" />
              </div>
            )}

            <h1 className="text-2xl font-bold text-gray-900">
              {valid ? 'Certificat authentique' : 'Certificat non valide'}
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              {valid
                ? 'Ce certificat a été émis par ALKHER ACADEMY et sa signature est valide.'
                : error || 'Impossible de vérifier ce certificat.'}
            </p>
          </div>

          {valid && (
            <>
              {/* Informations apprenante */}
              <div className="mb-6 space-y-3 rounded-lg bg-gray-50 p-4">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="font-medium text-gray-900">{data.learner?.full_name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">
                    Née le {formatDate(data.learner?.birth_date)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">
                    Certificat émis le {formatDate(data.issued_at)}
                  </span>
                </div>
              </div>

              {/* Modules */}
              <div>
                <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-900">
                  <BookOpen className="h-4 w-4" />
                  Modules complétés
                </h2>
                <div className="space-y-2">
                  {data.modules.map((m, i) => (
                    <div
                      key={i}
                      className="rounded-lg border border-green-200 bg-green-50 p-3"
                    >
                      <p className="font-medium text-green-900">{m.title}</p>
                      <p className="text-xs text-green-700">
                        Du {formatDate(m.start_date)} au {formatDate(m.completed_at)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* UUID */}
              <div className="mt-6 rounded-lg border border-dashed border-gray-300 p-3">
                <p className="text-xs text-gray-500">N° de certificat</p>
                <p className="font-mono text-xs text-gray-800 break-all">
                  {data.certificate_uuid}
                </p>
              </div>
            </>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-gray-500">
          Vérification en ligne sécurisée par signature HMAC
        </p>
      </div>
    </div>
  );
}