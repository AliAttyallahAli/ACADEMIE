import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Eye, EyeOff, AlertCircle, ShieldCheck, UserCog, GraduationCap,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Spinner from '../../components/Spinner';

const TABS = [
  { key: 'admin', label: 'Super-admin', icon: ShieldCheck },
  { key: 'responsible', label: 'Responsable', icon: UserCog },
];

export default function AdminLogin() {
  const { loginAdmin, loginResponsible } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState('admin');
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
  }

  function switchTab(newTab) {
    setTab(newTab);
    setForm({ email: '', password: '' });
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (tab === 'admin') {
        await loginAdmin(form.email, form.password);
      } else {
        await loginResponsible(form.email, form.password);
      }
      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      const msg = err.response?.data?.error || 'Erreur de connexion';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-alkher-50 to-white px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link to="/" className="mb-6 flex items-center justify-center gap-2">
          <GraduationCap className="h-8 w-8 text-alkher-700" />
          <span className="text-2xl font-bold text-alkher-800">ALKHER ACADEMY</span>
        </Link>

        <div className="rounded-2xl bg-white p-6 shadow-xl sm:p-8">
          <h1 className="mb-1 text-2xl font-bold">Espace administration</h1>
          <p className="mb-6 text-sm text-gray-500">
            Connectez-vous pour gérer la plateforme
          </p>

          {/* Onglets Admin / Responsable */}
          <div className="mb-6 flex rounded-lg bg-gray-100 p-1">
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = tab === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => switchTab(t.key)}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition ${
                    active
                      ? 'bg-white text-alkher-700 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* Info du rôle sélectionné */}
          <div className={`mb-4 rounded-lg p-3 text-xs ${
            tab === 'admin'
              ? 'bg-alkher-50 text-alkher-800'
              : 'bg-purple-50 text-purple-800'
          }`}>
            {tab === 'admin' ? (
              <>
                <ShieldCheck className="mr-1 inline h-3 w-3" />
                Accès complet : modules, bourses, responsables, audit...
              </>
            ) : (
              <>
                <UserCog className="mr-1 inline h-3 w-3" />
                Accès selon vos permissions (pédagogique, bourses, support...)
              </>
            )}
          </div>

          {/* Formulaire */}
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="mb-4 flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="mb-4">
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={form.email}
                onChange={handleChange}
                className="input-field"
                placeholder={
                  tab === 'admin' ? 'admin@alkher.com' : 'responsable@alkher.com'
                }
              />
            </div>

            <div className="mb-4">
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={form.password}
                  onChange={handleChange}
                  className="input-field pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? (
                <>
                  <Spinner size="sm" className="mr-2 !border-white" />
                  Connexion...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Se connecter
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
            <Link to="/login" className="hover:underline">
              ← Espace apprenante
            </Link>
            {tab === 'responsible' && (
              <span>
                Pas encore de compte ? Contactez un admin
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
