import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Home, BookOpen, Briefcase, User, Bell, Menu, X, LogOut,
  GraduationCap, Library, MessageCircle, LifeBuoy, Award, FileText,
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

// ─── Bottom-nav mobile (4 items) ───
const BOTTOM_NAV = [
  { to: '/dashboard', label: 'Accueil', icon: Home },
  { to: '/modules', label: 'Modules', icon: BookOpen },
  { to: '/scholarships', label: 'Bourses', icon: Briefcase },
  { to: '/profile', label: 'Profil', icon: User },
];

// ─── Drawer / sidebar desktop (6 items) ───
const DRAWER_ITEMS = [
  { to: '/library', label: 'Bibliothèque', icon: Library },
  { to: '/forum', label: 'Forum', icon: MessageCircle },
  { to: '/support', label: 'Support', icon: LifeBuoy },
  { to: '/my-applications', label: 'Mes candidatures', icon: FileText },
  { to: '/orientation', label: 'Orientation', icon: Award },
  { to: '/notifications', label: 'Notifications', icon: Bell },
];

export default function LearnerLayout() {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const initials = user?.full_name?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || 'A';
  const photoUrl = user?.profile_photo_url
    ? `${import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000'}${user.profile_photo_url}`
    : null;

  // Navigation partagée
  const NavList = ({ onNavigate }) => (
    <nav className="p-3">
      {DRAWER_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium ${
              isActive ? 'bg-alkher-50 text-alkher-700' : 'text-gray-700 hover:bg-gray-100'
            }`
          }
        >
          <item.icon className="h-5 w-5" />
          {item.label}
        </NavLink>
      ))}
      <button
        onClick={handleLogout}
        className="mt-4 flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-red-600 hover:bg-red-50"
      >
        <LogOut className="h-5 w-5" />
        Déconnexion
      </button>
    </nav>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-20 lg:pb-0">
      {/* ═══════════ HEADER MOBILE ═══════════ */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between bg-white px-4 shadow-sm">
        <button onClick={() => setDrawerOpen(true)} className="rounded-lg p-2 hover:bg-gray-100">
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-alkher-600" />
          <span className="text-base font-bold text-alkher-800">ALKHER</span>
        </div>
        <NavLink to="/notifications" className="relative rounded-lg p-2 hover:bg-gray-100">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </NavLink>
      </header>

      {/* ═══════════ DRAWER MOBILE ═══════════ */}
      {drawerOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setDrawerOpen(false)} />
          <aside className="fixed left-0 top-0 z-50 flex h-full w-72 flex-col bg-white shadow-xl">
            <div className="flex items-center justify-between border-b p-4">
              <div className="flex items-center gap-3">
                {photoUrl ? (
                  <img src={photoUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-alkher-100 text-sm font-bold text-alkher-700">
                    {initials}
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium">{user?.full_name}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
              </div>
              <button onClick={() => setDrawerOpen(false)} className="p-1">
                <X className="h-5 w-5" />
              </button>
            </div>
            <NavList onNavigate={() => setDrawerOpen(false)} />
          </aside>
        </>
      )}

      {/* ═══════════ LAYOUT DESKTOP ═══════════ */}
      <div className="mx-auto flex max-w-7xl">
        {/* Sidebar desktop */}
        <aside className="hidden w-60 flex-shrink-0 border-r border-gray-200 bg-white lg:block">
          <div className="border-b border-gray-200 p-4">
            <div className="flex items-center gap-2">
              {photoUrl ? (
                <img src={photoUrl} alt="" className="h-9 w-9 rounded-full object-cover" />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-alkher-100 text-xs font-bold text-alkher-700">
                  {initials}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{user?.full_name}</p>
                <p className="truncate text-xs text-gray-500">{user?.email}</p>
              </div>
            </div>
          </div>
          <nav className="space-y-1 p-4">
            {[...BOTTOM_NAV, ...DRAWER_ITEMS].map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
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
            <button
              onClick={handleLogout}
              className="mt-4 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              <LogOut className="h-5 w-5" />
              Déconnexion
            </button>
          </nav>
        </aside>

        <main className="min-w-0 flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>

      {/* ═══════════ BOTTOM NAV MOBILE ═══════════ */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 flex border-t border-gray-200 bg-white lg:hidden">
        {BOTTOM_NAV.map((item) => {
          const active = location.pathname === item.to || location.pathname.startsWith(item.to + '/');
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium ${
                active ? 'text-alkher-600' : 'text-gray-500'
              }`}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
