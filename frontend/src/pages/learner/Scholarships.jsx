import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, GraduationCap, Search, Calendar, Building2, ChevronRight, DollarSign } from 'lucide-react';
import api from '../../api/axios';
import { ENDPOINTS } from '../../api/endpoints';
import Spinner from '../../components/Spinner';
import EmptyState from '../../components/EmptyState';
import { formatDate } from '../../utils/formatDate';

const BASE = import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000';

const TYPE_LABELS = {
  formation: { label: 'Formation', color: 'bg-alkher-100 text-alkher-700', icon: GraduationCap },
  recherche: { label: 'Recherche', color: 'bg-purple-100 text-purple-700', icon: Search },
  stage: { label: 'Stage', color: 'bg-green-100 text-green-700', icon: Briefcase },
  autre: { label: 'Autre', color: 'bg-gray-100 text-gray-700', icon: Briefcase },
};

export default function Scholarships() {
  const [state, setState] = useState({ loading: true, items: [] });
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(ENDPOINTS.scholarships);
        setState({ loading: false, items: data.items || [] });
      } catch {
        setState({ loading: false, items: [] });
      }
    })();
  }, []);

  if (state.loading) return <div className="flex min-h-[60vh] items-center justify-center"><Spinner size="lg" /></div>;

  const filtered = filter === 'all' ? state.items : state.items.filter((s) => s.type === filter);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Bourses & opportunités</h1>
        <p className="text-sm text-gray-500">Formations, recherche, stages</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={() => setFilter('all')} className={`rounded-full px-3 py-1.5 text-xs font-medium ${filter === 'all' ? 'bg-alkher-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
          Toutes ({state.items.length})
        </button>
        {Object.entries(TYPE_LABELS).map(([key, cfg]) => {
          const count = state.items.filter((s) => s.type === key).length;
          if (count === 0) return null;
          return (
            <button key={key} onClick={() => setFilter(key)} className={`rounded-full px-3 py-1.5 text-xs font-medium ${filter === key ? 'bg-alkher-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
              {cfg.label} ({count})
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="card">
          <EmptyState icon={Briefcase} title="Aucune bourse disponible" description="Revenez bientôt." />
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((s) => {
            const cfg = TYPE_LABELS[s.type] || TYPE_LABELS.autre;
            const Icon = cfg.icon;
            const isClosing = s.closing_date && new Date(s.closing_date) - new Date() < 7 * 24 * 3600 * 1000;

            return (
              <Link key={s.id} to={`/scholarships/${s.id}`} className="card block overflow-hidden p-0 transition hover:border-alkher-300">
                {s.cover_image_url && (
                  <img src={`${BASE}${s.cover_image_url}`} alt="" className="h-40 w-full object-cover" />
                )}
                <div className="p-4">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <span className={`badge ${cfg.color}`}>
                        <Icon className="mr-1 h-3 w-3" /> {cfg.label}
                      </span>
                      <h3 className="mt-2 font-bold">{s.title}</h3>
                      {s.organization && (
                        <p className="flex items-center gap-1 text-xs text-gray-500">
                          <Building2 className="h-3 w-3" /> {s.organization}
                        </p>
                      )}
                    </div>
                    <ChevronRight className="h-5 w-5 flex-shrink-0 text-gray-400" />
                  </div>
                  <p className="mb-2 line-clamp-2 text-sm text-gray-600">{s.description}</p>
                  <div className="flex flex-wrap items-center gap-3 text-xs">
                    {s.amount && (
                      <span className="flex items-center gap-1 text-gray-600">
                        <DollarSign className="h-3 w-3" /> {s.amount}
                      </span>
                    )}
                    {s.closing_date && (
                      <span className={`flex items-center gap-1 ${isClosing ? 'font-medium text-red-600' : 'text-gray-600'}`}>
                        <Calendar className="h-3 w-3" /> Clôture : {formatDate(s.closing_date)}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
