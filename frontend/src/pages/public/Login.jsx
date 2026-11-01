import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import AuthCard from '../../components/AuthCard';
import FormField from '../../components/FormField';
import Spinner from '../../components/Spinner';

export default function Login() {
  const { loginLearner } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await loginLearner(form.email, form.password);
      const redirect = location.state?.from?.pathname || '/dashboard';
      navigate(redirect, { replace: true });
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.details?.[0]?.message ||
        'Erreur de connexion';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard
      title="Bienvenue !"
      subtitle="Connectez-vous à votre compte apprenante"
      footer={
        <>
          Pas encore de compte ?{' '}
          <Link to="/register" className="font-medium text-alkher-600 hover:underline">
            Créer un compte
          </Link>
          <div className="mt-2 text-xs text-gray-400">
            <Link to="/admin/login" className="hover:underline">
              Accès administrateur
            </Link>
          </div>
        </>
      }
    >
      <form onSubmit={handleSubmit}>
        {error && (
          <div className="mb-4 flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <FormField label="Email" required id="email">
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={form.email}
            onChange={handleChange}
            className="input-field"
            placeholder="vous@exemple.com"
          />
        </FormField>

        <FormField label="Mot de passe" required id="password">
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
        </FormField>

        <button type="submit" disabled={loading} className="btn-primary mt-2 w-full">
          {loading ? <Spinner size="sm" className="mr-2 !border-white" /> : null}
          {loading ? 'Connexion...' : 'Se connecter'}
        </button>
      </form>
    </AuthCard>
  );
}