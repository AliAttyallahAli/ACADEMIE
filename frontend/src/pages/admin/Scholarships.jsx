import { useEffect, useState, useRef } from 'react';
import { Plus, Send, XCircle, Trash2, Briefcase, Image as ImageIcon, Upload, X } from 'lucide-react';
import api from '../../api/axios';
import { ENDPOINTS } from '../../api/endpoints';
import Toast from '../../components/Toast';
import Spinner from '../../components/Spinner';
import { formatDate } from '../../utils/formatDate';

const BASE = import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000';

const TYPES = { formation: 'Formation', recherche: 'Recherche', stage: 'Stage', autre: 'Autre' };

export default function AdminScholarships() {
  const [state, setState] = useState({ loading: true, items: [] });
  const [toast, setToast] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: 'formation', title: '', description: '', organization: '', amount: '', closing_date: '' });
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef();

  async function load() {
    setState((s) => ({ ...s, loading: true }));
    try {
      const { data } = await api.get(ENDPOINTS.admin.scholarships);
      setState({ loading: false, items: data.items || [] });
    } catch {
      setState({ loading: false, items: [] });
    }
  }

  useEffect(() => { load(); }, []);

  function handleCoverChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  }

  async function submit(e) {
    e.preventDefault();
    if (!form.title || form.title.trim().length < 3) {
      setToast({ type: 'error', message: 'Titre : 3 caractères minimum' });
      return;
    }
    setSaving(true);
    try {
      // 1. Créer la bourse
      const { data } = await api.post(ENDPOINTS.admin.scholarships, form);
      const scholarshipId = data.scholarship.id;

      // 2. Uploader la cover si présente
      if (coverFile) {
        const fd = new FormData();
        fd.append('cover', coverFile);
        await api.post(ENDPOINTS.admin.scholarshipCover(scholarshipId), fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      setToast({ type: 'success', message: 'Bourse créée (brouillon)' });
      setShowForm(false);
      setForm({ type: 'formation', title: '', description: '', organization: '', amount: '', closing_date: '' });
      setCoverFile(null);
      setCoverPreview(null);
      await load();
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.error || 'Erreur' });
    } finally {
      setSaving(false);
    }
  }

  async function uploadCoverFor(id, file) {
    const fd = new FormData();
    fd.append('cover', file);
    try {
      await api.post(ENDPOINTS.admin.scholarshipCover(id), fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setToast({ type: 'success', message: 'Image mise à jour' });
      await load();
    } catch {
      setToast({ type: 'error', message: 'Erreur upload' });
    }
  }

  async function publish(id) {
    try {
      await api.post(ENDPOINTS.admin.scholarshipPublish(id));
      setToast({ type: 'success', message: 'Bourse publiée' });
      await load();
    } catch {
      setToast({ type: 'error', message: 'Erreur' });
    }
  }

  async function close(id) {
    try {
      await api.post(ENDPOINTS.admin.scholarshipClose(id));
      setToast({ type: 'success', message: 'Bourse clôturée' });
      await load();
    } catch {
      setToast({ type: 'error', message: 'Erreur' });
    }
  }

  async function remove(id) {
    if (!confirm('Supprimer cette bourse ?')) return;
    try {
      await api.delete(ENDPOINTS.admin.scholarship(id));
      setToast({ type: 'success', message: 'Bourse supprimée' });
      await load();
    } catch {
      setToast({ type: 'error', message: 'Erreur' });
    }
  }

  if (state.loading) return <div className="flex min-h-[60vh] items-center justify-center"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Bourses</h1>
          <p className="text-sm text-gray-500">Publiez et gérez les opportunités</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          <Plus className="mr-2 h-4 w-4" />Nouvelle bourse
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="card">
          <h2 className="mb-3 font-bold">Nouvelle bourse</h2>

          {/* Upload image */}
          <div className="mb-3">
            <label className="mb-1 block text-sm font-medium">Image de couverture (optionnel)</label>
            <div className="flex items-center gap-3">
              {coverPreview ? (
                <div className="relative">
                  <img src={coverPreview} alt="" className="h-24 w-40 rounded-lg object-cover" />
                  <button type="button" onClick={() => { setCoverFile(null); setCoverPreview(null); }}
                    className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <button type="button" onClick={() => fileRef.current.click()}
                  className="flex h-24 w-40 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 text-gray-400 hover:border-alkher-400 hover:text-alkher-600">
                  <ImageIcon className="h-8 w-8" />
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleCoverChange} />
              <div className="text-xs text-gray-500">
                <p>JPG, PNG · max 5 Mo</p>
                <p>Recadrée en 800×400</p>
              </div>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Type</label>
              <select className="input-field" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {Object.entries(TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Organisme</label>
              <input className="input-field" value={form.organization} onChange={(e) => setForm({ ...form, organization: e.target.value })} placeholder="Ex : ALKHER Foundation" />
            </div>
          </div>
          <div className="my-3">
            <label className="mb-1 block text-sm font-medium">Titre *</label>
            <input required className="input-field" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="mb-3">
            <label className="mb-1 block text-sm font-medium">Description</label>
            <textarea className="input-field min-h-[60px]" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Montant</label>
              <input className="input-field" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="500 000 XAF" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Clôture</label>
              <input type="date" className="input-field" value={form.closing_date} onChange={(e) => setForm({ ...form, closing_date: e.target.value })} />
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={() => { setShowForm(false); setCoverPreview(null); setCoverFile(null); }} className="btn-secondary">Annuler</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Enregistrement...' : 'Créer'}</button>
          </div>
        </form>
      )}

      {state.items.length === 0 ? (
        <div className="card text-center py-8">
          <Briefcase className="mx-auto mb-3 h-10 w-10 text-gray-400" />
          <p className="text-gray-500">Aucune bourse</p>
        </div>
      ) : (
        <div className="space-y-3">
          {state.items.map((s) => (
            <div key={s.id} className="card flex items-center gap-4">
              {s.cover_image_url ? (
                <img src={`${BASE}${s.cover_image_url}`} alt="" className="h-20 w-32 flex-shrink-0 rounded-lg object-cover" />
              ) : (
                <div className="flex h-20 w-32 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-400">
                  <Briefcase className="h-8 w-8" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-medium">{s.title}</p>
                <p className="text-xs text-gray-500">
                  {s.organization} · {s.applications_count || 0} candidature{s.applications_count > 1 ? 's' : ''}
                  {s.closing_date && ` · clôture le ${formatDate(s.closing_date)}`}
                </p>
                <span className={`badge mt-1 ${s.status === 'published' ? 'bg-green-100 text-green-700' : s.status === 'closed' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                  {s.status}
                </span>
              </div>
              <label className="cursor-pointer rounded-lg p-2 text-alkher-600 hover:bg-alkher-50" title="Changer l'image">
                <Upload className="h-4 w-4" />
                <input type="file" accept="image/*" hidden onChange={(e) => e.target.files[0] && uploadCoverFor(s.id, e.target.files[0])} />
              </label>
              {s.status === 'draft' && (
                <button onClick={() => publish(s.id)} className="rounded-lg p-2 text-green-600 hover:bg-green-50" title="Publier">
                  <Send className="h-4 w-4" />
                </button>
              )}
              {s.status === 'published' && (
                <button onClick={() => close(s.id)} className="rounded-lg p-2 text-orange-600 hover:bg-orange-50" title="Clôturer">
                  <XCircle className="h-4 w-4" />
                </button>
              )}
              <button onClick={() => remove(s.id)} className="rounded-lg p-2 text-red-600 hover:bg-red-50" title="Supprimer">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
