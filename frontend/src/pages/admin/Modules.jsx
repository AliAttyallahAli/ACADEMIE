import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus, Edit, Trash2, BookOpen, Image as ImageIcon, Upload, X,
  Layers, FileText, Search, CheckCircle2, AlertCircle,
} from 'lucide-react';
import api from '../../api/axios';
import { ENDPOINTS } from '../../api/endpoints';
import Toast from '../../components/Toast';
import Spinner from '../../components/Spinner';

const BASE = import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000';

export default function AdminModules() {
  const [state, setState] = useState({ loading: true, items: [] });
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    duration_weeks: 4,
    frequency_per_week: 2,
  });
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef();

  // ─── Chargement ───
  async function load() {
    setState((s) => ({ ...s, loading: true }));
    try {
      const { data } = await api.get(ENDPOINTS.admin.modules);
      setState({ loading: false, items: data.items || [] });
    } catch (err) {
      setState({ loading: false, items: [] });
      setToast({ type: 'error', message: 'Erreur de chargement' });
    }
  }

  useEffect(() => { load(); }, []);

  // ─── Upload image ───
  function handleCoverChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  }

  async function uploadCoverFor(moduleId, file) {
    const fd = new FormData();
    fd.append('cover', file);
    try {
      await api.post(ENDPOINTS.admin.moduleCover(moduleId), fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setToast({ type: 'success', message: 'Image mise à jour' });
      await load();
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.error || 'Erreur upload' });
    }
  }

  // ─── Création / Édition ───
  async function submit(e) {
    e.preventDefault();
    if (!form.title || form.title.trim().length < 3) {
      setToast({ type: 'error', message: 'Titre : 3 caractères minimum' });
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await api.put(ENDPOINTS.admin.module(editing.id), form);
        if (coverFile) {
          const fd = new FormData();
          fd.append('cover', coverFile);
          await api.post(ENDPOINTS.admin.moduleCover(editing.id), fd, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
        }
        setToast({ type: 'success', message: 'Module modifié' });
      } else {
        const { data } = await api.post(ENDPOINTS.admin.modules, form);
        if (coverFile) {
          const fd = new FormData();
          fd.append('cover', coverFile);
          await api.post(ENDPOINTS.admin.moduleCover(data.module.id), fd, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
        }
        setToast({
          type: 'success',
          message: `Module créé avec ${data.module.total_sessions} séances`,
        });
      }
      closeForm();
      await load();
    } catch (err) {
      setToast({
        type: 'error',
        message: err.response?.data?.error || err.response?.data?.details?.join(', ') || 'Erreur',
      });
    } finally {
      setSaving(false);
    }
  }

  function closeForm() {
    setShowForm(false);
    setEditing(null);
    setForm({ title: '', description: '', duration_weeks: 4, frequency_per_week: 2 });
    setCoverFile(null);
    setCoverPreview(null);
  }

  function edit(m) {
    setEditing(m);
    setForm({
      title: m.title,
      description: m.description || '',
      duration_weeks: m.duration_weeks,
      frequency_per_week: m.frequency_per_week,
    });
    setCoverPreview(m.cover_image_url ? `${BASE}${m.cover_image_url}` : null);
    setCoverFile(null);
    setShowForm(true);
  }

  async function remove(id) {
    if (!confirm('Supprimer ce module et toutes ses séances ?')) return;
    try {
      await api.delete(ENDPOINTS.admin.module(id));
      setToast({ type: 'success', message: 'Module supprimé' });
      await load();
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.error || 'Erreur' });
    }
  }

  // ─── Filtrage ───
  const filtered = state.items.filter((m) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return m.title?.toLowerCase().includes(q) || m.description?.toLowerCase().includes(q);
  });

  if (state.loading) {
    return <div className="flex min-h-[60vh] items-center justify-center"><Spinner size="lg" /></div>;
  }

  return (
    <div className="space-y-6">
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Modules</h1>
          <p className="text-sm text-gray-500">
            {state.items.length} module{state.items.length > 1 ? 's' : ''} · Gérez les modules, niveaux, séances et quiz
          </p>
        </div>
        <button onClick={() => { closeForm(); setShowForm(true); }} className="btn-primary">
          <Plus className="mr-2 h-4 w-4" />Nouveau module
        </button>
      </div>

      {/* Barre de recherche */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher par titre ou description..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-alkher-500 focus:outline-none"
        />
      </div>

      {/* Formulaire */}
      {showForm && (
        <form onSubmit={submit} className="card">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-bold">{editing ? 'Modifier le module' : 'Nouveau module'}</h2>
            <button type="button" onClick={closeForm} className="rounded p-1 hover:bg-gray-100">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Upload image */}
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium">Image de couverture</label>
            <div className="flex items-center gap-4">
              {coverPreview ? (
                <div className="relative">
                  <img src={coverPreview} alt="" className="h-24 w-40 rounded-lg object-cover" />
                  <button
                    type="button"
                    onClick={() => { setCoverFile(null); setCoverPreview(null); }}
                    className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current.click()}
                  className="flex h-24 w-40 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 text-gray-400 hover:border-alkher-400 hover:text-alkher-600"
                >
                  <ImageIcon className="h-8 w-8" />
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleCoverChange} />
              <div className="text-xs text-gray-500">
                <p>JPG, PNG · max 5 Mo</p>
                <p>Recadrée en 800×400 webp</p>
              </div>
            </div>
          </div>

          <div className="mb-3">
            <label className="mb-1 block text-sm font-medium">Titre *</label>
            <input
              required
              className="input-field"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Ex : Bureautique niveau 1"
            />
          </div>

          <div className="mb-3">
            <label className="mb-1 block text-sm font-medium">Description</label>
            <textarea
              className="input-field min-h-[80px]"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Programme, objectifs, prérequis..."
            />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Durée (semaines)</label>
              <input
                type="number"
                min={1}
                max={104}
                className="input-field"
                value={form.duration_weeks}
                onChange={(e) => setForm({ ...form, duration_weeks: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Fréquence (x/semaine)</label>
              <input
                type="number"
                min={1}
                max={7}
                className="input-field"
                value={form.frequency_per_week}
                onChange={(e) => setForm({ ...form, frequency_per_week: Number(e.target.value) })}
              />
            </div>
          </div>

          {!editing && (
            <div className="my-3 rounded-lg bg-alkher-50 p-3 text-sm">
              <strong>{form.duration_weeks * form.frequency_per_week}</strong> séances seront générées automatiquement
            </div>
          )}

          <div className="flex gap-2">
            <button type="button" onClick={closeForm} className="btn-secondary">
              Annuler
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? <><Spinner size="sm" className="mr-2 !border-white" />Enregistrement...</> : (editing ? 'Enregistrer' : 'Créer le module')}
            </button>
          </div>
        </form>
      )}

      {/* Liste des modules */}
      {filtered.length === 0 ? (
        <div className="card text-center py-12">
          <BookOpen className="mx-auto mb-3 h-12 w-12 text-gray-300" />
          <p className="text-gray-500">
            {state.items.length === 0 ? 'Aucun module. Créez votre premier module.' : 'Aucun résultat pour cette recherche.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((m) => (
            <div key={m.id} className="card">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                {/* Image */}
                <div className="relative flex-shrink-0">
                  {m.cover_image_url ? (
                    <img
                      src={`${BASE}${m.cover_image_url}`}
                      alt={m.title}
                      className="h-28 w-44 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex h-28 w-44 items-center justify-center rounded-lg bg-gray-100 text-gray-400">
                      <ImageIcon className="h-10 w-10" />
                    </div>
                  )}
                  <label className="absolute bottom-1 right-1 cursor-pointer rounded-full bg-white/90 p-1.5 text-alkher-600 shadow hover:bg-white">
                    <Upload className="h-3 w-3" />
                    <input
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={(e) => e.target.files[0] && uploadCoverFor(m.id, e.target.files[0])}
                    />
                  </label>
                </div>

                {/* Infos */}
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-lg">{m.title}</h3>
                      {m.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">{m.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                    <span className="badge bg-alkher-100 text-alkher-700">
                      {m.duration_weeks} sem.
                    </span>
                    <span className="badge bg-alkher-100 text-alkher-700">
                      {m.frequency_per_week}x/sem
                    </span>
                    <span className="badge bg-gray-100 text-gray-700">
                      <FileText className="mr-1 inline h-3 w-3" />
                      {m.total_sessions || 0} séances
                    </span>
                    <span className="badge bg-green-100 text-green-700">
                      <CheckCircle2 className="mr-1 inline h-3 w-3" />
                      {m.total_enrollments || 0} inscrites
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link
                      to={`/admin/modules/${m.id}/levels`}
                      className="inline-flex items-center gap-1 rounded-lg bg-purple-50 px-3 py-1.5 text-xs font-medium text-purple-700 hover:bg-purple-100"
                    >
                      <Layers className="h-3 w-3" />Niveaux
                    </Link>
                    <Link
                      to={`/admin/modules/${m.id}/sessions`}
                      className="inline-flex items-center gap-1 rounded-lg bg-alkher-50 px-3 py-1.5 text-xs font-medium text-alkher-700 hover:bg-alkher-100"
                    >
                      <FileText className="h-3 w-3" />Séances
                    </Link>
                    <button
                      onClick={() => edit(m)}
                      className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200"
                    >
                      <Edit className="h-3 w-3" />Modifier
                    </button>
                    <button
                      onClick={() => remove(m.id)}
                      className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100"
                    >
                      <Trash2 className="h-3 w-3" />Supprimer
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer info */}
      {state.items.length > 0 && (
        <p className="text-center text-xs text-gray-400">
          {state.items.length} module{state.items.length > 1 ? 's' : ''} au total
        </p>
      )}
    </div>
  );
}
