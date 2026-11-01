import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import api from '../api/axios';
import { ENDPOINTS } from '../api/endpoints';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { user, isLearner } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const socketRef = useRef(null);

  // Charger les notifications initiales
  useEffect(() => {
    if (!isLearner) return;
    (async () => {
      try {
        const { data } = await api.get(ENDPOINTS.notifications, {
          params: { limit: 20 },
        });
        setNotifications(data.items);
        setUnreadCount(data.unread_count);
      } catch (e) {
        console.error('Erreur chargement notifications', e);
      }
    })();
  }, [isLearner]);

  // Socket.IO temps réel
  useEffect(() => {
    if (!isLearner || !user) return;

    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000';
    const socket = io(socketUrl, { transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join', { type: 'learner', id: user.id });
    });

    socket.on('notification', (notif) => {
      setNotifications((prev) => [notif, ...prev].slice(0, 20));
      setUnreadCount((c) => c + 1);
      // Petit toast optionnel
      if (window.Notification && Notification.permission === 'granted') {
        new Notification(notif.title, { body: notif.message });
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isLearner, user]);

  async function markRead(id) {
    await api.post(ENDPOINTS.notificationRead(id));
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  }

  async function markAllRead() {
    await api.post(ENDPOINTS.notificationsReadAll);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
    setUnreadCount(0);
  }

  async function refresh() {
    const { data } = await api.get(ENDPOINTS.notifications, { params: { limit: 20 } });
    setNotifications(data.items);
    setUnreadCount(data.unread_count);
  }

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markRead,
        markAllRead,
        refresh,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications doit être dans <NotificationProvider>');
  return ctx;
}