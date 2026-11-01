import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { relativeTime } from '../utils/formatDate';

export default function NotificationBell() {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Fermer au clic extérieur
  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  async function handleClick(n) {
    if (!n.is_read) await markRead(n.id);
    setOpen(false);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-lg p-2 hover:bg-gray-100"
      >
        <Bell className="h-5 w-5 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-lg border border-gray-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b p-3">
            <span className="text-sm font-semibold">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-alkher-600 hover:underline"
              >
                Tout marquer lu
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="p-6 text-center text-sm text-gray-500">Aucune notification</p>
            ) : (
              notifications.slice(0, 10).map((n) => {
                const content = (
                  <div
                    className={`cursor-pointer border-b border-gray-100 p-3 transition hover:bg-gray-50 ${
                      !n.is_read ? 'bg-alkher-50/40' : ''
                    }`}
                    onClick={() => handleClick(n)}
                  >
                    <div className="flex items-start gap-2">
                      <span
                        className={`mt-1 h-2 w-2 flex-shrink-0 rounded-full ${
                          n.color === 'green' ? 'bg-green-500' :
                          n.color === 'red' ? 'bg-red-500' :
                          n.color === 'gold' ? 'bg-yellow-500' :
                          'bg-alkher-500'
                        }`}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900">{n.title}</p>
                        <p className="line-clamp-2 text-xs text-gray-600">{n.message}</p>
                        <p className="mt-1 text-[10px] text-gray-400">
                          {relativeTime(n.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                );

                if (n.action_url) {
                  return (
                    <Link key={n.id} to={n.action_url} onClick={() => handleClick(n)}>
                      {content}
                    </Link>
                  );
                }
                return <div key={n.id}>{content}</div>;
              })
            )}
          </div>

          <div className="border-t p-2 text-center">
            <Link
              to="/notifications"
              onClick={() => setOpen(false)}
              className="text-xs font-medium text-alkher-600 hover:underline"
            >
              Voir toutes les notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}