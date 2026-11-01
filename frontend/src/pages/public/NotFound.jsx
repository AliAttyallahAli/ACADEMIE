import { Link } from 'react-router-dom';
import { FileX } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md text-center">
        <FileX className="mx-auto mb-4 h-16 w-16 text-gray-400" />
        <h1 className="mb-2 text-5xl font-bold text-alkher-800">404</h1>
        <p className="mb-6 text-gray-600">Cette page n'existe pas.</p>
        <Link to="/" className="btn-primary">Retour à l'accueil</Link>
      </div>
    </div>
  );
}