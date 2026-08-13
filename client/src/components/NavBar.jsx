import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';
import { getUnreadCount } from '../api/eventsApi';

export default function NavBar() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [unread, setUnread] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    getUnreadCount().then((r) => setUnread(r.data.data.count)).catch(() => {});
    const interval = setInterval(() => {
      getUnreadCount().then((r) => setUnread(r.data.data.count)).catch(() => {});
    }, 60000);
    return () => clearInterval(interval);
  }, [user, location.pathname]);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const navLink = (to, label) => (
    <Link
      to={to}
      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
        location.pathname.startsWith(to) && to !== '/'
          ? 'bg-agri-700 text-white'
          : 'text-slate-300 hover:text-white hover:bg-white/10'
      }`}
    >
      {label}
    </Link>
  );

  return (
    <nav className="sticky top-0 z-50 glass-card border-b border-white/10 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link to={user ? (isAdmin ? '/admin' : '/dashboard') : '/'} className="flex items-center gap-2">
          <span className="font-bold text-agri-400 text-lg font-outfit">KrishiMitra</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {user && !isAdmin && (
            <>
              {navLink('/dashboard', 'Dashboard')}
              {navLink('/fields', 'Fields')}
              <Link to="/alerts" className="relative px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-white/10 transition-colors">
                Alerts {unread > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{unread > 9 ? '9+' : unread}</span>}
              </Link>
            </>
          )}
          {isAdmin && (
            <>
              {navLink('/admin', 'Dashboard')}
              {navLink('/admin/fields', 'Fields')}
              {navLink('/admin/farmers', 'Farmers')}
            </>
          )}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="hidden md:block text-sm text-slate-400">{user.name}</span>
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 text-sm bg-red-900/40 hover:bg-red-800/60 text-red-300 rounded-lg transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            <Link to="/login" className="px-4 py-1.5 bg-agri-600 hover:bg-agri-500 text-white rounded-lg text-sm font-medium transition-colors">
              Login
            </Link>
          )}

          {/* Mobile hamburger */}
          <button className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors" onClick={() => setMenuOpen(!menuOpen)}>
            <span className="text-xl">{menuOpen ? '✕' : '☰'}</span>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && user && (
        <div className="md:hidden mt-2 flex flex-col gap-1 border-t border-white/10 pt-2">
          {!isAdmin && (
            <>
              <Link to="/dashboard" className="px-4 py-2 text-slate-300 hover:text-white" onClick={() => setMenuOpen(false)}>Dashboard</Link>
              <Link to="/alerts" className="px-4 py-2 text-slate-300 hover:text-white" onClick={() => setMenuOpen(false)}>Alerts {unread > 0 && `(${unread})`}</Link>
            </>
          )}
          {isAdmin && (
            <>
              <Link to="/admin" className="px-4 py-2 text-slate-300 hover:text-white" onClick={() => setMenuOpen(false)}>Dashboard</Link>
              <Link to="/admin/fields" className="px-4 py-2 text-slate-300 hover:text-white" onClick={() => setMenuOpen(false)}>Fields</Link>
              <Link to="/admin/farmers" className="px-4 py-2 text-slate-300 hover:text-white" onClick={() => setMenuOpen(false)}>Farmers</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
