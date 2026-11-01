import { GraduationCap } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AuthCard({ title, subtitle, children, footer, wide = false }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-alkher-50 via-white to-alkher-50 px-4 py-8">
      <div className={`w-full ${wide ? 'max-w-2xl' : 'max-w-md'}`}>
        <Link to="/" className="mb-6 flex items-center justify-center gap-2">
          <GraduationCap className="h-8 w-8 text-alkher-700" />
          <span className="text-2xl font-bold text-alkher-800">ALKHER ACADEMY</span>
        </Link>

        <div className="rounded-2xl bg-white p-6 shadow-xl shadow-alkher-900/5 sm:p-8">
          <h1 className="mb-1 text-2xl font-bold text-gray-900">{title}</h1>
          {subtitle && <p className="mb-6 text-sm text-gray-500">{subtitle}</p>}

          {children}
        </div>

        {footer && <div className="mt-6 text-center text-sm text-gray-600">{footer}</div>}
      </div>
    </div>
  );
}