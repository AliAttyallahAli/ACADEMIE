import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap, BookOpen, Award, Users, Briefcase, Calendar,
  Building2, ChevronRight, ArrowRight, Sparkles, Star,
  Search, LogIn, UserPlus, MapPin, DollarSign,
} from 'lucide-react';
import api from '../../api/axios';
import { ENDPOINTS } from '../../api/endpoints';
import Spinner from '../../components/Spinner';
import { formatDate } from '../../utils/formatDate';

const BASE = import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000';

const TYPE_LABELS = {
  formation: { label: 'Formation', color: 'bg-alkher-100 text-alkher-700' },
  recherche: { label: 'Recherche', color: 'bg-purple-100 text-purple-700' },
  stage: { label: 'Stage', color: 'bg-green-100 text-green-700' },
  autre: { label: 'Autre', color: 'bg-gray-100 text-gray-700' },
};

export default function Home() {
  const [state, setState] = useState({
    loading: true,
    scholarships: [],
    stats: null,
  });

  useEffect(() => {
    (async () => {
      try {
        const [sch, stats] = await Promise.all([
          api.get(ENDPOINTS.public.scholarships).catch(() => ({ data: { items: [] } })),
          api.get(ENDPOINTS.public.stats).catch(() => ({ data: null })),
        ]);
        setState({
          loading: false,
          scholarships: sch.data.items || [],
          stats: stats.data,
        });
      } catch {
        setState({ loading: false, scholarships: [], stats: null });
      }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* ═══════════ HEADER ═══════════ */}
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-6">
          <Link to="/" className="flex items-center gap-2">
            <GraduationCap className="h-7 w-7 text-alkher-700" />
            <span className="text-xl font-bold text-alkher-800">ALKHER ACADEMY</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/login" className="btn-secondary hidden sm:inline-flex">
              <LogIn className="mr-2 h-4 w-4" />Connexion
            </Link>
            <Link to="/register" className="btn-primary">
              <UserPlus className="mr-2 h-4 w-4" />S'inscrire
            </Link>
          </div>
        </div>
      </header>

      {/* ═══════════ HERO ═══════════ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-alkher-50 via-white to-alkher-50">
        <div className="mx-auto max-w-7xl px-4 py-16 text-center lg:px-6 lg:py-24">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-alkher-100 px-3 py-1 text-xs font-medium text-alkher-700">
            <Sparkles className="h-3 w-3" />
            Plateforme de formation 100% en ligne
          </div>
          <h1 className="mb-4 text-4xl font-bold text-gray-900 md:text-5xl lg:text-6xl">
            Formez-vous à votre rythme
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-gray-600">
            Des modules pédagogiques structurés, des quiz interactifs, un certificat authentifié
            et des bourses pour financer vos études.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/register" className="btn-primary text-base">
              Commencer maintenant <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <a href="#bourses" className="btn-secondary text-base">
              Voir les bourses <ChevronRight className="ml-2 h-4 w-4" />
            </a>
          </div>

          {/* Stats hero */}
          {state.stats && (
            <div className="mx-auto mt-12 grid max-w-3xl grid-cols-2 gap-4 md:grid-cols-4">
              <div className="rounded-xl bg-white p-4 shadow-sm">
                <p className="text-3xl font-bold text-alkher-600">{state.stats.learners}</p>
                <p className="text-xs text-gray-500">Apprenantes</p>
              </div>
              <div className="rounded-xl bg-white p-4 shadow-sm">
                <p className="text-3xl font-bold text-alkher-600">{state.stats.modules}</p>
                <p className="text-xs text-gray-500">Modules</p>
              </div>
              <div className="rounded-xl bg-white p-4 shadow-sm">
                <p className="text-3xl font-bold text-alkher-600">{state.stats.certificates}</p>
                <p className="text-xs text-gray-500">Certificats</p>
              </div>
              <div className="rounded-xl bg-white p-4 shadow-sm">
                <p className="text-3xl font-bold text-gold-500">{state.stats.scholarships}</p>
                <p className="text-xs text-gray-500">Bourses actives</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ═══════════ BOURSES ═══════════ */}
      <section id="bourses" className="bg-gray-50 py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 lg:px-6">
          <div className="mb-8 text-center">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-gold-100 px-3 py-1 text-xs font-medium text-gold-700">
              <Star className="h-3 w-3" />
              Opportunités
            </div>
            <h2 className="mb-2 text-3xl font-bold text-gray-900">Bourses disponibles</h2>
            <p className="text-gray-600">
              Formations, recherche, stages — postulez dès votre inscription
            </p>
          </div>

          {state.loading ? (
            <div className="flex justify-center py-12"><Spinner size="lg" /></div>
          ) : state.scholarships.length === 0 ? (
            <div className="card mx-auto max-w-md text-center">
              <Briefcase className="mx-auto mb-3 h-12 w-12 text-gray-400" />
              <p className="text-gray-500">Aucune bourse disponible pour le moment</p>
              <p className="mt-1 text-sm text-gray-400">Revenez bientôt !</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {state.scholarships.map((s) => {
                const cfg = TYPE_LABELS[s.type] || TYPE_LABELS.autre;
                const isClosing = s.closing_date && new Date(s.closing_date) - new Date() < 7 * 24 * 3600 * 1000;

                return (
                  <div key={s.id} className="card overflow-hidden p-0 flex flex-col">
                    {s.cover_image_url ? (
                      <img
                        src={`${BASE}${s.cover_image_url}`}
                        alt={s.title}
                        className="h-40 w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-40 w-full items-center justify-center bg-gradient-to-br from-alkher-100 to-alkher-50 text-alkher-600">
                        <Briefcase className="h-12 w-12" />
                      </div>
                    )}

                    <div className="flex flex-1 flex-col p-4">
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <span className={`badge ${cfg.color}`}>{cfg.label}</span>
                        {s.closing_date && (
                          <span className={`text-xs ${isClosing ? 'font-medium text-red-600' : 'text-gray-500'}`}>
                            {isClosing ? '⏰ Clôture proche' : `Clôture ${formatDate(s.closing_date)}`}
                          </span>
                        )}
                      </div>

                      <h3 className="mb-1 font-bold text-lg line-clamp-2">{s.title}</h3>

                      {s.organization && (
                        <p className="mb-2 flex items-center gap-1 text-xs text-gray-500">
                          <Building2 className="h-3 w-3" /> {s.organization}
                        </p>
                      )}

                      {s.description && (
                        <p className="mb-3 line-clamp-3 text-sm text-gray-600">{s.description}</p>
                      )}

                      <div className="mt-auto flex flex-wrap items-center gap-3 text-xs text-gray-500">
                        {s.amount && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" /> {s.amount}
                          </span>
                        )}
                        {s.opening_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" /> {formatDate(s.opening_date)}
                          </span>
                        )}
                      </div>

                      <Link
                        to={`/public/scholarships/${s.id}`}
                        className="btn-primary mt-4 w-full"
                      >
                        Voir les détails <ChevronRight className="ml-1 h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {state.scholarships.length > 0 && (
            <div className="mt-8 text-center">
              <Link to="/register" className="btn-secondary">
                Voir toutes les bourses après inscription
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ═══════════ FONCTIONNALITÉS ═══════════ */}
      <section className="py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 lg:px-6">
          <div className="mb-12 text-center">
            <h2 className="mb-2 text-3xl font-bold text-gray-900">Pourquoi ALKHER ACADEMY ?</h2>
            <p className="text-gray-600">Tout ce dont vous avez besoin pour réussir</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <FeatureCard
              icon={BookOpen}
              title="Modules structurés"
              description="Diffusion progressive x fois par semaine sur une durée définie"
              color="alkher"
            />
            <FeatureCard
              icon={Star}
              title="Quiz interactifs"
              description="Débloquez les séances suivantes en réussissant les quiz à 60%"
              color="green"
            />
            <FeatureCard
              icon={Award}
              title="Certificat QR"
              description="Attestation authentifiée par QR code, vérifiable en ligne"
              color="gold"
            />
            <FeatureCard
              icon={Briefcase}
              title="Bourses"
              description="Formations, recherche, stages — postulez en ligne"
              color="alkher"
            />
          </div>
        </div>
      </section>

      {/* ═══════════ CTA FINAL ═══════════ */}
      <section className="bg-gradient-to-br from-alkher-700 to-alkher-900 py-16 text-white lg:py-20">
        <div className="mx-auto max-w-3xl px-4 text-center lg:px-6">
          <h2 className="mb-4 text-3xl font-bold">Prêt(e) à commencer ?</h2>
          <p className="mb-8 text-lg text-white/90">
            Rejoignez ALKHER ACADEMY et transformez votre avenir
          </p>
          <div className="flex items-center gap-2">
            <Link to="/login" className="btn-primary sm:inline-flex">
              <LogIn className="mr-2 h-4 w-4" />Connexion
            </Link>
            <Link to="/register" className="btn-primary">
              <UserPlus className="mr-2 h-4 w-4" />S'inscrire
            </Link>
         </div>
        </div>
      </section>

      {/* ═══════════ FOOTER ═══════════ */}
      <footer className="border-t border-gray-200 bg-white py-8">
        <div className="mx-auto max-w-7xl px-4 lg:px-6">
          <div className="flex flex-col items-center justify-between gap-4 text-sm text-gray-500 md:flex-row">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-alkher-600" />
              <span>© {new Date().getFullYear()} ALKHER ACADEMY</span>
            </div>
            <div className="flex gap-4">
              <Link to="/login" className="hover:text-alkher-600">Connexion</Link>
              <Link to="/register" className="hover:text-alkher-600">Inscription</Link>
              <Link to="/admin/login" className="hover:text-alkher-600">Admin</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description, color = 'alkher' }) {
  const colors = {
    alkher: 'bg-alkher-50 text-alkher-600',
    green: 'bg-green-50 text-green-600',
    gold: 'bg-yellow-50 text-yellow-600',
  };
  return (
    <div className="card text-center">
      <div className={`mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl ${colors[color]}`}>
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="mb-2 font-bold">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  );
}
