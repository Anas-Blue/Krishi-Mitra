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

  const inputClass = "w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600 transition-colors text-sm font-medium shadow-xs";
  const selectClass = "w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600 transition-colors cursor-pointer text-sm font-medium shadow-xs";

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="glass-card max-w-5xl w-full overflow-hidden grid md:grid-cols-12 border border-green-500/30 dark:border-agri-500/30 shadow-2xl fade-in">
        {/* Left Side: Farmer Image Banner */}
        <div className="relative hidden md:block md:col-span-5">
          <img
            src={farmerHero}
            alt="Smiling Indian Farmer in crop field"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
          <div className="absolute bottom-8 left-8 right-8 z-10 text-white">
            <div className="text-3xl mb-2">🌱</div>
            <h2 className="text-2xl font-bold font-sans mb-2 text-white">Join KrishiMitra</h2>
            <p className="text-slate-200 text-sm leading-relaxed font-medium">
              Empowering Indian farmers with live yield prediction & GDD stage monitoring from sowing to harvest.
            </p>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="p-8 md:col-span-7 flex flex-col justify-center">
          <div className="text-center md:text-left mb-6">
            <div className="md:hidden text-4xl mb-2">🌾</div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-sans">Register / पंजीकरण</h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-1 font-medium">Create your farmer account to start tracking fields</p>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-2.5 rounded-xl text-sm mb-4 font-medium">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase">नाम / Full Name</label>
                <input id="reg-name" type="text" name="name" value={form.name} onChange={handleChange} required placeholder="Ramesh Singh" className={inputClass} />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase">फोन नंबर / Phone (10 digits)</label>
                <input id="reg-phone" type="tel" name="phone" value={form.phone} onChange={handleChange} required maxLength={10} pattern="\d{10}" placeholder="9876543210" className={inputClass} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase">पासवर्ड / Password</label>
              <input id="reg-password" type="password" name="password" value={form.password} onChange={handleChange} required minLength={6} placeholder="Minimum 6 characters" className={inputClass} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase">जिला / District</label>
                <input id="reg-district" type="text" name="district" value={form.district} onChange={handleChange} placeholder="Barabanki" className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase">राज्य / State</label>
                <select id="reg-state" name="state" value={form.state} onChange={handleChange} className={selectClass}>
                  <option value="">Select state</option>
                  {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase">भाषा / Language</label>
              <div className="flex gap-3">
                {[['en', '🇬🇧 English'], ['hi', '🇮🇳 हिन्दी']].map(([val, label]) => (
                  <label key={val} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border cursor-pointer transition-colors text-sm font-semibold ${form.language === val ? 'border-green-600 bg-green-50 text-green-800 dark:border-agri-500 dark:bg-agri-600 dark:text-white shadow-xs' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-750'}`}>
                    <input type="radio" name="language" value={val} checked={form.language === val} onChange={handleChange} className="hidden" />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            <button
              id="reg-submit"
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-green-700 hover:bg-green-600 disabled:opacity-50 text-white rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2 agri-glow shadow-md shadow-green-700/20 cursor-pointer mt-2"
            >
              {loading ? <><div className="spinner w-4 h-4" /> Creating account...</> : 'Register / पंजीकरण करें'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400 font-medium">
            Already registered?{' '}
            <Link to="/login" className="text-green-700 dark:text-agri-400 hover:text-green-800 dark:hover:text-agri-300 font-bold hover:underline">Login here / लॉगिन करें</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
