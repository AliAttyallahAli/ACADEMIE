import { useEffect, useState } from 'react';
import {
  Users, BookOpen, FileCheck, Briefcase, TrendingUp, Award,
  GraduationCap, Clock, CheckCircle2, XCircle,
} from 'lucide-react';
import api from '../../api/axios';
import { ENDPOINTS } from '../../api/endpoints';
import StatCard from '../../components/StatCard';
import Spinner from '../../components/Spinner';
import { formatDate } from '../../utils/formatDate';

export default function AdminDashboard() {
  const [state, setState] = useState({ loading: true, data: null, error: null });

  useEffect(() => {
    (async () => {
      try {
        // Reconstruire un résumé à partir des endpoints existants
        // (le backend n'a pas encore /admin/stats, on agrège côté client)
        const [modules, enrollmentsPending, scholarships] = await Promise.all([
          api.get(ENDPOINTS.admin.modules, { params: { limit: 100 } }).catch(() => ({ data: { items: [] } })),
          api.get(ENDPOINTS.admin.enrollmentsPending).catch(() => ({ data: { items: [], pagination: { total: 0 } } })),
          api.get(ENDPOINTS.admin.scholarships, { params: { limit: 100 } }).catch(() => ({ data: { items: [] } })),
        ]);

        const allEnrollments = await api
          .get(ENDPOINTS.admin.enrollments, { params: { limit: 200 } })
          .catch(() => ({ data: { items: [] } }));

        const enrollments = allEnrollments.data.items || [];
        const completed = enrollments.filter((e) => e.status === 'completed').length;
        const paid = enrollments.filter((e) => e.payment_status === 'paid').length;
        const pending = enrollments.filter((e) => e.payment_status === 'pending').length;
        const rejected = enrollments.filter((e) => e.payment_status === 'rejected').length;

        const publishedScholarships = (scholarships.data.items || []).filter((s) => s.status === 'published').length;

        setState({
          loading: false,
          error: null,
          data: {
            modules_count: modules.data.items?.length || 0,
            enrollments: { total: enrollments.length, paid, pending, rejected, completed },
            scholarships: { total: scholarships.data.items?.length || 0, published: publishedScholarships },
            recent_enrollments: enrollments.slice(0, 5),
            recent_pending: enrollmentsPending.data.items?.slice(0, 5) || [],
          },
        });
      } catch (err) {
        setState({ loading: false, error: 'Erreur de chargement', data: null });
      }
    })();
  }, []);

  if (state.loading) {
    return <div className="flex min-h-[60vh] items-center justify-center"><Spinner size="lg" /></div>;
  }

  if (state.error) {
    return <div className="card text-center text-red-600">{state.error}</div>;
  }

  const { data } = state;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tableau de bord</h1>
        <p className="text-sm text-gray-500">Vue d'ensemble de la plateforme ALKHER ACADEMY</p>
      </div>

      {/* KPI principaux */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Modules"
          value={data.modules_count}
          icon={BookOpen}
          color="alkher"
        />
        <StatCard
          label="Inscriptions payées"
          value={data.enrollments.paid}
          icon={CheckCircle2}
          color="green"
          subtitle={`${data.enrollments.total} au total`}
        />
        <StatCard
          label="En attente validation"
          value={data.enrollments.pending}
          icon={Clock}
          color="gold"
        />
        <StatCard
          label="Bourses publiées"
          value={data.scholarships.published}
          icon={Briefcase}
          color="alkher"
        />
      </div>

      {/* Deux colonnes */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Répartition inscriptions */}
        <div className="card">
          <h2 className="mb-4 flex items-center gap-2 font-bold">
            <FileCheck className="h-5 w-5 text-alkher-600" />
            Inscriptions
          </h2>
          <div className="space-y-3">
            <StatRow
              label="Payées"
              value={data.enrollments.paid}
              total={data.enrollments.total}
              color="green"
            />
            <StatRow
              label="En attente"
              value={data.enrollments.pending}
              total={data.enrollments.total}
              color="yellow"
            />
            <StatRow
              label="Rejetées"
              value={data.enrollments.rejected}
              total={data.enrollments.total}
              color="red"
            />
            <StatRow
              label="Modules complétés"
              value={data.enrollments.completed}
              total={data.enrollments.total}
              color="alkher"
            />
          </div>
        </div>

        {/* Inscriptions en attente */}
        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-bold">
              <Clock className="h-5 w-5 text-yellow-600" />
              À valider en priorité
            </h2>
            <a href="/admin/enrollments" className="text-sm text-alkher-600 hover:underline">
              Voir tout
            </a>
          </div>

          {data.recent_pending.length === 0 ? (
            <p className="text-sm text-gray-500">Aucune inscription en attente.</p>
          ) : (
            <div className="space-y-2">
              {data.recent_pending.map((e) => (
                <div
                  key={e.id}
                  className="flex items-center gap-3 rounded-lg border border-gray-200 p-3"
                >
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-alkher-100 text-sm font-bold text-alkher-700">
                    {e.learner_name?.[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{e.learner_name}</p>
                    <p className="truncate text-xs text-gray-500">{e.module_title}</p>
                  </div>
                  <span className="text-xs text-gray-400">
                    {formatDate(e.enrolled_at)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Inscriptions récentes */}
      <div className="card">
        <h2 className="mb-4 flex items-center gap-2 font-bold">
          <TrendingUp className="h-5 w-5 text-alkher-600" />
          Inscriptions récentes
        </h2>
        <div className="space-y-2">
          {data.recent_enrollments.length === 0 ? (
            <p className="text-sm text-gray-500">Aucune inscription.</p>
          ) : (
            data.recent_enrollments.map((e) => (
              <div
                key={e.id}
                className="flex items-center gap-3 rounded-lg border border-gray-200 p-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium">{e.learner_name}</p>
                  <p className="truncate text-xs text-gray-500">{e.module_title}</p>
                </div>
                <StatusBadge status={e.payment_status} />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function StatRow({ label, value, total, color }) {
  const percent = total > 0 ? Math.round((value / total) * 100) : 0;
  const colors = {
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
    alkher: 'bg-alkher-500',
  };
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="text-gray-700">{label}</span>
        <span className="font-medium">{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-gray-200">
        <div className={`h-2 rounded-full ${colors[color]}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const config = {
    paid: { label: 'Payée', color: 'bg-green-100 text-green-700' },
    pending: { label: 'En attente', color: 'bg-yellow-100 text-yellow-700' },
    rejected: { label: 'Rejetée', color: 'bg-red-100 text-red-700' },
  };
  const c = config[status] || config.pending;
  return <span className={`badge ${c.color}`}>{c.label}</span>;
}