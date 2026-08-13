import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useEffect, useState } from 'react';
import { getUnreadCount } from '../api/eventsApi';

export default function NavBar() {
  const { user, logout, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
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

  // Check if current route is landing page
  const isLanding = location.pathname === '/';

  // Toggle button icon (Sun / Moon)
  const themeToggle = (
    <button
      onClick={toggleTheme}
      className={`p-2 rounded-full transition-colors cursor-pointer mr-2 ${
        theme === 'dark'
          ? 'text-yellow-400 hover:bg-slate-800'
          : 'text-gray-600 hover:bg-gray-100'
      }`}
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? (
        // Sun Icon
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ) : (
        // Moon Icon
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      )}
    </button>
  );

  return (
    <nav
      className={`sticky top-0 z-50 px-4 py-3.5 transition-all duration-300 border-b ${
        theme === 'dark'
          ? 'bg-slate-950/90 border-slate-900 text-white backdrop-blur-md'
          : 'bg-white/95 border-gray-200 text-gray-900 shadow-xs backdrop-blur-md'
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo and Brand */}
        <Link to={user ? (isAdmin ? '/admin' : '/dashboard') : '/'} className="flex items-center gap-2 group">
          <span className="text-2xl">🌾</span>
          <div className="flex flex-col leading-tight">
            <span className={`font-extrabold text-lg tracking-tight transition-colors ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`} style={{ fontFamily: "'Poppins', sans-serif" }}>
              Krishi<span className="text-green-600">Mitra</span>
            </span>
            <span className={`text-[10px] font-medium -mt-0.5 ${theme === 'dark' ? 'text-slate-400' : 'text-gray-400'}`}>
              Smarter Farming, Better Future
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center gap-2">
          {/* Landing links for guest */}
          {isLanding && !user && (
            <>
              <a href="#home" className={`px-3.5 py-2 text-sm font-semibold rounded-lg transition-all ${theme === 'dark' ? 'text-white hover:text-green-400' : 'text-green-700 bg-green-50 font-semibold'}`}>Home</a>
              <a href="#features" className={`px-3.5 py-2 text-sm font-medium rounded-lg transition-all ${theme === 'dark' ? 'text-slate-300 hover:text-white hover:bg-slate-900' : 'text-gray-600 hover:text-green-700 hover:bg-gray-50'}`}>Features</a>
              <a href="#how-it-works" className={`px-3.5 py-2 text-sm font-medium rounded-lg transition-all ${theme === 'dark' ? 'text-slate-300 hover:text-white hover:bg-slate-900' : 'text-gray-600 hover:text-green-700 hover:bg-gray-50'}`}>How It Works</a>
              <Link to="/register" className={`px-3.5 py-2 text-sm font-medium rounded-lg transition-all ${theme === 'dark' ? 'text-slate-300 hover:text-white hover:bg-slate-900' : 'text-gray-600 hover:text-green-700 hover:bg-gray-50'}`}>Register</Link>
            </>
          )}

          {/* Authenticated Links */}
          {user && (
            <>
              <Link
                to={isAdmin ? '/admin' : '/dashboard'}
                className={`px-3.5 py-2 text-sm font-medium rounded-lg transition-all ${
                  location.pathname === (isAdmin ? '/admin' : '/dashboard')
                    ? 'bg-green-600 text-white font-semibold shadow-xs'
                    : theme === 'dark'
                      ? 'text-slate-300 hover:text-white hover:bg-slate-900'
                      : 'text-gray-600 hover:text-green-700 hover:bg-gray-50'
                }`}
              >
                Dashboard
              </Link>
              {!isAdmin && (
                <>
                  <Link
                    to="/fields"
                    className={`px-3.5 py-2 text-sm font-medium rounded-lg transition-all ${
                      location.pathname.startsWith('/fields')
                        ? 'bg-green-600 text-white font-semibold'
                        : theme === 'dark'
                          ? 'text-slate-300 hover:text-white hover:bg-slate-900'
                          : 'text-gray-600 hover:text-green-700 hover:bg-gray-50'
                    }`}
                  >
                    Fields
                  </Link>
                  <Link
                    to="/alerts"
                    className={`relative px-3.5 py-2 text-sm font-medium rounded-lg transition-all ${
                      location.pathname.startsWith('/alerts')
                        ? 'bg-green-600 text-white font-semibold'
                        : theme === 'dark'
                          ? 'text-slate-300 hover:text-white hover:bg-slate-900'
                          : 'text-gray-600 hover:text-green-700 hover:bg-gray-50'
                    }`}
                  >
                    Alerts
                    {unread > 0 && (
                      <span className="absolute -top-1.5 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-4.5 h-4.5 flex items-center justify-center shadow-xs">
                        {unread > 9 ? '9+' : unread}
                      </span>
                    )}
                  </Link>
                </>
              )}
              {isAdmin && (
                <>
                  <Link
                    to="/admin/fields"
                    className={`px-3.5 py-2 text-sm font-medium rounded-lg transition-all ${
                      location.pathname.startsWith('/admin/fields')
                        ? 'bg-green-600 text-white font-semibold'
                        : theme === 'dark'
                          ? 'text-slate-300 hover:text-white hover:bg-slate-900'
                          : 'text-gray-600 hover:text-green-700 hover:bg-gray-50'
                    }`}
                  >
                    Fields List
                  </Link>
                  <Link
                    to="/admin/farmers"
                    className={`px-3.5 py-2 text-sm font-medium rounded-lg transition-all ${
                      location.pathname.startsWith('/admin/farmers')
                        ? 'bg-green-600 text-white font-semibold'
                        : theme === 'dark'
                          ? 'text-slate-300 hover:text-white hover:bg-slate-900'
                          : 'text-gray-600 hover:text-green-700 hover:bg-gray-50'
                    }`}
                  >
                    Farmers
                  </Link>
                </>
              )}
            </>
          )}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1.5">
          {/* Theme Toggle Button */}
          {themeToggle}

          {user ? (
            <div className="flex items-center gap-3">
              {/* Profile display */}
              <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-gray-50 border-gray-200'}`}>
                <div className="w-6 h-6 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs font-bold shadow-xs">
                  {user.name?.charAt(0).toUpperCase()}
                </div>
                <span className="text-xs font-semibold">{user.name.split(' ')[0]}</span>
              </div>
              
              <button
                onClick={handleLogout}
                className="px-4 py-1.8 text-xs font-bold bg-red-650 hover:bg-red-600 text-white rounded-full transition-colors cursor-pointer shadow-xs"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link
              to="/register"
              className="px-5 py-2.2 bg-green-700 hover:bg-green-600 text-white rounded-full text-sm font-semibold transition-all shadow-xs shadow-green-700/10 active:scale-95"
            >
              Get Started
            </Link>
          )}

          {/* Mobile hamburger */}
          <button
            className={`md:hidden p-2 rounded-lg transition-colors cursor-pointer ${theme === 'dark' ? 'hover:bg-slate-900' : 'hover:bg-gray-100'}`}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <span className="text-xl">{menuOpen ? '✕' : '☰'}</span>
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {menuOpen && (
        <div className={`md:hidden mt-3 flex flex-col gap-1 border-t pt-3 ${theme === 'dark' ? 'border-slate-900' : 'border-gray-200'}`}>
          {!user && isLanding && (
            <>
              <a href="#home" className="px-4 py-2.5 text-sm font-semibold text-green-600 bg-green-50/50 rounded-lg" onClick={() => setMenuOpen(false)}>Home</a>
              <a href="#features" className="px-4 py-2.5 text-sm font-medium text-gray-500 hover:text-green-700 rounded-lg" onClick={() => setMenuOpen(false)}>Features</a>
              <a href="#how-it-works" className="px-4 py-2.5 text-sm font-medium text-gray-500 hover:text-green-700 rounded-lg" onClick={() => setMenuOpen(false)}>How It Works</a>
              <Link to="/register" className="px-4 py-2.5 text-sm font-medium text-gray-500 hover:text-green-700 rounded-lg" onClick={() => setMenuOpen(false)}>Register</Link>
            </>
          )}
          {user && (
            <>
              <Link to={isAdmin ? '/admin' : '/dashboard'} className="px-4 py-2.5 text-sm font-medium rounded-lg" onClick={() => setMenuOpen(false)}>Dashboard</Link>
              {!isAdmin && (
                <>
                  <Link to="/fields" className="px-4 py-2.5 text-sm font-medium rounded-lg" onClick={() => setMenuOpen(false)}>Fields</Link>
                  <Link to="/alerts" className="px-4 py-2.5 text-sm font-medium rounded-lg" onClick={() => setMenuOpen(false)}>Alerts ({unread})</Link>
                </>
              )}
            </>
          )}
        </div>
      )}
    </nav>
  );
}
