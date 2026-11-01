import { useState } from 'react';
import { Save } from 'lucide-react';
import api from '../../api/axios';
import { ENDPOINTS } from '../../api/endpoints';
import Drawer from './Drawer';
import FormField from '../FormField';
import Spinner from '../Spinner';
import Toast from '../Toast';

export default function SessionForm({ session, onClose, onSaved, onError }) {
  const [form, setForm] = useState({
    title: session.title || '',
    content: session.content || '',
    content_type: session.content_type || 'text',
    scheduled_date: session.scheduled_date || '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  async function submit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.put(ENDPOINTS.admin.session(session.id), form);
      setToast({ type: 'success', message: 'Séance mise à jour' });
      setTimeout(() => {
        onSaved?.();
        onClose();
      }, 600);
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.error || 'Erreur' });
      onError?.(err.response?.data?.error || 'Erreur');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Drawer open onClose={onClose} title={`Séance ${session.session_number} — ${session.title || ''}`} width="max-w-2xl">
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />

      <form onSubmit={submit}>
        <FormField label="Titre de la séance" required id="title">
          <input
            id="title"
            className="input-field"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
        </FormField>

        <div className="grid gap-3 md:grid-cols-2">
          <FormField label="Type de contenu">
            <select
              className="input-field"
              value={form.content_type}
              onChange={(e) => setForm({ ...form, content_type: e.target.value })}
            >
              <option value="text">Texte / HTML</option>
              <option value="video">Vidéo (URL iframe)</option>
              <option value="pdf">PDF (URL)</option>
            </select>
          </FormField>

          <FormField label="Date programmée" required id="scheduled_date">
            <input
              id="scheduled_date"
              type="date"
              className="input-field"
              value={form.scheduled_date}
              onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })}
              required
            />
          </FormField>
        </div>

        <FormField
          label="Contenu"
          id="content"
          hint={
            form.content_type === 'text'
              ? 'Texte libre ou HTML (balises simples supportées)'
              : form.content_type === 'video'
              ? 'URL iframe (YouTube embed, Vimeo, etc.)'
              : 'URL directe du fichier PDF'
          }
        >
          <textarea
            id="content"
            className="input-field min-h-[200px] font-mono text-xs"
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            placeholder={
              form.content_type === 'text'
                ? 'Contenu du cours...'
                : form.content_type === 'video'
                ? 'https://www.youtube.com/embed/xxxxx'
                : 'https://example.com/document.pdf'
            }
          />
        </FormField>

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-secondary">
            Annuler
          </button>
          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? <Spinner size="sm" className="mr-2 !border-white" /> : <Save className="mr-2 h-4 w-4" />}
            Enregistrer
          </button>
        </div>
      </form>
    </Drawer>
  );
}