import { useEffect, useRef, useState } from 'react';
import { Camera, Trash2, Save, Lock, CheckCircle2 } from 'lucide-react';
import api from '../../api/axios';
import { ENDPOINTS } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import Spinner from '../../components/Spinner';
import Toast from '../../components/Toast';
import FormField from '../../components/FormField';
import StatCard from '../../components/StatCard';
import { BookOpen, Target, Award, Briefcase } from 'lucide-react';
import { formatDate } from '../../utils/formatDate';

const BASE = import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const fileRef = useRef(null);

  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState(null);

  const [form, setForm] = useState({ full_name: '', phone: '', country: '', bio: '' });
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm: '',
  });
  const [changingPassword, setChangingPassword] = useState(false);

  async function loadProfile() {
    try {
      const { data } = await api.get(ENDPOINTS.profile.get);
      setProfile(data.user);
      setStats(data.stats);
      setForm({
        full_name: data.user.full_name || '',
        phone: data.user.phone || '',
        country: data.user.country || '',
        bio: data.user.bio || '',
      });
    } catch (err) {
      setToast({ type: 'error', message: 'Erreur de chargement du profil' });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadProfile(); }, []);

  async function uploadPhoto(file) {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('photo', file);
      const { data } = await api.post(ENDPOINTS.profile.photo, fd);
      setProfile((p) => ({ ...p, profile_photo_url: data.url }));
      setToast({ type: 'success', message: 'Photo mise à jour !' });
      refreshUser?.();
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.error || 'Erreur upload' });
    } finally {
      setUploading(false);
    }
  }

  async function removePhoto() {
    if (!confirm('Supprimer votre photo de profil ?')) return;
    try {
      await api.delete(ENDPOINTS.profile.photo);
      setProfile((p) => ({ ...p, profile_photo_url: null }));
      setToast({ type: 'success', message: 'Photo supprimée' });
      refreshUser?.();
    } catch {
      setToast({ type: 'error', message: 'Erreur suppression' });
    }
  }

  async function saveProfile(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.put(ENDPOINTS.profile.update, form);
      setProfile(data.user);
      setToast({ type: 'success', message: 'Profil enregistré' });
      refreshUser?.();
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.error || 'Erreur' });
    } finally {
      setSaving(false);
    }
  }

  async function changePassword(e) {
    e.preventDefault();
    if (passwordForm.new_password !== passwordForm.confirm) {
      setToast({ type: 'error', message: 'Les mots de passe diffèrent' });
      return;
    }
    setChangingPassword(true);
    try {
      await api.put(ENDPOINTS.profile.password, {
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      });
      setPasswordForm({ current_password: '', new_password: '', confirm: '' });
      setToast({ type: 'success', message: 'Mot de passe modifié' });
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.error || 'Erreur' });
    } finally {
      setChangingPassword(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const initials = profile.full_name
    ?.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase() || 'A';

  return (
    <div className="space-y-4">
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />

      {/* Carte identité */}
      <div className="card">
        <div className="flex items-center gap-4">
          <div className="relative">
            {profile.profile_photo_url ? (
              <img
                src={`${BASE}${profile.profile_photo_url}`}
                alt=""
                className="h-20 w-20 rounded-full border-2 border-alkher-500 object-cover"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-alkher-500 bg-alkher-100 text-2xl font-bold text-alkher-700">
                {initials}
              </div>
            )}
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="absolute -bottom-1 -right-1 rounded-full bg-alkher-600 p-2 text-white shadow-md hover:bg-alkher-700"
            >
              {uploading ? <Spinner size="sm" className="!border-white" /> : <Camera className="h-3 w-3" />}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => uploadPhoto(e.target.files[0])}
            />
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="truncate text-xl font-bold">{profile.full_name}</h1>
            <p className="truncate text-sm text-gray-500">{profile.email}</p>
            <p className="text-xs text-gray-400">Née le {formatDate(profile.birth_date)}</p>
            {profile.profile_photo_url && (
              <button
                onClick={removePhoto}
                className="mt-2 inline-flex items-center gap-1 text-xs text-red-500 hover:underline"
              >
                <Trash2 className="h-3 w-3" /> Supprimer la photo
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Modules terminés" value={stats.modules_count} icon={BookOpen} />
          <StatCard label="Séances validées" value={stats.sessions_completed} icon={Target} color="green" />
          <StatCard label="Certificats" value={stats.certificates_count} icon={Award} color="gold" />
          <StatCard label="Candidatures" value={stats.scholarship_applications_count} icon={Briefcase} />
        </div>
      )}

      {/* Informations personnelles */}
      <form onSubmit={saveProfile} className="card">
        <h2 className="mb-4 font-bold">Informations personnelles</h2>

        <FormField label="Nom complet" required id="full_name">
          <input
            id="full_name"
            className="input-field"
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            required
          />
        </FormField>

        <div className="grid gap-3 md:grid-cols-2">
          <FormField label="Téléphone" id="phone">
            <input
              id="phone"
              className="input-field"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+235 66 00 00 00"
            />
          </FormField>
          <FormField label="Pays" id="country">
            <input
              id="country"
              className="input-field"
              value={form.country}
              onChange={(e) => setForm({ ...form, country: e.target.value })}
              placeholder="Tchad"
            />
          </FormField>
        </div>

        <FormField label="Bio" id="bio" hint="Max 500 caractères">
          <textarea
            id="bio"
            className="input-field min-h-[80px]"
            maxLength={500}
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            placeholder="Quelques mots sur vous..."
          />
        </FormField>

        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? <Spinner size="sm" className="mr-2 !border-white" /> : <Save className="mr-2 h-4 w-4" />}
          Enregistrer
        </button>
      </form>

      {/* Sécurité */}
      <form onSubmit={changePassword} className="card">
        <h2 className="mb-4 flex items-center gap-2 font-bold">
          <Lock className="h-4 w-4 text-alkher-600" /> Changer le mot de passe
        </h2>

        <FormField label="Mot de passe actuel" required id="current_password">
          <input
            id="current_password"
            type="password"
            className="input-field"
            autoComplete="current-password"
            value={passwordForm.current_password}
            onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
            required
          />
        </FormField>

        <div className="grid gap-3 md:grid-cols-2">
          <FormField label="Nouveau mot de passe" required id="new_password">
            <input
              id="new_password"
              type="password"
              className="input-field"
              autoComplete="new-password"
              minLength={8}
              value={passwordForm.new_password}
              onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
              required
            />
          </FormField>
          <FormField label="Confirmer" required id="confirm">
            <input
              id="confirm"
              type="password"
              className="input-field"
              autoComplete="new-password"
              value={passwordForm.confirm}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
              required
            />
          </FormField>
        </div>

        <button type="submit" disabled={changingPassword} className="btn-secondary">
          {changingPassword && <Spinner size="sm" className="mr-2" />}
          Modifier le mot de passe
        </button>
      </form>
    </div>
  );
}