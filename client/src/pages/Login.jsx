import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ phone: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form.phone, form.password);
      navigate(user.role === 'admin' ? '/admin' : '/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  }

  const inputClass = "w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600 transition-colors text-sm font-medium shadow-xs";

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="glass-card p-8 sm:p-10 w-full max-w-md fade-in shadow-xl">
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">🌾</div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-sans">Welcome Back / स्वागत है</h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1 font-medium">लॉगिन करें / Sign In to your field portal</p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl text-sm mb-4 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase">
              फोन नंबर / Phone Number
            </label>
            <input
              id="login-phone"
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              required
              maxLength={10}
              pattern="\d{10}"
              placeholder="10-digit mobile number"
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase">
              पासवर्ड / Password
            </label>
            <input
              id="login-password"
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              placeholder="Enter password"
              className={inputClass}
            />
          </div>

          <button
            id="login-submit"
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-green-700 hover:bg-green-600 disabled:opacity-50 text-white rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2 agri-glow shadow-md shadow-green-700/20 cursor-pointer mt-2"
          >
            {loading ? <><div className="spinner w-4 h-4" /> Logging in...</> : 'Login / लॉगिन करें'}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-3 rounded-xl font-medium">
          Demo Farmer Login: <code className="text-green-700 dark:text-agri-400 font-mono font-bold">9999999999</code> / <code className="text-green-700 dark:text-agri-400 font-mono font-bold">demo1234</code>
        </div>

        <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400 font-medium">
          New farmer?{' '}
          <Link to="/register" className="text-green-700 dark:text-agri-400 hover:text-green-800 dark:hover:text-agri-300 font-bold hover:underline">
            Register here / पंजीकरण करें
          </Link>
        </p>
      </div>
    </div>
  );
}
