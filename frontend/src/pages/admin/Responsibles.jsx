import { useEffect, useState } from 'react';
import {
  ShieldCheck, Plus, Edit, Key, Pause, Play, Trash2, Activity,
  UserCog, Mail, Calendar, Copy, Check, X, Eye, EyeOff, RefreshCw,
} from 'lucide-react';
import api from '../../api/axios';
import { ENDPOINTS } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import DataTable from '../../components/admin/DataTable';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import Drawer from '../../components/admin/Drawer';
import Toast from '../../components/Toast';
import Spinner from '../../components/Spinner';
import FormField from '../../components/FormField';
import { formatDate, formatDateTime } from '../../utils/formatDate';

const ROLES = [
  { value: 'pedagogique', label: '📚 Pédagogique' },
  { value: 'inscriptions', label: '📝 Inscriptions' },
  { value: 'bourses', label: '💼 Bourses' },
  { value: 'support', label: '💬 Support' },
  { value: 'lecture', label: '👁️ Lecture seule' },
];

const ROLE_PERMISSIONS = {
  pedagogique: {
    modules: ['read', 'write'],
    sessions: ['read', 'write'],
    quizzes: ['read', 'write'],
    resources: ['read', 'write'],
    stats: ['read'],
  },
  inscriptions: {
    enrollments: ['read', 'validate', 'reject'],
    learners: ['read'],
    stats: ['read'],
  },
  bourses: {
    scholarships: ['read', 'write', 'review'],
    stats: ['read'],
  },
  support: {
    support: ['read', 'reply'],
    forum: ['read', 'moderate'],
    stats: ['read'],
  },
  lecture: {
    modules: ['read'],
    sessions: ['read'],
    enrollments: ['read'],
    learners: ['read'],
    scholarships: ['read'],
    stats: ['read'],
  },
};

