import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, CheckCheck, Bell, Trash2 } from 'lucide-react';
import api from '../../api/axios';
import { ENDPOINTS } from '../../api/endpoints';
import { useNotifications } from '../../context/NotificationContext';
import EmptyState from '../../components/EmptyState';
import Toast from '../../components/Toast';
import { relativeTime } from '../../utils/formatDate';

export default function Notifications() {
  const { notifications, unreadCount, markRead, markAllRead, refresh } = useNotifications();
  const [toast, setToast] = useState(null);

  async function handleRead(n) {
    if (!n.is_read) await markRead(n.id);
  }

  async function handleDelete(id, e) {
    e.preventDefault();
    e.stopPropagation();
    try {
      await api.delete(`${ENDPOINTS.notifications}/${id}`);
      await refresh();
      setToast({ type: 'success', message: 'Notification supprimée' });
    } catch {
      setToast({ type: 'error', message: 'Erreur' });
    }
  }

  async function handleMarkAll() {
    await markAllRead();
    setToast({ type: 'success', message: 'Toutes marquées comme lues' });
  }

  return (
    <div className="space-y-4">
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Notifications</h1>
        {unreadCount > 0 && (
          <button onClick={handleMarkAll} className="btn-secondary text-xs">
            <CheckCheck className="mr-1 h-3 w-3" />
            Tout marquer lu
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="card">
          <EmptyState icon={Bell} title="Aucune notification" description="Vous serez alertée des nouveautés ici." />
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const Wrapper = n.action_url ? Link : 'div';
            const wrapperProps = n.action_url ? { to: n.action_url, onClick: () => handleRead(n) } : {};
            return (
              <Wrapper
                key={n.id}
                {...wrapperProps}
                className={`card flex items-start gap-3 transition ${
                  !n.is_read ? 'border-l-4 border-alkher-500' : ''
                }`}
              >
                <span
                  className={`mt-1.5 h-2.5 w-2.5 flex-shrink-0 rounded-full ${
                    n.color === 'green' ? 'bg-green-500' :
                    n.color === 'red' ? 'bg-red-500' :
                    n.color === 'gold' ? 'bg-yellow-500' :
                    'bg-alkher-500'
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900">{n.title}</p>
                  <p className="mt-0.5 text-sm text-gray-600">{n.message}</p>
                  <p className="mt-1 text-xs text-gray-400">{relativeTime(n.created_at)}</p>
                </div>
                <div className="flex items-center gap-1">
                  {!n.is_read && (
                    <button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleRead(n); }}
                      className="rounded-full p-1.5 text-alkher-600 hover:bg-alkher-50"
                      title="Marquer comme lu"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={(e) => handleDelete(n.id, e)}
                    className="rounded-full p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                    title="Supprimer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </Wrapper>
            );
          })}
        </div>
      )}
    </div>
  );
}