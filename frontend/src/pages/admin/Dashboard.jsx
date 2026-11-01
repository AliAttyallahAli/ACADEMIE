import { useEffect, useState } from 'react';
import {
  BookOpen, Users, FileCheck, Award, TrendingUp, Target, BarChart3, AlertCircle,
} from 'lucide-react';
import api from '../../api/axios';
import { ENDPOINTS } from '../../api/endpoints';
import StatCard from '../../components/StatCard';
import Spinner from '../../components/Spinner';
import ProgressDonut from '../../components/charts/ProgressDonut';
import BarChartSimple from '../../components/charts/BarChartSimple';
import LineChartSimple from '../../components/charts/LineChartSimple';

const MONTHS_FR = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

// ✅ Valeurs par défaut : tout tableau est garanti
const DEFAULT_STATS = {
  counters: { modules: 0, learners: 0, enrollments: 0, certificates: 0 },
  enrollmentsByStatus: { paid: 0, pending: 0, rejected: 0 },
  enrollmentsByMonth: [],
  progression: [],
  topModules: [],
  quiz: { total_attempts: 0, passed_attempts: 0, pass_rate: 0, avg_score: 0 },
};

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

export default function AdminDashboard() {
  const [state, setState] = useState({ loading: true, data: null, error: null });

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(ENDPOINTS.admin.stats);
        console.log('[AdminDashboard] stats reçues :', data);
        setState({ loading: false, data, error: null });
      } catch (err) {
        console.error('[AdminDashboard] erreur stats :', err.response?.data || err.message);
        setState({
          loading: false,
          data: null,
          error: err.response?.data?.error || err.message || 'Erreur de chargement',
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
      <div className="card text-center">
        <AlertCircle className="mx-auto mb-3 h-10 w-10 text-red-500" />
        <p className="text-red-600 font-medium">{state.error}</p>
        <p className="mt-1 text-xs text-gray-500">
          Vérifiez que l'endpoint <code>/api/admin/stats</code> est bien monté sur le backend.
        </p>
      </div>
    );
  }

  // ✅ Fusion sécurisée avec les valeurs par défaut
  const data = { ...DEFAULT_STATS, ...(state.data || {}) };
  const counters = data.counters || DEFAULT_STATS.counters;
  const enrollmentsByStatus = data.enrollmentsByStatus || DEFAULT_STATS.enrollmentsByStatus;
  const enrollmentsByMonth = safeArray(data.enrollmentsByMonth);
  const progression = safeArray(data.progression);
  const topModules = safeArray(data.topModules);
  const quiz = data.quiz || DEFAULT_STATS.quiz;

  // Formater les mois
  const monthlyData = enrollmentsByMonth.map((m) => {
    const [, month] = (m.month || '').split('-');
    return {
      name: MONTHS_FR[parseInt(month) - 1] || month || '?',
      value: m.count || 0,
    };
  });

  // Progression globale
  const globalProgress = (() => {
    if (progression.length === 0) return 0;
    const total = progression.reduce((s, p) => s + (p.value || 0), 0);
    if (total === 0) return 0;
    const weighted = progression.reduce((s, p) => {
      const mid = p.name === '100%' ? 100 : parseInt(p.name) + 12.5;
      return s + (p.value || 0) * mid;
    }, 0);
    return Math.round(weighted / total);
  })();

  const totalEnrollments =
    (enrollmentsByStatus.paid || 0) +
    (enrollmentsByStatus.pending || 0) +
    (enrollmentsByStatus.rejected || 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tableau de bord</h1>
        <p className="text-sm text-gray-500">Vue d'ensemble et statistiques</p>
      </div>

      {/* ─── KPI ─── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Modules" value={counters.modules} icon={BookOpen} />
        <StatCard label="Apprenantes" value={counters.learners} icon={Users} color="green" />
        <StatCard label="Inscriptions" value={counters.enrollments} icon={FileCheck} color="gold" />
        <StatCard label="Certificats" value={counters.certificates} icon={Award} color="gold" />
      </div>

      {/* ─── Progression + Évolution ─── */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card flex flex-col items-center">
          <h2 className="mb-2 self-start flex items-center gap-2 font-bold">
            <Target className="h-5 w-5 text-alkher-600" />
            Progression globale
          </h2>
          <p className="mb-2 text-xs text-gray-500">Moyenne toutes apprenantes</p>
          <ProgressDonut percent={globalProgress} size={180} label="complété" />
          <div className="mt-4 grid w-full grid-cols-2 gap-2 text-center text-xs">
            <div className="rounded-lg bg-gray-50 p-2">
              <p className="text-lg font-bold">{progression.reduce((s, p) => s + (p.value || 0), 0)}</p>
              <p className="text-gray-500">apprenantes</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-2">
              <p className="text-lg font-bold text-green-600">
                {progression.find((p) => p.name === '100%')?.value || 0}
              </p>
              <p className="text-gray-500">formées</p>
            </div>
          </div>
        </div>

        <div className="card lg:col-span-2">
          <h2 className="mb-4 flex items-center gap-2 font-bold">
            <TrendingUp className="h-5 w-5 text-alkher-600" />
            Évolution des inscriptions (12 mois)
          </h2>
          {monthlyData.length === 0 ? (
            <div className="flex items-center justify-center py-16 text-sm text-gray-400">
              Aucune inscription dans les 12 derniers mois
            </div>
          ) : (
            <LineChartSimple data={monthlyData} dataKey="value" labelKey="name" height={240} />
          )}
        </div>
      </div>

      {/* ─── Top modules + Répartition ─── */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card">
          <h2 className="mb-4 flex items-center gap-2 font-bold">
            <BarChart3 className="h-5 w-5 text-alkher-600" />
            Top 5 modules (inscriptions)
          </h2>
          {topModules.length === 0 ? (
            <div className="flex items-center justify-center py-16 text-sm text-gray-400">
              Aucun module créé
            </div>
          ) : (
            <BarChartSimple data={topModules} dataKey="value" labelKey="name" color="#7c3aed" height={240} />
          )}
        </div>

        <div className="card">
          <h2 className="mb-4 flex items-center gap-2 font-bold">
            <BarChart3 className="h-5 w-5 text-alkher-600" />
            Répartition progression
          </h2>
          {progression.length === 0 ? (
            <div className="flex items-center justify-center py-16 text-sm text-gray-400">
              Aucune donnée de progression
            </div>
          ) : (
            <BarChartSimple data={progression} dataKey="value" labelKey="name" color="#22c55e" height={240} />
          )}
        </div>
      </div>

      {/* ─── Quiz stats ─── */}
      <div className="card">
        <h2 className="mb-4 flex items-center gap-2 font-bold">
          <FileCheck className="h-5 w-5 text-alkher-600" />
          Quiz
        </h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="text-center">
            <p className="text-xs text-gray-500">Tentatives</p>
            <p className="text-2xl font-bold text-alkher-600">{quiz.total_attempts}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">Réussies</p>
            <p className="text-2xl font-bold text-green-600">{quiz.passed_attempts}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">Taux réussite</p>
            <p className="text-2xl font-bold">{quiz.pass_rate}%</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">Score moyen</p>
            <p className="text-2xl font-bold text-yellow-600">{quiz.avg_score}%</p>
          </div>
        </div>
      </div>
    </div>
  );
}
