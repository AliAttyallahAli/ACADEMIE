import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Protection de route :
 * @param {Array} roles - Rôles autorisés (['admin', 'responsible'])
 * @param {string} resource - (optionnel) ressource à vérifier
 * @param {string} action - (optionnel) action à vérifier
 */
export default function ProtectedRoute({ children, roles, resource, action }) {
  const { isAuthenticated, user, loading, hasPermission } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-alkher-500 border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Vérifier le rôle
  if (roles && !roles.includes(user?.type)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Vérifier la permission granulaire (si demandée)
  if (resource && action && !hasPermission(resource, action)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}
