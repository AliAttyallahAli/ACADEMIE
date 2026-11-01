import { useState } from 'react';
import Drawer from './Drawer';
import FormField from '../FormField';

export default function ModuleForm({ initial, onClose, onSaved, onError }) {
  const isEdit = !!initial;
  const [form, setForm] = useState({
    title: initial?.title || '',
    description: initial?.description || '',
    cover_image_url: initial?.cover_image_url || '',
    duration_weeks: initial?.duration_weeks || 4,
    frequency_per_week: initial?.frequency_per_week || 2,
    start_date: new Date().toISOString().split('T')[0],
  });
  const [submitting, setSubmitting] = useState(false);

  const totalSessions = (form.duration_weeks || 0) * (form.frequency_per_week || 0);

  async function submit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (isEdit) {
        // On ne renvoie pas start_date en update (les séances existent déjà)
        const { start_date, ...updates } = form;
        const { data } = await api.put(ENDPOINTS.admin.module(initial.id), updates);
        onSaved('Module modifié', data.module);
      } else {
        const { data } = await api.post(ENDPOINTS.admin.modules, form);
        onSaved(
          `Module créé avec ${data.module.total_sessions} séances`,
          data.module
        );
      }
    } catch (err) {
      onError(err.response?.data?.error || 'Erreur');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Drawer open onClose={onClose} title={isEdit ? 'Modifier le module' : 'Nouveau module'}>
      <form onSubmit={submit}>
        <FormField label="Titre" required id="title">
          <input
            id="title"
            className="input-field"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
            minLength={3}
            maxLength={150}
            placeholder="Ex : Bureautique niveau 1"
          />
        </FormField>

        <FormField label="Description" id="description">
          <textarea
            id="description"
            className="input-field min-h-[100px]"
            maxLength={2000}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Programme, objectifs, prérequis..."
          />
        </FormField>

        <FormField label="URL image de couverture" id="cover_image_url" hint="Lien vers une image (JPG, PNG)">
          <input
            id="cover_image_url"
            type="url"
            className="input-field"
            value={form.cover_image_url}
            onChange={(e) => setForm({ ...form, cover_image_url: e.target.value })}
            placeholder="https://exemple.com/image.jpg"
          />
        </FormField>

        <div className="grid gap-3 md:grid-cols-2">
          <FormField label="Durée (semaines)" required id="duration_weeks">
            <input
              id="duration_weeks"
              type="number"
              min={1}
              max={104}
              className="input-field"
              value={form.duration_weeks}
              onChange={(e) => setForm({ ...form, duration_weeks: Number(e.target.value) })}
              required
            />
          </FormField>

          <FormField label="Fréquence (x/semaine)" required id="frequency_per_week">
            <input
              id="frequency_per_week"
              type="number"
              min={1}
              max={7}
              className="input-field"
              value={form.frequency_per_week}
              onChange={(e) => setForm({ ...form, frequency_per_week: Number(e.target.value) })}
              required
            />
          </FormField>
        </div>

        {!isEdit && (
          <FormField
            label="Date de début (référence)"
            required
            id="start_date"
            hint="Utilisée pour calculer les dates des séances. L'apprenante aura sa propre date de début à l'inscription."
          >
            <input
              id="start_date"
              type="date"
              className="input-field"
              value={form.start_date}
              onChange={(e) => setForm({ ...form, start_date: e.target.value })}
              required
            />
          </FormField>
        )}

        {/* Aperçu total séances */}
        <div className="my-4 rounded-lg bg-alkher-50 p-3 text-sm">
          <p className="font-medium text-alkher-900">
            📊 {totalSessions} séance{totalSessions > 1 ? 's' : ''} seront générées
          </p>
          <p className="mt-1 text-xs text-alkher-700">
            {form.duration_weeks} semaine{form.duration_weeks > 1 ? 's' : ''} × {form.frequency_per_week} fois/semaine
          </p>
        </div>

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-secondary">
            Annuler
          </button>
          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? 'Enregistrement...' : (isEdit ? 'Enregistrer' : 'Créer le module')}
          </button>
        </div>
      </form>
    </Drawer>
  );
}

// ⚠️ Ajout de l'import manquant
import api from '../../api/axios';
import { ENDPOINTS } from '../../api/endpoints';