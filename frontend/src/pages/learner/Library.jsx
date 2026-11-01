import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Library as LibraryIcon, FileText, Video, Download, Image as ImageIcon, Search, BookOpen } from 'lucide-react';
import api from '../../api/axios';
import { ENDPOINTS } from '../../api/endpoints';
import Spinner from '../../components/Spinner';
import EmptyState from '../../components/EmptyState';
import Toast from '../../components/Toast';
import { formatDate } from '../../utils/formatDate';

const BASE = import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000';

const TYPE_ICONS = {
  pdf: FileText,
  video: Video,
  image: ImageIcon,
};

export default function Library() {
  const [state, setState] = useState({ loading: true, items: [] });
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [toast, setToast] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(ENDPOINTS.library);
        setState({ loading: false, items: data.items || [] });
      } catch {
        setState({ loading: false, items: [] });
        setToast({ type: 'error', message: 'Erreur de chargement' });
      }
    })();
  }, []);

  const filtered = state.items.filter((r) => {
    if (filter !== 'all' && r.file_type !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        r.title?.toLowerCase().includes(q) ||
        r.module_title?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const types = ['all', ...new Set(state.items.map((r) => r.file_type).filter(Boolean))];

  return (
    <div className="space-y-4">
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />

      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <LibraryIcon className="h-5 w-5 text-alkher-600" />
          Bibliothèque
        </h1>
        <p className="text-sm text-gray-500">
          Ressources de vos modules · accès permanent
        </p>
      </div>

      {/* Recherche */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher une ressource..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-alkher-500 focus:outline-none"
        />
      </div>

      {/* Filtres par type */}
      {state.items.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {types.map((t) => {
            const count = t === 'all' ? state.items.length : state.items.filter((r) => r.file_type === t).length;
            return (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  filter === t ? 'bg-alkher-600 text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                {t === 'all' ? 'Tous' : t} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Liste */}
      {state.loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : state.items.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={LibraryIcon}
            title="Aucune ressource disponible"
            description="Inscrivez-vous à un module pour accéder aux ressources."
            action={<Link to="/modules" className="btn-primary">Voir les modules</Link>}
          />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Search}
            title="Aucun résultat"
            description="Essayez une autre recherche."
          />
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((r) => {
            const Icon = TYPE_ICONS[r.file_type] || FileText;
            return (
              <a
                key={r.id}
                href={`${BASE}${r.file_url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="card flex items-center gap-3 transition hover:border-alkher-300"
              >
                <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${
                  r.file_type === 'pdf' ? 'bg-red-50 text-red-600' :
                  r.file_type === 'video' ? 'bg-purple-50 text-purple-600' :
                  'bg-alkher-50 text-alkher-600'
                }`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-sm">{r.title}</p>
                  <p className="text-xs text-gray-500">
                    <BookOpen className="mr-1 inline h-3 w-3" />
                    {r.module_title}
                  </p>
                  <p className="text-xs text-gray-400">
                    Ajouté le {formatDate(r.uploaded_at)}
                  </p>
                </div>
                <Download className="h-4 w-4 flex-shrink-0 text-gray-400" />
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}