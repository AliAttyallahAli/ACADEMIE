import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen, Clock, Calendar, Users, ChevronRight, CheckCircle2, ShoppingCart,
} from 'lucide-react';
import api from '../../api/axios';
import { ENDPOINTS } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import Spinner from '../../components/Spinner';
import ProgressBar from '../../components/ProgressBar';
import Toast from '../../components/Toast';
import EmptyState from '../../components/EmptyState';
import { formatDate } from '../../utils/formatDate';

const BASE = import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000';

export default function Modules() {
  const [tab, setTab] = useState('catalogue'); // catalogue | my
  const [catalogue, setCatalogue] = useState([]);
  const [myModules, setMyModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [cat, my] = await Promise.all([
          api.get(ENDPOINTS.modules),
          api.get(ENDPOINTS.myEnrollments),
        ]);
        setCatalogue(cat.data.items);
        setMyModules(my.data.items);
      } catch (err) {
        setToast({ type: 'error', message: 'Erreur de chargement' });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const enrolledIds = new Set(myModules.map((m) => m.module_id));

  async function enrollModule(moduleId) {
    if (!confirm('Confirmer votre inscription et procéder au paiement ?')) return;
    setEnrolling(true);
    try {
      const { data } = await api.post(ENDPOINTS.enroll, {
        module_ids: [moduleId],
        start_date: new Date().toISOString().split('T')[0],
      });

      // En développement : simuler le paiement
      if (data.payment?.simulated && data.enrollments?.length) {
        await api.post(ENDPOINTS.alkherpaySimulate, {
          enrollment_ids: data.enrollments.map((e) => e.id),
        });
      }

      setToast({
        type: 'success',
        message: 'Inscription validée ! Retrouvez vos séances dans "Mes modules".',
      });

      // Recharger
      const my = await api.get(ENDPOINTS.myEnrollments);
      setMyModules(my.data.items);
      setTab('my');
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.error || 'Erreur' });
    } finally {
      setEnrolling(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />

      <h1 className="text-xl font-bold">Modules</h1>

      {/* Tabs */}
      <div className="flex rounded-lg bg-gray-100 p-1">
        <button
          onClick={() => setTab('catalogue')}
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium ${
            tab === 'catalogue' ? 'bg-white text-alkher-700 shadow-sm' : 'text-gray-600'
          }`}
        >
          Catalogue
        </button>
        <button
          onClick={() => setTab('my')}
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium ${
            tab === 'my' ? 'bg-white text-alkher-700 shadow-sm' : 'text-gray-600'
          }`}
        >
          Mes modules ({myModules.length})
        </button>
      </div>

      {/* Contenu */}
      {tab === 'catalogue' ? (
        catalogue.length === 0 ? (
          <div className="card">
            <EmptyState icon={BookOpen} title="Aucun module disponible" />
          </div>
        ) : (
          <div className="space-y-3">
            {catalogue.map((m) => {
              const enrolled = enrolledIds.has(m.id);
              return (
                <div key={m.id} className="card">
                  {m.cover_image_url && (
                    <img
                      src={`${BASE}${m.cover_image_url}`}
                      alt=""
                      className="mb-3 h-32 w-full rounded-lg object-cover"
                    />
                  )}
                  <h3 className="mb-1 font-bold">{m.title}</h3>
                  <p className="mb-3 line-clamp-2 text-sm text-gray-600">
                    {m.description}
                  </p>

                  <div className="mb-3 flex flex-wrap gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {m.duration_weeks} sem.
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {m.frequency_per_week}x/sem
                    </span>
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-3 w-3" />
                      {m.total_sessions} séances
                    </span>
                  </div>

                  {enrolled ? (
                    <button disabled className="btn-secondary w-full">
                      <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
                      Déjà inscrite
                    </button>
                  ) : (
                    <button
                      onClick={() => enrollModule(m.id)}
                      disabled={enrolling}
                      className="btn-primary w-full"
                    >
                      {enrolling ? (
                        <Spinner size="sm" className="mr-2 !border-white" />
                      ) : (
                        <ShoppingCart className="mr-2 h-4 w-4" />
                      )}
                      S'inscrire
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )
      ) : myModules.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={BookOpen}
            title="Aucun module suivi"
            description="Inscrivez-vous depuis le catalogue."
            action={
              <button onClick={() => setTab('catalogue')} className="btn-primary">
                Voir le catalogue
              </button>
            }
          />
        </div>
      ) : (
        <div className="space-y-3">
          {myModules.map((m) => (
            <div key={m.module_id} className="card">
              <div className="mb-2 flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold">{m.module_title}</h3>
                  <p className="text-xs text-gray-500">
                    Depuis le {formatDate(m.start_date)}
                  </p>
                </div>
                <span
                  className={`badge ${
                    m.status === 'completed'
                      ? 'bg-green-100 text-green-700'
                      : m.payment_status === 'paid'
                      ? 'bg-alkher-100 text-alkher-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {m.status === 'completed'
                    ? 'Terminé'
                    : m.payment_status === 'paid'
                    ? 'En cours'
                    : 'En attente'}
                </span>
              </div>

              {m.payment_status === 'paid' && (
                <>
                  <ProgressBar value={0} color="alkher" />
                  <Link
                    to="/dashboard"
                    className="mt-3 inline-flex items-center gap-1 text-sm text-alkher-600 hover:underline"
                  >
                    Voir la progression <ChevronRight className="h-3 w-3" />
                  </Link>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}