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

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="glass-card p-8 w-full max-w-md fade-in">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🌾</div>
          <h1 className="text-2xl font-bold text-white font-outfit">KrishiMitra</h1>
          <p className="text-slate-400 text-sm mt-1">लॉगिन करें / Sign In</p>
        </div>

        {error && (
          <div className="bg-red-900/40 border border-red-800 text-red-300 px-4 py-3 rounded-lg text-sm mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-300 mb-1">
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
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-agri-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1">
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
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-agri-500 transition-colors"
            />
          </div>

          <button
            id="login-submit"
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-agri-600 hover:bg-agri-500 disabled:opacity-50 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <><div className="spinner w-5 h-5" /> Logging in...</> : 'Login / लॉगिन'}
          </button>
        </form>


        <p className="mt-6 text-center text-sm text-slate-500">
          New farmer?{' '}
          <Link to="/register" className="text-agri-400 hover:text-agri-300 font-medium">
            Register here / यहाँ पंजीकरण करें
          </Link>
        </p>
      </div>
    </div>
  );
}
