import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  const inputClass = "w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-agri-500 transition-colors";

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="glass-card p-8 w-full max-w-md fade-in">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-white font-outfit">Register / पंजीकरण</h1>
          <p className="text-slate-400 text-sm mt-1">Create your farmer account</p>
        </div>

        {error && (
          <div className="bg-red-900/40 border border-red-800 text-red-300 px-4 py-3 rounded-lg text-sm mb-4">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-300 mb-1">नाम / Full Name</label>
            <input id="reg-name" type="text" name="name" value={form.name} onChange={handleChange} required placeholder="Ram Prasad" className={inputClass} />
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1">फोन नंबर / Phone (10 digits)</label>
            <input id="reg-phone" type="tel" name="phone" value={form.phone} onChange={handleChange} required maxLength={10} pattern="\d{10}" placeholder="9876543210" className={inputClass} />
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1">पासवर्ड / Password</label>
            <input id="reg-password" type="password" name="password" value={form.password} onChange={handleChange} required minLength={6} placeholder="Minimum 6 characters" className={inputClass} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-slate-300 mb-1">जिला / District</label>
              <input id="reg-district" type="text" name="district" value={form.district} onChange={handleChange} placeholder="Barabanki" className={inputClass} />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">राज्य / State</label>
              <select id="reg-state" name="state" value={form.state} onChange={handleChange} className={inputClass + " cursor-pointer"}>
                <option value="">Select state</option>
                {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
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
          </div>

          <button
            id="reg-submit"
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-agri-600 hover:bg-agri-500 disabled:opacity-50 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <><div className="spinner w-5 h-5" /> Creating account...</> : 'Register / पंजीकरण करें'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already registered?{' '}
          <Link to="/login" className="text-agri-400 hover:text-agri-300 font-medium">Login here</Link>
        </p>
      </div>
    </div>
  );
}
