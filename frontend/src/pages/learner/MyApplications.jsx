import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase, Clock, CheckCircle2, XCircle, AlertCircle, ChevronRight,
} from 'lucide-react';
import api from '../../api/axios';
import { ENDPOINTS } from '../../api/endpoints';
import Spinner from '../../components/Spinner';
import EmptyState from '../../components/EmptyState';
import { formatDate } from '../../utils/formatDate';

const STATUS_CONFIG = {
  pending: { label: 'En cours d\'examen', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  accepted: { label: 'Acceptée', color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
  rejected: { label: 'Refusée', color: 'bg-red-100 text-red-800', icon: XCircle },
};

export default function MyApplications() {
  const [state, setState] = useState({ loading: true, items: [] });

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(ENDPOINTS.myApplications);
        setState({ loading: false, items: data.items });
      } catch {
        setState({ loading: false, items: [] });
      }
    })();
  }, []);

  if (state.loading) {
    return <div className="flex min-h-[60vh] items-center justify-center"><Spinner size="lg" /></div>;
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Mes candidatures</h1>
        <p className="text-sm text-gray-500">Suivez l'état de vos candidatures aux bourses</p>
      </div>

      {state.items.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Briefcase}
            title="Aucune candidature"
            description="Découvrez les bourses disponibles et postulez."
            action={<Link to="/scholarships" className="btn-primary">Voir les bourses</Link>}
          />
        </div>
      ) : (
        <div className="space-y-2">
          {state.items.map((a) => {
            const cfg = STATUS_CONFIG[a.status] || STATUS_CONFIG.pending;
            const Icon = cfg.icon;
            return (
              <Link
                key={a.id}
                to={`/scholarships/${a.scholarship_id}`}
                className="card flex items-center gap-3 transition hover:border-alkher-300"
              >
                <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${cfg.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{a.scholarship_title}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                    <span className={`badge ${cfg.color}`}>{cfg.label}</span>
                    <span className="text-gray-500">
                      Soumise le {formatDate(a.applied_at)}
                    </span>
                  </div>
                  {a.review_note && (
                    <p className="mt-1 line-clamp-1 text-xs text-gray-500">
                      Note : {a.review_note}
                    </p>
                  )}
                </div>
                <ChevronRight className="h-4 w-4 flex-shrink-0 text-gray-400" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}