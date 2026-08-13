import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getFields } from '../api/fieldsApi';
import { getEvents } from '../api/eventsApi';
import FieldCard from '../components/FieldCard';
import AlertCard from '../components/AlertCard';
import farmerHero from '../assets/farmer_hero.jpg';

export default function Dashboard() {
  const { user } = useAuth();
  const [fields, setFields] = useState([]);
  const [recentEvents, setRecentEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getFields(), getEvents()])
      .then(([fieldResp, eventResp]) => {
        setFields(fieldResp.data.data.fields);
        setRecentEvents(eventResp.data.data.events.slice(0, 5));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const unread = recentEvents.filter((e) => !e.read).length;

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="spinner" /></div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 fade-in">
      {/* Welcome Banner with Farmer Photo */}
      <div className="relative rounded-2xl overflow-hidden glass-card p-6 md:p-8 mb-8 border border-agri-500/30 bg-gradient-to-r from-slate-900/90 via-slate-900/70 to-slate-950/90">
        <div className="grid md:grid-cols-12 gap-6 items-center">
          <div className="md:col-span-8 z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-agri-900/80 border border-agri-600/40 text-agri-300 text-xs font-semibold mb-3">
              <span>🌾</span> KrishiMitra Farmer Portal
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white font-sans mb-2">
              नमस्ते, {user.name.split(' ')[0]} 👋
            </h1>
            <p className="text-slate-300 text-sm md:text-base max-w-xl">
              Welcome back to your crop dashboard! Your registered fields are being tracked with GDD heat units, Open-Meteo weather intelligence, and verified advisory checks.
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-6">
              <Link
                to="/fields/new"
                className="flex items-center gap-2 bg-agri-600 hover:bg-agri-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all agri-glow"
              >
                + नया खेत / Add Field
              </Link>
              {unread > 0 && (
                <Link to="/alerts" className="flex items-center gap-2 bg-red-900/50 border border-red-700 text-red-200 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-red-900/70 transition-colors">
                  🔔 {unread} unread alert{unread !== 1 ? 's' : ''}
                </Link>
              )}
            </div>
          </div>
          <div className="md:col-span-4 hidden md:block relative">
            <div className="relative rounded-xl overflow-hidden border border-white/10 shadow-xl h-40">
              <img
                src={farmerHero}
                alt="Farmer in green crop field"
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
              <div className="absolute bottom-2 left-3 right-3 text-xs text-slate-200 font-medium truncate">
                🌱 Active Crop Monitoring
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Fields', hindi: 'कुल खेत', value: fields.length, icon: '🌿' },
          { label: 'Active', hindi: 'सक्रिय', value: fields.filter((f) => f.status === 'active').length, icon: '✅' },
          { label: 'Avg Yield', hindi: 'औसत उपज', value: fields.length ? (fields.reduce((s, f) => s + (f.current?.yieldEstimate || 0), 0) / fields.length).toFixed(2) + ' t/ha' : '—', icon: '📊' },
          { label: 'Alerts', hindi: 'सूचनाएं', value: unread, icon: '🔔' },
        ].map((s) => (
          <div key={s.label} className="glass-card p-4">
            <div className="text-2xl mb-2">{s.icon}</div>
            <div className="text-2xl font-bold text-white">{s.value}</div>
            <div className="text-xs text-slate-400">{s.label}</div>
            <div className="text-xs text-slate-500">{s.hindi}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Fields */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">आपके खेत / Your Fields</h2>
          </div>
          {fields.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <div className="text-5xl mb-4">🌱</div>
              <p className="text-slate-400 mb-2">No fields registered yet</p>
              <p className="text-slate-500 text-sm mb-6">अभी तक कोई खेत नहीं जोड़ा गया</p>
              <Link to="/fields/new" className="px-6 py-2 bg-agri-600 hover:bg-agri-500 text-white rounded-lg font-medium transition-colors inline-block">
                Add Your First Field
              </Link>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {fields.map((f) => <FieldCard key={f._id} field={f} />)}
            </div>
          )}
        </div>

        {/* Recent alerts */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">हाल की सूचनाएं / Recent Alerts</h2>
            <Link to="/alerts" className="text-agri-400 text-sm hover:text-agri-300">View all →</Link>
          </div>
          {recentEvents.length === 0 ? (
            <div className="glass-card p-8 text-center text-slate-500 text-sm">
              No alerts yet. Run a field check to start.
            </div>
          ) : (
            <div className="space-y-3">
              {recentEvents.map((ev) => (
                <AlertCard key={ev._id} event={ev} onRead={() => setRecentEvents((prev) => prev.map((e) => e._id === ev._id ? { ...e, read: true } : e))} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