export default function Responsibles() {
  const { isAdmin } = useAuth();
  const [state, setState] = useState({ loading: true, items: [] });
  const [toast, setToast] = useState(null);
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [passwordModal, setPasswordModal] = useState(null);   // { password, email, generated }

  if (!isAdmin) {
    return (
      <div className="card text-center">
        <ShieldCheck className="mx-auto mb-3 h-12 w-12 text-gray-400" />
        <p className="text-gray-600">Accès réservé aux super-admins.</p>
      </div>
    );
  }

  async function load() {
    setState((s) => ({ ...s, loading: true }));
    try {
      const { data } = await api.get(ENDPOINTS.admin.responsibles);
      setState({ loading: false, items: data.items || [] });
    } catch {
      setState({ loading: false, items: [] });
    }
  }

  useEffect(() => { load(); }, []);

  async function handleToggle(row) {
    setProcessing(true);
    try {
      await api.patch(ENDPOINTS.admin.responsibleToggle(row.id));
      setToast({ type: 'success', message: row.is_active ? 'Responsable désactivé' : 'Responsable réactivé' });
      setModal(null);
      await load();
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.error || 'Erreur' });
    } finally {
      setProcessing(false);
    }
  }

  async function handleDelete(row) {
    setProcessing(true);
    try {
      await api.delete(ENDPOINTS.admin.responsible(row.id));
      setToast({ type: 'success', message: 'Responsable supprimé' });
      setModal(null);
      await load();
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.error || 'Erreur' });
    } finally {
      setProcessing(false);
    }
  }

  async function handleReset(row) {
    setProcessing(true);
    try {
      const { data } = await api.post(ENDPOINTS.admin.responsibleReset(row.id));
      setModal(null);
      setPasswordModal({
        password: data.tempPassword,
        email: data.email,
        generated: true,
      });
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.error || 'Erreur' });
    } finally {
      setProcessing(false);
    }
  }

  const columns = [
    {
      key: 'full_name',
      label: 'Responsable',
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
            row.is_active ? 'bg-alkher-100 text-alkher-700' : 'bg-gray-100 text-gray-400'
          }`}>
            {row.full_name?.[0]?.toUpperCase()}
          </div>
          <div>
            <p className="font-medium">{row.full_name}</p>
            <p className="text-xs text-gray-500">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      label: 'Rôle',
      render: (row) => {
        const r = ROLES.find((x) => x.value === row.role);
        return <span className="badge bg-gray-100 text-gray-700">{r?.label || row.role}</span>;
      },
    },
    {
      key: 'is_active',
      label: 'Statut',
      render: (row) => (
        <span className={`badge ${row.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {row.is_active ? '✅ Actif' : '⛔ Inactif'}
        </span>
      ),
    },
    {
      key: 'last_login_at',
      label: 'Dernière connexion',
      render: (row) => row.last_login_at ? formatDateTime(row.last_login_at) : '—',
    },
  ];

  const actions = (row) => (
    <div className="flex justify-end gap-1">
      <button
        onClick={() => { setSelected(row); setModal('edit'); }}
        className="rounded-lg p-2 text-gray-600 hover:bg-gray-100"
        title="Modifier"
      >
        <Edit className="h-4 w-4" />
      </button>
      <button
        onClick={() => { setSelected(row); setModal('activity'); }}
        className="rounded-lg p-2 text-gray-600 hover:bg-gray-100"
        title="Activité"
      >
        <Activity className="h-4 w-4" />
      </button>
      <button
        onClick={() => { setSelected(row); setModal('reset'); }}
        className="rounded-lg p-2 text-yellow-600 hover:bg-yellow-50"
        title="Réinitialiser mot de passe"
      >
        <Key className="h-4 w-4" />
      </button>
      <button
        onClick={() => { setSelected(row); setModal('toggle'); }}
        className={`rounded-lg p-2 ${row.is_active ? 'text-orange-600 hover:bg-orange-50' : 'text-green-600 hover:bg-green-50'}`}
        title={row.is_active ? 'Désactiver' : 'Réactiver'}
      >
        {row.is_active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </button>
      <button
        onClick={() => { setSelected(row); setModal('delete'); }}
        className="rounded-lg p-2 text-red-600 hover:bg-red-50"
        title="Supprimer"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Responsables</h1>
          <p className="text-sm text-gray-500">
            Gérez les comptes sous-admins et leurs permissions
          </p>
        </div>
        <button onClick={() => setModal('create')} className="btn-primary">
          <Plus className="mr-2 h-4 w-4" />
          Nouveau responsable
        </button>
      </div>

      {state.loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : (
        <DataTable
          columns={columns}
          data={state.items}
          searchKeys={['full_name', 'email', 'role']}
          actions={actions}
          emptyMessage="Aucun responsable"
        />
      )}

      {/* Modal création/édition */}
      {(modal === 'create' || modal === 'edit') && (
        <ResponsibleForm
          initial={modal === 'edit' ? selected : null}
          onClose={() => setModal(null)}
          onSaved={(msg, password, email) => {
            setToast({ type: 'success', message: msg });
            setModal(null);
            if (password) {
              setPasswordModal({ password, email, generated: modal === 'create' });
            }
            load();
          }}
          onError={(msg) => setToast({ type: 'error', message: msg })}
        />
      )}

      {/* Modal activité */}
      {modal === 'activity' && selected && (
        <ActivityDrawer
          responsible={selected}
          onClose={() => setModal(null)}
        />
      )}

      {/* Modal affichage mot de passe */}
      {passwordModal && (
        <PasswordRevealModal
          password={passwordModal.password}
          email={passwordModal.email}
          generated={passwordModal.generated}
          onClose={() => setPasswordModal(null)}
        />
      )}

      {/* Confirmations */}
      <ConfirmDialog
        open={modal === 'reset'}
        title="Réinitialiser le mot de passe ?"
        message={`Un nouveau mot de passe temporaire sera généré pour ${selected?.full_name}.`}
        variant="warning"
        confirmLabel="Réinitialiser"
        loading={processing}
        onConfirm={() => handleReset(selected)}
        onCancel={() => setModal(null)}
      />
      <ConfirmDialog
        open={modal === 'toggle'}
        title={selected?.is_active ? 'Désactiver ce responsable ?' : 'Réactiver ce responsable ?'}
        message={selected?.is_active
          ? `${selected?.full_name} ne pourra plus se connecter.`
          : `${selected?.full_name} pourra à nouveau se connecter.`}
        variant={selected?.is_active ? 'danger' : 'primary'}
        loading={processing}
        onConfirm={() => handleToggle(selected)}
        onCancel={() => setModal(null)}
      />
      <ConfirmDialog
        open={modal === 'delete'}
        title="Supprimer définitivement ?"
        message={`${selected?.full_name} sera supprimé(e) de la plateforme. Cette action est irréversible.`}
        variant="danger"
        confirmLabel="Supprimer"
        loading={processing}
        onConfirm={() => handleDelete(selected)}
        onCancel={() => setModal(null)}
      />
    </div>
  );
}

