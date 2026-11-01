import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BookOpen, Award, Trophy, TrendingUp, ArrowRight, Calendar,
  Lock, Unlock, Briefcase, Target, Sparkles,
} from 'lucide-react';
import api from '../../api/axios';
import { ENDPOINTS } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import ProgressBar from '../../components/ProgressBar';
import StatCard from '../../components/StatCard';
import EmptyState from '../../components/EmptyState';
import Spinner from '../../components/Spinner';
import { formatDate } from '../../utils/formatDate';

export default function Dashboard() {
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const [state, setState] = useState({ loading: true, data: null, error: null });

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(ENDPOINTS.dashboard);
        setState({ loading: false, data, error: null });
      } catch (err) {
        setState({
          loading: false,
          data: null,
          error: err.response?.data?.error || 'Erreur de chargement',
        });
      }
    })();
  }, []);

  if (state.loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="card mx-auto max-w-lg text-center">
        <p className="text-red-600">{state.error}</p>
      </div>
    );
  }

  const { data } = state;
  const { learner, global_progress: gp, modules, next_session, certificates, stats } = data;
  const firstName = learner.full_name?.split(' ')[0] || 'vous';

  const initials = learner.full_name
    ?.split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'A';

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-alkher-600 to-alkher-800 p-6 text-white">
        <div className="flex items-start gap-4">
          {learner.profile_photo_url ? (
            <img
              src={`${import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000'}${learner.profile_photo_url}`}
              alt=""
              className="h-16 w-16 rounded-full border-2 border-white/30 object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 text-xl font-bold">
              {initials}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm text-white/80">Bonjour 👋</p>
            <h1 className="text-xl font-bold">{firstName}</h1>
            {unreadCount > 0 && (
              <Link
                to="/notifications"
                className="mt-1 inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-1 text-xs"
              >
                <Sparkles className="h-3 w-3" />
                {unreadCount} nouvelle{unreadCount > 1 ? 's' : ''} notification{unreadCount > 1 ? 's' : ''}
              </Link>
            )}
          </div>
        </div>

        {/* Progression globale */}
        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span>Progression globale</span>
            <span className="font-bold">{gp.progress_percent}%</span>
          </div>
          <div className="overflow-hidden rounded-full bg-white/20">
            <div
              className="h-2 rounded-full bg-white transition-all duration-500"
              style={{ width: `${gp.progress_percent}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-white/80">
            {gp.completed_sessions} / {gp.total_sessions} séances validées ·{' '}
            {gp.modules_completed} / {gp.modules_count} modules terminés
          </p>
        </div>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Modules actifs" value={gp.modules_count} icon={BookOpen} />
        <StatCard label="Quiz réussis" value={stats.quizzes_passed} icon={Target} color="green" />
        <StatCard label="Certificats" value={stats.certificates_count} icon={Award} color="gold" />
        <StatCard label="Candidatures" value={stats.scholarship_applications} icon={Briefcase} color="alkher" />
      </div>

      {/* Prochaine séance */}
      {next_session ? (
        <div className="card">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-bold">
              <Calendar className="h-5 w-5 text-alkher-600" />
              Prochaine séance
            </h2>
            <span
              className={`badge ${
                next_session.status === 'available'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {next_session.status === 'available' ? (
                <><Unlock className="mr-1 h-3 w-3" /> Disponible</>
              ) : (
                <><Lock className="mr-1 h-3 w-3" /> Verrouillée</>
              )}
            </span>
          </div>

          <p className="text-lg font-semibold">{next_session.title}</p>
          <p className="text-sm text-gray-500">
            {next_session.module_title} · Séance {next_session.session_number}
          </p>
          <p className="mt-2 text-xs text-gray-500">
            Prévue le {formatDate(next_session.scheduled_date)}
          </p>

          <Link
            to={`/sessions/${next_session.id}`}
            className={`mt-4 inline-flex items-center gap-2 ${
              next_session.status === 'available' ? 'btn-primary' : 'btn-secondary'
            }`}
          >
            {next_session.status === 'available' ? 'Commencer' : 'Voir détails'}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : modules.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={BookOpen}
            title="Vous n'êtes inscrite à aucun module"
            description="Découvrez notre catalogue et inscrivez-vous à votre premier module."
            action={
              <Link to="/modules" className="btn-primary">
                Voir les modules
              </Link>
            }
          />
        </div>
      ) : (
        <div className="card">
          <EmptyState
            icon={Trophy}
            title="Toutes vos séances sont complétées !"
            description="Consultez votre page d'orientation pour valoriser votre parcours."
            action={
              <Link to="/orientation" className="btn-primary">
                Page d'orientation
              </Link>
            }
          />
        </div>
      )}

      {/* Modules en cours */}
      {modules.length > 0 && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-bold">Mes modules</h2>
            <Link to="/modules" className="text-sm text-alkher-600 hover:underline">
              Tout voir
            </Link>
          </div>
          <div className="space-y-3">
            {modules.slice(0, 3).map((m) => (
              <div key={m.module_id} className="card">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{m.title}</p>
                    <p className="text-xs text-gray-500">
                      {m.completed_sessions} / {m.total_sessions} séances
                    </p>
                  </div>
                  <span
                    className={`badge flex-shrink-0 ${
                      m.status === 'completed'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-alkher-100 text-alkher-700'
                    }`}
                  >
                    {m.status === 'completed' ? 'Terminé' : 'En cours'}
                  </span>
                </div>
                <ProgressBar value={m.progress_percent} color={m.status === 'completed' ? 'green' : 'alkher'} />
                <p className="mt-1 text-right text-xs text-gray-500">{m.progress_percent}%</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Certificats */}
      {certificates.length > 0 && (
        <div>
          <h2 className="mb-3 font-bold">Mes certificats</h2>
          <div className="space-y-2">
            {certificates.map((c) => (
              <Link
                key={c.certificate_uuid}
                to={`/certificate/${c.certificate_uuid}`}
                className="card flex items-center gap-3 transition hover:border-alkher-300"
              >
                <div className="rounded-lg bg-yellow-100 p-2">
                  <Award className="h-5 w-5 text-yellow-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Certificat ALKHER ACADEMY</p>
                  <p className="text-xs text-gray-500">Émis le {formatDate(c.issued_at)}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-400" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}