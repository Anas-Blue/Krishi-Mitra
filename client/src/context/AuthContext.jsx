import { createContext, useContext, useState, useEffect } from 'react';
import { login as apiLogin, register as apiRegister, getMe } from '../api/authApi';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('km_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('km_token');
    if (!token) { setLoading(false); return; }
    getMe()
      .then((resp) => {
        setUser(resp.data.data.user);
        localStorage.setItem('km_user', JSON.stringify(resp.data.data.user));
      })
      .catch(() => { logout(); })
      .finally(() => setLoading(false));
  }, []);

  async function login(phone, password) {
    const resp = await apiLogin({ phone, password });
    const { token, user: loggedIn } = resp.data.data;
    localStorage.setItem('km_token', token);
    localStorage.setItem('km_user', JSON.stringify(loggedIn));
    setUser(loggedIn);
    return loggedIn;
  }

  async function register(formData) {
    const resp = await apiRegister(formData);
    const { token, user: created } = resp.data.data;
    localStorage.setItem('km_token', token);
    localStorage.setItem('km_user', JSON.stringify(created));
    setUser(created);
    return created;
  }

  function logout() {
    localStorage.removeItem('km_token');
    localStorage.removeItem('km_user');
    setUser(null);
  }

  const isAdmin = user?.role === 'admin';
  const isFarmer = user?.role === 'farmer';

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, isAdmin, isFarmer }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
