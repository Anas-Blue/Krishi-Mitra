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

  // Averaging yields across crops only means something when the units agree —
  // mixing rice (t/ha) with coconut (nuts/ha) would produce a nonsense figure.
  const avgYield = (() => {
    const scored = fields.filter((f) => f.current?.yieldEstimate > 0);
    if (scored.length === 0) return '—';
    const units = new Set(scored.map((f) => f.current?.yieldUnit || 't/ha'));
    if (units.size > 1) return 'mixed units';
    const unit = [...units][0];
    const mean = scored.reduce((s, f) => s + f.current.yieldEstimate, 0) / scored.length;
    return `${mean.toFixed(unit === 'nuts/ha' ? 0 : 2)} ${unit}`;
  })();

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="spinner" /></div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white font-outfit">
            नमस्ते, {user.name.split(' ')[0]}
          </h1>
          <p className="text-slate-400 mt-1">Here's your farm overview / आपका खेत सारांश</p>
        </div>
        <div className="flex items-center gap-3">
          {unread > 0 && (
            <Link to="/alerts" className="flex items-center gap-2 bg-red-900/40 border border-red-800/60 text-red-300 px-4 py-2 rounded-xl text-sm font-medium hover:bg-red-900/60 transition-colors">
              {unread} unread alert{unread !== 1 ? 's' : ''}
            </Link>
          )}
          <Link
            to="/fields/new"
            className="flex items-center gap-2 bg-agri-600 hover:bg-agri-500 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors agri-glow"
          >
            + नया खेत / Add Field
          </Link>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Fields', hindi: 'कुल खेत', value: fields.length },
          { label: 'Active', hindi: 'सक्रिय', value: fields.filter((f) => f.status === 'active').length },
          { label: 'Avg Yield', hindi: 'औसत उपज', value: avgYield },
          { label: 'Alerts', hindi: 'सूचनाएं', value: unread },
        ].map((s) => (
          <div key={s.label} className="glass-card p-4">
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
