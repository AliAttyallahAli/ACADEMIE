import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Plus, Edit, Trash2, FileQuestion, Upload, FileText,
  Video, Image as ImageIcon, Play, Save, X, CheckCircle2, AlertCircle,
} from 'lucide-react';
import api from '../../api/axios';
import { ENDPOINTS } from '../../api/endpoints';
import Toast from '../../components/Toast';
import Spinner from '../../components/Spinner';
import { formatDate } from '../../utils/formatDate';

const BASE = import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000';

export default function ModuleSessions() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [state, setState] = useState({ loading: true, module: null, sessions: [] });
  const [toast, setToast] = useState(null);
  const [editing, setEditing] = useState(null);

  async function load() {
    setState((s) => ({ ...s, loading: true }));
    try {
      const { data } = await api.get(ENDPOINTS.admin.sessionsByModule(id));
      setState({ loading: false, module: data.module, sessions: data.sessions || [] });
    } catch {
      setState({ loading: false, module: null, sessions: [] });
    }
  }

  useEffect(() => { load(); }, [id]);

  async function addSession() {
    try {
      const { data } = await api.post(ENDPOINTS.admin.sessionCreate(id), {
        title: `Séance ${state.sessions.length + 1}`,
        scheduled_date: new Date().toISOString().split('T')[0],
      });
      setToast({ type: 'success', message: 'Séance ajoutée' });
      await load();
      setEditing(data.session);
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.error || 'Erreur' });
    }
  }

  async function removeSession(sessionId) {
    if (!confirm('Supprimer cette séance ?')) return;
    try {
      await api.delete(ENDPOINTS.admin.session(sessionId));
      setToast({ type: 'success', message: 'Séance supprimée' });
      await load();
    } catch {
      setToast({ type: 'error', message: 'Erreur' });
    }
  }

  if (state.loading) return <div className="flex min-h-[60vh] items-center justify-center"><Spinner size="lg" /></div>;

  if (!state.module) {
    return <div className="card"><p className="text-red-600">Module introuvable</p></div>;
  }

  return (
    <div className="space-y-6">
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />

      <button onClick={() => navigate('/admin/modules')} className="inline-flex items-center gap-1 text-sm text-alkher-600 hover:underline">
        <ArrowLeft className="h-4 w-4" />Retour aux modules
      </button>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{state.module.title}</h1>
          <p className="text-sm text-gray-500">
            {state.sessions.length} séance{state.sessions.length > 1 ? 's' : ''} · Cliquez sur une séance pour éditer le contenu
          </p>
        </div>
        <button onClick={addSession} className="btn-primary">
          <Plus className="mr-2 h-4 w-4" />Ajouter une séance
        </button>
      </div>

      {state.sessions.length === 0 ? (
        <div className="card text-center py-8">
          <FileText className="mx-auto mb-3 h-10 w-10 text-gray-400" />
          <p className="text-gray-500">Aucune séance. Cliquez sur "Ajouter une séance".</p>
        </div>
      ) : (
        <div className="space-y-2">
          {state.sessions.map((s) => (
            <div key={s.id} className="card flex items-center gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-alkher-100 text-sm font-bold text-alkher-700">
                {s.session_number}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium">{s.title || `Séance ${s.session_number}`}</p>
                <div className="mt-1 flex flex-wrap gap-3 text-xs text-gray-500">
                  <span>📅 {formatDate(s.scheduled_date)}</span>
                  {s.content ? (
                    <span className="text-green-600">
                      ✅ {s.content_type === 'pdf' ? 'PDF' : s.content_type === 'video' ? 'Vidéo' : s.content_type === 'image' ? 'Image' : 'Contenu'}
                    </span>
                  ) : (
                    <span className="text-yellow-600">⚠️ Sans contenu</span>
                  )}
                  {s.quiz_id ? (
                    <span className="text-green-600">📝 Quiz actif</span>
                  ) : (
                    <span className="text-gray-400">📝 Sans quiz</span>
                  )}
                </div>
              </div>
              <button onClick={() => setEditing(s)} className="rounded-lg p-2 text-alkher-600 hover:bg-alkher-50" title="Éditer">
                <Edit className="h-4 w-4" />
              </button>
              <Link
                to={`/admin/modules/${id}/sessions/${s.id}/quiz`}
                className="rounded-lg p-2 text-purple-600 hover:bg-purple-50"
                title="Éditer le quiz"
              >
                <FileQuestion className="h-4 w-4" />
              </Link>
              <button onClick={() => removeSession(s.id)} className="rounded-lg p-2 text-red-600 hover:bg-red-50" title="Supprimer">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <SessionEditor
          session={editing}
          onClose={() => setEditing(null)}
          onSaved={async (msg) => {
            setToast({ type: 'success', message: msg });
            setEditing(null);
            await load();
          }}
          onError={(msg) => setToast({ type: 'error', message: msg })}
        />
      )}
    </div>
  );
}

function SessionEditor({ session, onClose, onSaved, onError }) {
  const [form, setForm] = useState({
    title: session.title || '',
    content: session.content || '',
    content_type: session.content_type || 'text',
    scheduled_date: session.scheduled_date || '',
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  async function save() {
    setSaving(true);
    try {
      await api.put(ENDPOINTS.admin.session(session.id), form);
      onSaved('Séance mise à jour');
    } catch (err) {
      onError(err.response?.data?.error || 'Erreur');
    } finally {
      setSaving(false);
    }
  }

  async function uploadFile(file) {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const { data } = await api.post(ENDPOINTS.admin.sessionUpload(session.id), fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setForm((f) => ({
        ...f,
        content: data.session.content,
        content_type: data.session.content_type,
      }));
      onError(null);
    } catch (err) {
      onError(err.response?.data?.error || 'Erreur upload');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
      <aside className="flex h-full w-full max-w-2xl flex-col bg-white shadow-xl">
        <header className="flex items-center justify-between border-b p-4">
          <h2 className="font-bold">Éditer — {session.title}</h2>
          <button onClick={onClose} className="rounded p-1 hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Titre *</label>
            <input
              className="input-field"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Type de contenu</label>
              <select
                className="input-field"
                value={form.content_type}
                onChange={(e) => setForm({ ...form, content_type: e.target.value })}
              >
                <option value="text">Texte / HTML</option>
                <option value="video">Vidéo (URL)</option>
                <option value="pdf">PDF (URL ou fichier)</option>
                <option value="image">Image</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Date programmée</label>
              <input
                type="date"
                className="input-field"
                value={form.scheduled_date}
                onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })}
              />
            </div>
          </div>

          {/* Upload fichier */}
          <div className="rounded-lg border-2 border-dashed border-gray-300 p-4 text-center">
            <p className="mb-2 text-sm text-gray-600">Ou uploadez un fichier (PDF, vidéo, image)</p>
            <button
              type="button"
              onClick={() => fileRef.current.click()}
              disabled={uploading}
              className="btn-secondary text-xs"
            >
              {uploading ? <Spinner size="sm" className="mr-2" /> : <Upload className="mr-2 h-3 w-3" />}
              {uploading ? 'Upload en cours...' : 'Choisir un fichier'}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,video/*,image/*"
              hidden
              onChange={(e) => uploadFile(e.target.files[0])}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Contenu {form.content_type === 'video' ? '(URL iframe YouTube/Vimeo)' : form.content_type === 'text' ? '(texte ou HTML)' : '(URL du fichier)'}
            </label>
            <textarea
              className="input-field min-h-[200px] font-mono text-xs"
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder={
                form.content_type === 'text' ? 'Contenu du cours...' :
                form.content_type === 'video' ? 'https://www.youtube.com/embed/xxxxx' :
                'URL ou upload'
              }
            />
          </div>
        </div>

        <footer className="flex justify-end gap-2 border-t p-4">
          <button onClick={onClose} className="btn-secondary">Annuler</button>
          <button onClick={save} disabled={saving || uploading} className="btn-primary">
            {saving ? <Spinner size="sm" className="mr-2 !border-white" /> : <Save className="mr-2 h-4 w-4" />}
            Enregistrer
          </button>
        </footer>
      </aside>
    </div>
  );
}
