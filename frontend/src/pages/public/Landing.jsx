import { Link } from 'react-router-dom';
import { GraduationCap, BookOpen, Award, Users } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-alkher-50 to-white">
      <header className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-7 w-7 text-alkher-700" />
          <span className="text-xl font-bold text-alkher-800">ALKHER ACADEMY</span>
        </div>
        <div className="flex gap-2">
          <Link to="/login" className="btn-secondary">Connexion</Link>
          <Link to="/register" className="btn-primary">S'inscrire</Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-16 text-center">
        <h1 className="mb-4 text-4xl font-bold text-alkher-900 md:text-6xl">
          Formez-vous à votre rythme
        </h1>
        <p className="mb-8 text-lg text-gray-600">
          Des modules pédagogiques structurés, des quiz interactifs, un certificat authentifié.
        </p>
        <Link to="/register" className="btn-primary text-base">
          Commencer maintenant
        </Link>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          <div className="card text-center">
            <BookOpen className="mx-auto mb-3 h-10 w-10 text-alkher-600" />
            <h3 className="mb-2 font-bold">Modules structurés</h3>
            <p className="text-sm text-gray-600">
              Diffusion progressive x fois par semaine.
            </p>
          </div>
          <div className="card text-center">
            <Award className="mx-auto mb-3 h-10 w-10 text-gold-500" />
            <h3 className="mb-2 font-bold">Certificat QR</h3>
            <p className="text-sm text-gray-600">
              Vérifiable en ligne par QR code unique.
            </p>
          </div>
          <div className="card text-center">
            <Users className="mx-auto mb-3 h-10 w-10 text-alkher-600" />
            <h3 className="mb-2 font-bold">Bourses disponibles</h3>
            <p className="text-sm text-gray-600">
              Formations, recherche, stages — postulez en ligne.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}