import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/axios';
import { ENDPOINTS } from '../api/endpoints';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('alkher_user') || 'null');
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(localStorage.getItem('alkher_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function restore() {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await api.get(ENDPOINTS.auth.me);
        setUser(data.user);
        localStorage.setItem('alkher_user', JSON.stringify(data.user));
      } catch {
        localStorage.removeItem('alkher_token');
        localStorage.removeItem('alkher_user');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    restore();
  }, []); // eslint-disable-line

  function persist({ user, token }) {
    localStorage.setItem('alkher_token', token);
    localStorage.setItem('alkher_user', JSON.stringify(user));
    setToken(token);
    setUser(user);
  }

  async function loginLearner(email, password) {
    const { data } = await api.post(ENDPOINTS.auth.login, { email, password });
    persist(data);
    return data;
  }

  async function loginAdmin(email, password) {
    const { data } = await api.post(ENDPOINTS.auth.adminLogin, { email, password });
    const u = { ...data.user, type: data.user.type || 'admin' };
    persist({ user: u, token: data.token });
    return data;
  }

  async function loginResponsible(email, password) {
    const { data } = await api.post(ENDPOINTS.auth.responsibleLogin, { email, password });
    const u = { ...data.user, type: data.user.type || 'responsible' };
    persist({ user: u, token: data.token });
    return data;
  }

  async function register(payload) {
    const { data } = await api.post(ENDPOINTS.auth.register, payload);
    const u = { ...data.user, type: data.user.type || 'learner' };
    persist({ user: u, token: data.token });
    return data;
  }

  function logout() {
    localStorage.removeItem('alkher_token');
    localStorage.removeItem('alkher_user');
    setToken(null);
    setUser(null);
  }

  /**
   * Vérifie une permission.
   * - admin → toujours true
   * - responsible → vérifie dans permissions_json
   * - learner → false pour les ressources admin
   */
  function hasPermission(resource, action) {
    if (!user) return false;
    if (user.type === 'admin') return true;
    if (user.type !== 'responsible') return false;
    try {
      const perms = typeof user.permissions_json === 'string'
        ? JSON.parse(user.permissions_json)
        : (user.permissions_json || {});
      return Array.isArray(perms[resource]) && perms[resource].includes(action);
    } catch {
      return false;
    }
  }

  /** Vérifie qu'au moins une permission existe dans la ressource. */
  function hasAnyPermission(resource) {
    if (!user) return false;
    if (user.type === 'admin') return true;
    if (user.type !== 'responsible') return false;
    try {
      const perms = typeof user.permissions_json === 'string'
        ? JSON.parse(user.permissions_json)
        : (user.permissions_json || {});
      return Array.isArray(perms[resource]) && perms[resource].length > 0;
    } catch {
      return false;
    }
  }

  /** Retourne les permissions parsées. */
  function getPermissions() {
    if (!user) return {};
    if (user.type === 'admin') return { all: true };
    try {
      return typeof user.permissions_json === 'string'
        ? JSON.parse(user.permissions_json)
        : (user.permissions_json || {});
    } catch {
      return {};
    }
  }

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user && !!token,
    isLearner: user?.type === 'learner',
    isAdmin: user?.type === 'admin',
    isResponsible: user?.type === 'responsible',
    loginLearner,
    loginAdmin,
    loginResponsible,
    register,
    logout,
    hasPermission,
    hasAnyPermission,
    getPermissions,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans <AuthProvider>');
  return ctx;
}
