import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Plus, Edit, Trash2, Layers, FileText, BookOpen, X,
} from 'lucide-react';
import api from '../../api/axios';
import { ENDPOINTS } from '../../api/endpoints';
import Toast from '../../components/Toast';
import Spinner from '../../components/Spinner';

export default function ModuleLevels() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [state, setState] = useState({ loading: true, module: null, levels: [] });
  const [toast, setToast] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', description: '' });
  const [saving, setSaving] = useState(false);

  async function load() {
    setState((s) => ({ ...s, loading: true }));
    try {
      const { data } = await api.get(ENDPOINTS.admin.levelsByModule(id));
      setState({ loading: false, module: data.module, levels: data.levels || [] });
    } catch {
      setState({ loading: false, module: null, levels: [] });
    }
  }

  useEffect(() => { load(); }, [id]);

  async function submit(e) {
    e.preventDefault();
    if (!form.title || form.title.trim().length < 2) {
      setToast({ type: 'error', message: 'Titre requis (min 2 caractères)' });
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await api.put(ENDPOINTS.admin.level(editing.id), form);
        setToast({ type: 'success', message: 'Niveau mis à jour' });
      } else {
        await api.post(ENDPOINTS.admin.levelCreate(id), form);
        setToast({ type: 'success', message: 'Niveau créé' });
      }
      setShowForm(false);
      setEditing(null);
      setForm({ title: '', description: '' });
      await load();
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.error || 'Erreur' });
    } finally {
      setSaving(false);
    }
  }

  async function remove(levelId) {
    if (!confirm('Supprimer ce niveau ?')) return;
    try {
      await api.delete(ENDPOINTS.admin.level(levelId));
      setToast({ type: 'success', message: 'Niveau supprimé' });
      await load();
    } catch {
      setToast({ type: 'error', message: 'Erreur' });
    }
  }

  function edit(level) {
    setEditing(level);
    setForm({ title: level.title, description: level.description || '' });
    setShowForm(true);
  }

  if (state.loading) return <div className="flex min-h-[60vh] items-center justify-center"><Spinner size="lg" /></div>;

  if (!state.module) return <div className="card"><p className="text-red-600">Module introuvable</p></div>;

  return (
    <div className="space-y-6">
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />

      <button onClick={() => navigate('/admin/modules')} className="inline-flex items-center gap-1 text-sm text-alkher-600 hover:underline">
        <ArrowLeft className="h-4 w-4" />Retour aux modules
      </button>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Layers className="h-6 w-6 text-alkher-600" />
            Niveaux — {state.module.title}
          </h1>
          <p className="text-sm text-gray-500">
            {state.levels.length} niveau{state.levels.length > 1 ? 'x' : ''} · chaque niveau contient ses propres séances
          </p>
        </div>
        <button onClick={() => { setEditing(null); setForm({ title: '', description: '' }); setShowForm(true); }} className="btn-primary">
          <Plus className="mr-2 h-4 w-4" />Nouveau niveau
        </button>
      </div>

      {/* Formulaire */}
      {showForm && (
        <form onSubmit={submit} className="card">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-bold">{editing ? 'Modifier le niveau' : 'Nouveau niveau'}</h2>
            <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} className="rounded p-1 hover:bg-gray-100">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="mb-3">
            <label className="mb-1 block text-sm font-medium">Titre *</label>
            <input
              required
              className="input-field"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Ex : Débutant, Intermédiaire, Avancé..."
            />
          </div>
          <div className="mb-3">
            <label className="mb-1 block text-sm font-medium">Description</label>
            <textarea
              className="input-field min-h-[60px]"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Ce que l'apprenante va apprendre dans ce niveau..."
            />
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} className="btn-secondary">
              Annuler
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Enregistrement...' : (editing ? 'Enregistrer' : 'Créer')}
            </button>
          </div>
        </form>
      )}

      {/* Liste des niveaux */}
      {state.levels.length === 0 ? (
        <div className="card text-center py-8">
          <Layers className="mx-auto mb-3 h-10 w-10 text-gray-400" />
          <p className="text-gray-500">Aucun niveau. Créez votre premier niveau.</p>
          <p className="text-xs text-gray-400 mt-1">Ex : Débutant, Intermédiaire, Avancé</p>
        </div>
      ) : (
        <div className="space-y-2">
          {state.levels.map((level) => (
            <div key={level.id} className="card">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-alkher-100 text-sm font-bold text-alkher-700">
                  {level.level_number}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{level.title}</p>
                  {level.description && (
                    <p className="mt-1 text-sm text-gray-600">{level.description}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    <FileText className="mr-1 inline h-3 w-3" />
                    {level.total_sessions || 0} séance{(level.total_sessions || 0) > 1 ? 's' : ''}
                  </p>
                </div>
                <Link
                  to={`/admin/modules/${id}/levels/${level.id}/sessions`}
                  className="rounded-lg bg-alkher-50 px-3 py-2 text-xs font-medium text-alkher-700 hover:bg-alkher-100"
                >
                  <BookOpen className="mr-1 inline h-3 w-3" />
                  Séances
                </Link>
                <button
                  onClick={() => edit(level)}
                  className="rounded-lg p-2 text-gray-600 hover:bg-gray-100"
                  title="Modifier"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => remove(level.id)}
                  className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                  title="Supprimer"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
