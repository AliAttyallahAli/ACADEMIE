import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Trophy, Award, Download, ExternalLink, BookOpen, Briefcase,
  Sparkles, ChevronRight, Target, Users, MessageCircle,
} from 'lucide-react';
import api from '../../api/axios';
import { ENDPOINTS } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import Spinner from '../../components/Spinner';
import { formatDate } from '../../utils/formatDate';

export default function Orientation() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [state, setState] = useState({ loading: true, dashboard: null });

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(ENDPOINTS.dashboard);
        // Vérifier 100% complétion
        if (data.global_progress.progress_percent < 100 && data.certificates.length === 0) {
          navigate('/dashboard', { replace: true });
          return;
        }
        setState({ loading: false, dashboard: data });
      } catch {
        navigate('/dashboard', { replace: true });
      }
    })();
  }, [navigate]);

  if (state.loading) {
    return <div className="flex min-h-[60vh] items-center justify-center"><Spinner size="lg" /></div>;
  }

  const { dashboard } = state;
  const { learner, certificates, global_progress: gp, modules } = dashboard;
  const certificate = certificates[0];

  return (
    <div className="space-y-4">
      {/* Hero félicitations */}
      <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-gold-500 via-gold-400 to-yellow-300 p-6 text-center text-white shadow-lg">
        <div className="mx-auto mb-3 w-fit rounded-full bg-white/20 p-4">
          <Trophy className="h-12 w-12" />
        </div>
        <h1 className="text-2xl font-bold">Félicitations {learner.full_name.split(' ')[0]} ! 🎉</h1>
        <p className="mt-2 text-sm text-white/90">
          Vous avez terminé votre parcours avec succès.
        </p>
        <p className="mt-1 text-xs text-white/80">
          {gp.modules_completed} module{gp.modules_completed > 1 ? 's' : ''} complété{gp.modules_completed > 1 ? 's' : ''} ·{' '}
          {gp.completed_sessions} séances validées
        </p>
      </div>

      {/* Certificat */}
      {certificate && (
        <div className="card border-2 border-gold-400 bg-gradient-to-br from-yellow-50 to-white">
          <div className="mb-3 flex items-center gap-2">
            <Award className="h-6 w-6 text-gold-600" />
            <h2 className="font-bold">Votre certificat ALKHER ACADEMY</h2>
          </div>
          <p className="text-sm text-gray-600">
            Émis le {formatDate(certificate.issued_at)} · N° <span className="font-mono text-xs">{certificate.certificate_uuid.slice(0, 8)}...</span>
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <Link
              to={`/certificate/${certificate.certificate_uuid}`}
              className="btn-primary flex-1"
            >
              <Award className="mr-2 h-4 w-4" /> Voir mon certificat
            </Link>
            <a
              href={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:4000'}${certificate.download_url}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary flex-1 text-center"
              onClick={(e) => {
                e.preventDefault();
                // Télécharger via API avec auth
                fetch(
                  `${import.meta.env.VITE_API_URL || 'http://localhost:4000/api'}${certificate.download_url}`,
                  {
                    headers: {
                      Authorization: `Bearer ${localStorage.getItem('alkher_token')}`,
                    },
                  }
                )
                  .then((r) => r.blob())
                  .then((blob) => {
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `ALKHER-Certificat-${certificate.certificate_uuid}.pdf`;
                    a.click();
                    URL.revokeObjectURL(url);
                  });
              }}
            >
              <Download className="mr-2 h-4 w-4" /> Télécharger PDF
            </a>
          </div>
        </div>
      )}

      {/* Comment bénéficier de sa formation */}
      <div className="card">
        <h2 className="mb-3 flex items-center gap-2 font-bold">
          <Sparkles className="h-4 w-4 text-alkher-600" /> Valorisez votre formation
        </h2>
        <div className="space-y-3 text-sm text-gray-700">
          <p>Votre certificat est <strong>authentifié par QR code</strong> et vérifiable en ligne. Voici comment en tirer parti :</p>
          <ul className="space-y-2">
            <li className="flex gap-2">
              <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-alkher-500" />
              <span><strong>Ajoutez-le à votre CV</strong> et à votre profil LinkedIn.</span>
            </li>
            <li className="flex gap-2">
              <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-alkher-500" />
              <span><strong>Présentez le QR code</strong> à un recruteur : il pourra vérifier l'authenticité en temps réel.</span>
            </li>
            <li className="flex gap-2">
              <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-alkher-500" />
              <span><strong>Mentionnez vos compétences</strong> dans votre lettre de motivation.</span>
            </li>
            <li className="flex gap-2">
              <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-alkher-500" />
              <span><strong>Postulez aux bourses</strong> disponibles sur la plateforme.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Modules suivis */}
      <div className="card">
        <h2 className="mb-3 flex items-center gap-2 font-bold">
          <BookOpen className="h-4 w-4 text-alkher-600" /> Modules suivis
        </h2>
        <div className="space-y-2">
          {modules.map((m) => (
            <div key={m.module_id} className="flex items-center gap-3 rounded-lg border border-gray-200 p-3">
              <div className="rounded-lg bg-alkher-50 p-2">
                <BookOpen className="h-4 w-4 text-alkher-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">{m.title}</p>
                <p className="text-xs text-gray-500">
                  {m.total_sessions} séances · {m.progress_percent}%
                </p>
              </div>
              <span className="badge bg-green-100 text-green-700">
                {m.status === 'completed' ? 'Terminé' : 'En cours'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Pistes */}
      <div className="card">
        <h2 className="mb-3 flex items-center gap-2 font-bold">
          <Target className="h-4 w-4 text-alkher-600" /> Prochaines étapes
        </h2>
        <div className="space-y-2">
          <Link to="/scholarships" className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 transition hover:bg-gray-50">
            <Briefcase className="h-5 w-5 text-alkher-600" />
            <div className="flex-1">
              <p className="font-medium text-sm">Parcourir les bourses</p>
              <p className="text-xs text-gray-500">Formations, recherche, stages</p>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-400" />
          </Link>
          <Link to="/modules" className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 transition hover:bg-gray-50">
            <BookOpen className="h-5 w-5 text-alkher-600" />
            <div className="flex-1">
              <p className="font-medium text-sm">Continuer à se former</p>
              <p className="text-xs text-gray-500">Découvrir d'autres modules</p>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-400" />
          </Link>
          <Link to="/forum" className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 transition hover:bg-gray-50">
            <Users className="h-5 w-5 text-alkher-600" />
            <div className="flex-1">
              <p className="font-medium text-sm">Partager avec la communauté</p>
              <p className="text-xs text-gray-500">Forum d'entraide</p>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-400" />
          </Link>
        </div>
      </div>

      {/* Contact */}
      <div className="card bg-alkher-50 text-center">
        <MessageCircle className="mx-auto mb-2 h-6 w-6 text-alkher-600" />
        <p className="text-sm font-medium text-alkher-900">Besoin d'aide ?</p>
        <p className="mt-1 text-xs text-alkher-700">
          L'équipe ALKHER ACADEMY est disponible via le support.
        </p>
        <Link to="/support" className="btn-secondary mt-3 inline-flex">
          Contacter le support
        </Link>
      </div>
    </div>
  );
}