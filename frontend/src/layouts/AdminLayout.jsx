import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard, BookOpen, Users, FileCheck, GraduationCap,
  Briefcase, ShieldCheck, BarChart3, LogOut, Search, Bell,
  AlertTriangle, LifeBuoy, MessageSquare, Menu, X, UserCog,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import useDeviceType from '../hooks/useDeviceType';

/**
 * Chaque item déclare la permission requise.
 * - adminOnly: true → réservé aux super-admins
 * - resource + action → vérifié pour les responsables
 * - pas de resource → accessible à tous les connectés admin/responsible
 */
const NAV_ITEMS = [
  {
    to: '/admin/dashboard',
    label: 'Tableau de bord',
    icon: LayoutDashboard,
    resource: 'stats',
    action: 'read',
  },
  {
    to: '/admin/modules',
    label: 'Modules',
    icon: BookOpen,
    resource: 'modules',
    action: 'read',
  },
  {
    to: '/admin/learners',
    label: 'Apprenantes',
    icon: Users,
    resource: 'learners',
    action: 'read',
  },
  {
    to: '/admin/enrollments',
    label: 'Inscriptions',
    icon: FileCheck,
    resource: 'enrollments',
    action: 'read',
  },
  {
    to: '/admin/scholarships',
    label: 'Bourses',
    icon: Briefcase,
    resource: 'scholarships',
    action: 'read',
  },
  {
    to: '/admin/applications',
    label: 'Demandes de bourse',
    icon: FileCheck,
    resource: 'scholarships',
    action: 'read',
  },
  {
    to: '/admin/forum',
    label: 'Forum',
    icon: MessageSquare,
    resource: 'forum',
    action: 'read',
  },
  {
    to: '/admin/support',
    label: 'Support',
    icon: LifeBuoy,
    resource: 'support',
    action: 'read',
  },
  {
    to: '/admin/responsibles',
    label: 'Responsables',
    icon: ShieldCheck,
    adminOnly: true,
  },
  {
    to: '/admin/audit-log',
    label: "Journal d'audit",
    icon: BarChart3,
    adminOnly: true,
  },
];

const ROLE_LABELS = {
  pedagogique: 'Pédagogique',
  inscriptions: 'Inscriptions',
  bourses: 'Bourses',
  support: 'Support',
  lecture: 'Lecture seule',
};

export default function AdminLayout() {
  const { user, logout, isAdmin, hasPermission } = useAuth();
  const device = useDeviceType();
  const navigate = useNavigate();
  const [mobileWarning, setMobileWarning] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setMobileWarning(device === 'mobile' || device === 'tablet');
  }, [device]);

  useEffect(() => {
    setDrawerOpen(false);
  }, [navigate]);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  // Filtrer selon les permissions
  const visibleItems = NAV_ITEMS.filter((item) => {
    if (item.adminOnly) return isAdmin;
    if (item.resource && item.action) return hasPermission(item.resource, item.action);
    return true;
  });

  // Libellé du rôle
  const roleLabel = user?.type === 'admin'
    ? 'Super-admin'
    : user?.role
    ? ROLE_LABELS[user.role] || user.role
    : 'Admin';

  const NavList = ({ onNavigate }) => (
    <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
      {visibleItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
              isActive ? 'bg-alkher-50 text-alkher-700' : 'text-gray-700 hover:bg-gray-100'
            }`
          }
        >
          <item.icon className="h-5 w-5" />
          {item.label}
        </NavLink>
      ))}
    </nav>
  );

  const UserCard = () => (
    <div className="border-t border-gray-200 p-3">
      <div className="mb-2 flex items-center gap-2 rounded-lg bg-gray-50 p-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-alkher-600 text-sm font-bold text-white">
          {user?.full_name?.[0]?.toUpperCase() || 'A'}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-gray-900">{user?.full_name}</p>
          <p className="truncate text-xs text-gray-500">{roleLabel}</p>
        </div>
      </div>
      <button
        onClick={handleLogout}
        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-red-50 hover:text-red-600"
      >
        <LogOut className="h-4 w-4" />
        Déconnexion
      </button>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gray-100">
      <aside className="hidden w-64 flex-col border-r border-gray-200 bg-white lg:flex">
        <div className="flex h-16 items-center border-b border-gray-200 px-6">
          <GraduationCap className="mr-2 h-6 w-6 text-alkher-600" />
          <span className="text-lg font-bold text-alkher-800">ALKHER</span>
          <span className="ml-1 text-xs text-gray-500">Admin</span>
        </div>
        <NavList />
        <UserCard />
      </aside>

      {drawerOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setDrawerOpen(false)} />
          <aside className="fixed left-0 top-0 z-50 flex h-full w-64 flex-col bg-white shadow-xl lg:hidden">
            <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4">
              <div className="flex items-center">
                <GraduationCap className="mr-2 h-6 w-6 text-alkher-600" />
                <span className="text-lg font-bold text-alkher-800">ALKHER</span>
              </div>
              <button onClick={() => setDrawerOpen(false)} className="rounded p-1 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <NavList onNavigate={() => setDrawerOpen(false)} />
            <UserCard />
          </aside>
        </>
      )}

      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 lg:px-6">
          <div className="flex flex-1 items-center gap-4">
            <button
              onClick={() => setDrawerOpen(true)}
              className="rounded-lg p-2 hover:bg-gray-100 lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-alkher-500 focus:outline-none"
              />
            </div>
          </div>
          <button className="relative rounded-lg p-2 hover:bg-gray-100">
            <Bell className="h-5 w-5 text-gray-600" />
          </button>
        </header>

        {mobileWarning && (
          <div className="mx-4 mt-4 flex items-center gap-2 rounded-lg bg-yellow-50 p-3 text-sm text-yellow-800 lg:mx-6">
            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            <span>Pour une expérience optimale, utilisez un ordinateur (≥ 1280px).</span>
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