// ═══════════════ FORMULAIRE (drawer avec mot de passe) ═══════════════
function ResponsibleForm({ initial, onClose, onSaved, onError }) {
  const isEdit = !!initial;
  const [form, setForm] = useState({
    full_name: initial?.full_name || '',
    email: initial?.email || '',
    password: '',
    role: initial?.role || 'pedagogique',
    permissions_json: initial?.permissions_json
      ? JSON.parse(initial.permissions_json)
      : ROLE_PERMISSIONS.pedagogique,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function changeRole(newRole) {
    setForm({
      ...form,
      role: newRole,
      permissions_json: ROLE_PERMISSIONS[newRole] || {},
    });
  }

  function togglePermission(resource, action) {
    const perms = { ...form.permissions_json };
    const list = perms[resource] || [];
    if (list.includes(action)) {
      perms[resource] = list.filter((a) => a !== action);
      if (perms[resource].length === 0) delete perms[resource];
    } else {
      perms[resource] = [...list, action];
    }
    setForm({ ...form, permissions_json: perms });
  }

  function generatePassword() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let pwd = '';
    for (let i = 0; i < 12; i++) pwd += chars[Math.floor(Math.random() * chars.length)];
    pwd += '@1';
    setForm((f) => ({ ...f, password: pwd }));
    setShowPassword(true);
  }

  async function submit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (isEdit) {
        const payload = {
          full_name: form.full_name,
          role: form.role,
          permissions_json: form.permissions_json,
          ...(form.password ? { password: form.password } : {}),
        };
        const { data } = await api.put(ENDPOINTS.admin.responsible(initial.id), payload);
        onSaved(
          form.password ? 'Responsable modifié (mot de passe changé)' : 'Responsable mis à jour',
          data.tempPassword || null,
          form.email
        );
      } else {
        if (!form.password || form.password.length < 8) {
          onError('Mot de passe requis (8 caractères minimum)');
          setSubmitting(false);
          return;
        }
        const { data } = await api.post(ENDPOINTS.admin.responsibles, {
          full_name: form.full_name,
          email: form.email,
          password: form.password,
          role: form.role,
          permissions_json: form.permissions_json,
        });
        onSaved(
          data.password_generated ? 'Responsable créé (mot de passe généré)' : 'Responsable créé',
          data.tempPassword,
          data.responsible.email
        );
      }
    } catch (err) {
      onError(err.response?.data?.error || 'Erreur');
    } finally {
      setSubmitting(false);
    }
  }

  const permissionGroups = {
    modules: 'Modules',
    sessions: 'Séances',
    quizzes: 'Quiz',
    enrollments: 'Inscriptions',
    learners: 'Apprenantes',
    scholarships: 'Bourses',
    support: 'Support',
    forum: 'Forum',
    resources: 'Ressources',
    stats: 'Statistiques',
  };

  const actionsByResource = {
    modules: ['read', 'write', 'delete'],
    sessions: ['read', 'write'],
    quizzes: ['read', 'write'],
    enrollments: ['read', 'validate', 'reject'],
    learners: ['read'],
    scholarships: ['read', 'write', 'review'],
    support: ['read', 'reply'],
    forum: ['read', 'moderate'],
    resources: ['read', 'write'],
    stats: ['read'],
  };

  return (
    <Drawer open onClose={onClose} title={isEdit ? 'Modifier le responsable' : 'Nouveau responsable'}>
      <form onSubmit={submit}>
        <FormField label="Nom complet" required id="full_name">
          <input
            id="full_name"
            className="input-field"
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            required
          />
        </FormField>

        <FormField label="Email" required id="email">
          <input
            id="email"
            type="email"
            className="input-field"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
            disabled={isEdit}
          />
        </FormField>

        {/* ✅ Mot de passe */}
        <FormField
          label={isEdit ? 'Nouveau mot de passe (optionnel)' : 'Mot de passe'}
          required={!isEdit}
          id="password"
          hint={isEdit
            ? 'Laisser vide pour conserver le mot de passe actuel'
            : 'Minimum 8 caractères. Vous pouvez aussi générer un mot de passe sécurisé.'}
        >
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              className="input-field pr-20"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required={!isEdit}
              minLength={isEdit ? 0 : 8}
              placeholder={isEdit ? 'Laisser vide pour ne pas changer' : 'Minimum 8 caractères'}
            />
            <div className="absolute right-1 top-1 flex gap-1">
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="rounded p-1.5 text-gray-500 hover:bg-gray-100"
                title={showPassword ? 'Masquer' : 'Afficher'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
              <button
                type="button"
                onClick={generatePassword}
                className="rounded p-1.5 text-alkher-600 hover:bg-alkher-50"
                title="Générer un mot de passe"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
          </div>
        </FormField>

        <FormField label="Rôle" required id="role">
          <select
            id="role"
            className="input-field"
            value={form.role}
            onChange={(e) => changeRole(e.target.value)}
          >
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </FormField>

        <div className="mt-6">
          <h3 className="mb-3 text-sm font-bold text-gray-900">Permissions</h3>
          <div className="space-y-3">
            {Object.entries(permissionGroups).map(([resource, label]) => {
              const actions = actionsByResource[resource] || [];
              const active = form.permissions_json[resource] || [];
              return (
                <div key={resource} className="rounded-lg border border-gray-200 p-3">
                  <p className="mb-2 text-xs font-medium text-gray-700">{label}</p>
                  <div className="flex flex-wrap gap-2">
                    {actions.map((action) => {
                      const checked = active.includes(action);
                      return (
                        <label
                          key={action}
                          className={`cursor-pointer rounded-full px-3 py-1 text-xs font-medium transition ${
                            checked
                              ? 'bg-alkher-600 text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          <input
                            type="checkbox"
                            hidden
                            checked={checked}
                            onChange={() => togglePermission(resource, action)}
                          />
                          {action}
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-secondary">
            Annuler
          </button>
          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? 'Enregistrement...' : (isEdit ? 'Enregistrer' : 'Créer')}
          </button>
        </div>
      </form>
    </Drawer>
  );
}

// ═══════════════ MODAL MOT DE PASSE ═══════════════
function PasswordRevealModal({ password, email, generated, onClose }) {
  const [copied, setCopied] = useState(false);

  function copyPassword() {
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function copyAll() {
    const text = `Email : ${email}\nMot de passe : ${password}\n\nConnectez-vous sur : ${window.location.origin}/admin/login`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
        <header className="flex items-center justify-between border-b border-green-200 bg-green-50 p-4">
          <h2 className="font-bold flex items-center gap-2 text-green-800">
            <Check className="h-5 w-5" />
            {generated ? 'Mot de passe généré' : 'Mot de passe défini'}
          </h2>
          <button onClick={onClose} className="rounded p-1 hover:bg-green-100">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="p-4 space-y-4">
          <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-3 text-sm text-yellow-900">
            ⚠️ <strong>Copiez ces informations maintenant.</strong> Le mot de passe ne sera plus affiché ensuite.
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Email</label>
            <div className="flex items-center gap-2 rounded-lg bg-gray-50 p-2">
              <Mail className="h-4 w-4 text-gray-500" />
              <code className="flex-1 text-sm">{email}</code>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Mot de passe</label>
            <div className="flex items-center gap-2 rounded-lg bg-gray-50 p-2">
              <Key className="h-4 w-4 text-gray-500" />
              <code className="flex-1 text-sm font-mono tracking-wider">{password}</code>
              <button
                onClick={copyPassword}
                className="rounded p-1.5 text-alkher-600 hover:bg-white"
                title="Copier le mot de passe"
              >
                {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="rounded-lg bg-alkher-50 p-3 text-xs text-alkher-800">
            <p className="mb-1 font-medium">📧 Instructions à communiquer :</p>
            <p>« Connectez-vous sur <strong>{window.location.origin}/admin/login</strong> avec votre email et ce mot de passe. Changez-le dès la première connexion. »</p>
          </div>
        </div>

        <footer className="flex gap-2 border-t p-4">
          <button onClick={copyAll} className="btn-secondary flex-1">
            {copied ? <><Check className="mr-2 h-4 w-4" />Copié !</> : <><Copy className="mr-2 h-4 w-4" />Copier tout</>}
          </button>
          <button onClick={onClose} className="btn-primary flex-1">
            J'ai noté
          </button>
        </footer>
      </div>
    </div>
  );
}

// ═══════════════ DRAWER ACTIVITÉ ═══════════════
function ActivityDrawer({ responsible, onClose }) {
  const [state, setState] = useState({ loading: true, items: [] });

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(ENDPOINTS.admin.responsibleActivity(responsible.id));
        setState({ loading: false, items: data.items || [] });
      } catch {
        setState({ loading: false, items: [] });
      }
    })();
  }, [responsible.id]);

  return (
    <Drawer open onClose={onClose} title={`Activité — ${responsible.full_name}`}>
      {state.loading ? (
        <div className="flex justify-center py-8"><Spinner /></div>
      ) : state.items.length === 0 ? (
        <p className="text-sm text-gray-500">Aucune activité enregistrée.</p>
      ) : (
        <div className="space-y-2">
          {state.items.map((a) => (
            <div key={a.id} className="rounded-lg border border-gray-200 p-3">
              <p className="text-sm font-medium">{a.action_type}</p>
              <p className="text-xs text-gray-500">
                {formatDateTime(a.created_at)}
                {a.target_type && ` · ${a.target_type} #${a.target_id}`}
              </p>
            </div>
          ))}
        </div>
      )}
    </Drawer>
  );
}
