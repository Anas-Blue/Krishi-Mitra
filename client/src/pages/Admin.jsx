import { useEffect, useState } from 'react';
import { getStats, getAdminAlerts, getYieldMap, runAllChecks } from '../api/adminApi';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#22c55e', '#4ade80', '#86efac', '#facc15', '#f97316'];

export default function Admin() {
  const [stats, setStats] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [yieldMap, setYieldMap] = useState([]);
  const [running, setRunning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [runMsg, setRunMsg] = useState('');

  useEffect(() => {
    Promise.all([getStats(), getAdminAlerts(), getYieldMap()])
      .then(([s, a, y]) => {
        setStats(s.data.data);
        setAlerts(a.data.data.alerts);
        setYieldMap(y.data.data.yieldByState);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function handleRunAll() {
    setRunning(true);
    setRunMsg('');
    try {
      const resp = await runAllChecks();
      setRunMsg(resp.data.data.message);
    } catch (err) {
      setRunMsg(err.response?.data?.error || 'Failed to run checks');
    } finally {
      setRunning(false);
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="spinner" /></div>;

  const cropDist = stats?.cropDistribution || [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 fade-in">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white font-outfit">Admin Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">KVK/Government Officer View</p>
        </div>
        <div className="flex items-center gap-3">
          {runMsg && <span className="text-agri-400 text-sm">{runMsg}</span>}
          <button
            onClick={handleRunAll}
            disabled={running}
            className="px-4 py-2 bg-agri-700 hover:bg-agri-600 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
          >
            {running ? <><div className="spinner w-4 h-4" /> Running...</> : 'Run All Checks'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Farmers', value: stats?.totalFarmers },
          { label: 'Total Fields', value: stats?.totalFields },
          { label: 'Active Fields', value: stats?.activeFields },
          { label: 'High Alerts', value: stats?.highAlerts },
        ].map((s) => (
          <div key={s.label} className="glass-card p-5">
            <div className="text-3xl font-bold text-white">{s.value ?? '—'}</div>
            <div className="text-slate-400 text-sm mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Crop distribution */}
        <div className="glass-card p-5">
          <h3 className="font-semibold text-white mb-4">Crop Distribution</h3>
          {cropDist.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={cropDist} dataKey="count" nameKey="_id" cx="50%" cy="50%" outerRadius={80} label={({ _id, percent }) => `${_id} ${(percent * 100).toFixed(0)}%`}>
                  {cropDist.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f1f5f9' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-slate-500 text-sm text-center py-12">No field data yet</p>}
        </div>

        {/* State yield */}
        <div className="glass-card p-5">
          <h3 className="font-semibold text-white mb-1">Average Yield by State (t/ha)</h3>
          <p className="text-slate-500 text-xs mb-3">Tonnes/ha crops only — coconut and other units excluded</p>
          {yieldMap.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={yieldMap.slice(0, 8)} layout="vertical">
                <XAxis type="number" stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <YAxis type="category" dataKey="_id" stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 10 }} width={90} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f1f5f9' }} />
                <Bar dataKey="avgYield" fill="#22c55e" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-slate-500 text-sm text-center py-12">No yield data yet</p>}
        </div>
      </div>

      {/* High severity alerts */}
      <div className="glass-card p-5">
        <h3 className="font-semibold text-white mb-4">High-Severity Alerts ({alerts.length})</h3>
        {alerts.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-8">No high-severity alerts</p>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {alerts.slice(0, 20).map((alert) => (
              <div key={alert._id} className="flex items-start gap-3 py-3 border-b border-white/5">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-white text-sm">{alert.title}</span>
                    <span className="badge-high text-xs px-2 py-0.5 rounded-full">High</span>
                  </div>
                  <p className="text-slate-400 text-xs mt-0.5">{alert.fieldId?.name || 'Unknown field'} · {alert.userId?.name}</p>
                  <p className="text-slate-500 text-xs">{new Date(alert.createdAt).toLocaleString('en-IN')}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
