import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import AuthCard from '../../components/AuthCard';
import FormField from '../../components/FormField';
import Spinner from '../../components/Spinner';

const PASSWORD_RULES = [
  { test: (p) => p.length >= 8, label: '8 caractères minimum' },
  { test: (p) => /[A-Z]/.test(p), label: 'Une majuscule' },
  { test: (p) => /[a-z]/.test(p), label: 'Une minuscule' },
  { test: (p) => /\d/.test(p), label: 'Un chiffre' },
];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    full_name: '',
    birth_date: '',
    email: '',
    password: '',
    confirm: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setFieldErrors((fe) => ({ ...fe, [e.target.name]: undefined }));
  }

  const passwordValid = PASSWORD_RULES.every((r) => r.test(form.password));
  const passwordsMatch = form.password && form.password === form.confirm;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    if (!passwordValid) {
      setError('Le mot de passe ne respecte pas les règles.');
      return;
    }
    if (!passwordsMatch) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);
    try {
      await register({
        full_name: form.full_name,
        birth_date: form.birth_date,
        email: form.email,
        password: form.password,
      });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const data = err.response?.data;
      if (data?.details) {
        const fe = {};
        data.details.forEach((d) => { fe[d.field] = d.message; });
        setFieldErrors(fe);
      }
      setError(data?.error || 'Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard
      title="Créer un compte"
      subtitle="Rejoignez ALKHER ACADEMY en quelques secondes"
      wide
      footer={
        <>
          Vous avez déjà un compte ?{' '}
          <Link to="/login" className="font-medium text-alkher-600 hover:underline">
            Se connecter
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="grid gap-2 md:grid-cols-2">
        {error && (
          <div className="col-span-full mb-4 flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="md:col-span-2">
          <FormField label="Nom complet" required id="full_name" error={fieldErrors.full_name}>
            <input
              id="full_name"
              name="full_name"
              type="text"
              required
              value={form.full_name}
              onChange={handleChange}
              className="input-field"
              placeholder="Aminata Diallo"
            />
          </FormField>
        </div>

        <FormField label="Date de naissance" required id="birth_date" error={fieldErrors.birth_date}>
          <input
            id="birth_date"
            name="birth_date"
            type="date"
            required
            max={new Date().toISOString().split('T')[0]}
            value={form.birth_date}
            onChange={handleChange}
            className="input-field"
          />
        </FormField>

        <FormField label="Email" required id="email" error={fieldErrors.email}>
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

        <FormField label="Mot de passe" required id="password" error={fieldErrors.password}>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              value={form.password}
              onChange={handleChange}
              className="input-field pr-10"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-2 top-2.5 text-gray-400"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {form.password && (
            <ul className="mt-2 space-y-1">
              {PASSWORD_RULES.map((r) => (
                <li
                  key={r.label}
                  className={`flex items-center gap-1.5 text-xs ${
                    r.test(form.password) ? 'text-green-600' : 'text-gray-400'
                  }`}
                >
                  <Check className="h-3 w-3" /> {r.label}
                </li>
              ))}
            </ul>
          )}
        </FormField>

        <FormField
          label="Confirmer le mot de passe"
          required
          id="confirm"
          error={form.confirm && !passwordsMatch ? 'Les mots de passe diffèrent' : undefined}
        >
          <input
            id="confirm"
            name="confirm"
            type="password"
            autoComplete="new-password"
            required
            value={form.confirm}
            onChange={handleChange}
            className="input-field"
            placeholder="••••••••"
          />
        </FormField>

        <div className="md:col-span-2 mt-2">
          <button
            type="submit"
            disabled={loading || !passwordValid || !passwordsMatch}
            className="btn-primary w-full"
          >
            {loading && <Spinner size="sm" className="mr-2 !border-white" />}
            {loading ? 'Création...' : 'Créer mon compte'}
          </button>
        </div>
      </form>
    </AuthCard>
  );
}