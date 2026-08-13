import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import farmerHero from '../assets/farmer_hero.jpg';

const STATES = ['Uttar Pradesh', 'Madhya Pradesh', 'Punjab', 'Haryana', 'Bihar', 'Rajasthan', 'Maharashtra', 'West Bengal', 'Andhra Pradesh', 'Tamil Nadu', 'Karnataka', 'Gujarat', 'Odisha', 'Assam', 'Jharkhand', 'Chhattisgarh'];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', phone: '', password: '', language: 'en',
    district: '', state: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Registration failed. Check server connection.');
    } finally {
      setLoading(false);
    }
  }

  const inputClass = "w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-400 focus:outline-none focus:border-agri-500 focus:ring-1 focus:ring-agri-500 transition-colors";
  const selectClass = "w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-agri-500 focus:ring-1 focus:ring-agri-500 transition-colors cursor-pointer";

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="glass-card p-8 w-full max-w-md fade-in">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-white font-outfit">Register / पंजीकरण</h1>
          <p className="text-slate-400 text-sm mt-1">Create your farmer account</p>
        </div>

        {/* Right Side: Form */}
        <div className="p-8 md:col-span-7 flex flex-col justify-center">
          <div className="text-center md:text-left mb-6">
            <div className="md:hidden text-4xl mb-2">🌾</div>
            <h1 className="text-2xl font-bold text-white font-sans">Register / पंजीकरण</h1>
            <p className="text-slate-400 text-sm mt-1">Create your farmer account to start tracking fields</p>
          </div>

          {error && (
            <div className="bg-red-900/40 border border-red-800 text-red-300 px-4 py-2.5 rounded-lg text-sm mb-4">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">नाम / Full Name</label>
                <input id="reg-name" type="text" name="name" value={form.name} onChange={handleChange} required placeholder="Ramesh Singh" className={inputClass} />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">फोन नंबर / Phone (10 digits)</label>
                <input id="reg-phone" type="tel" name="phone" value={form.phone} onChange={handleChange} required maxLength={10} pattern="\d{10}" placeholder="9876543210" className={inputClass} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">पासवर्ड / Password</label>
              <input id="reg-password" type="password" name="password" value={form.password} onChange={handleChange} required minLength={6} placeholder="Minimum 6 characters" className={inputClass} />
            </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1">भाषा / Language</label>
            <div className="flex gap-3">
              {[['en', 'English'], ['hi', 'हिन्दी']].map(([val, label]) => (
                <label key={val} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border cursor-pointer transition-colors ${form.language === val ? 'border-agri-500 bg-agri-900/40 text-agri-400' : 'border-white/10 text-slate-400 hover:border-white/30'}`}>
                  <input type="radio" name="language" value={val} checked={form.language === val} onChange={handleChange} className="hidden" />
                  {label}
                </label>
              ))}
            </div>

            <button
              id="reg-submit"
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-agri-600 hover:bg-agri-500 disabled:opacity-50 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 agri-glow mt-2"
            >
              {loading ? <><div className="spinner w-5 h-5" /> Creating account...</> : 'Register / पंजीकरण करें'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-400">
            Already registered?{' '}
            <Link to="/login" className="text-agri-400 hover:text-agri-300 font-semibold">Login here / लॉगिन करें</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

