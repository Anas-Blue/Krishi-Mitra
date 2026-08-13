import { useEffect, useState } from 'react';
import { getAdminFields } from '../api/adminApi';
import { Link } from 'react-router-dom';

const STAGE_COLORS = { seedling: '#4ade80', vegetative: '#22c55e', flowering: '#facc15', grain_filling: '#f97316', mature: '#ef4444' };

export default function AdminFields() {
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    getAdminFields()
      .then((r) => setFields(r.data.data.fields))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = fields.filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase()) ||
    f.location?.district?.toLowerCase().includes(search.toLowerCase()) ||
    f.crop.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="flex justify-center py-20"><div className="spinner" /></div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <h1 className="text-2xl font-bold text-white font-outfit">All Fields ({fields.length})</h1>
        <input
          type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, district, crop..."
          className="bg-white/5 border border-white/10 text-white rounded-lg px-4 py-2 text-sm w-64 focus:outline-none focus:border-agri-500"
        />
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-slate-400">
                <th className="text-left px-4 py-3">Field</th>
                <th className="text-left px-4 py-3">Farmer</th>
                <th className="text-left px-4 py-3">Crop</th>
                <th className="text-left px-4 py-3">Stage</th>
                <th className="text-left px-4 py-3">GDD %</th>
                <th className="text-left px-4 py-3">Yield (t/ha)</th>
                <th className="text-left px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((f) => (
                <tr key={f._id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-white">{f.name}</div>
                    <div className="text-xs text-slate-500">{f.location?.district}, {f.location?.state}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-300">
                    {f.userId?.name || '—'}<br />
                    <span className="text-xs text-slate-500">{f.userId?.phone}</span>
                  </td>
                  <td className="px-4 py-3 capitalize text-slate-300">{f.crop}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-1 rounded-full" style={{ background: `${STAGE_COLORS[f.current?.stage]}20`, color: STAGE_COLORS[f.current?.stage] }}>
                      {f.current?.stage || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-agri-400">{f.current?.gddPct ? Math.round(f.current.gddPct * 100) + '%' : '—'}</td>
                  <td className="px-4 py-3 text-white">{f.current?.yieldEstimate?.toFixed(2) || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${f.status === 'active' ? 'bg-agri-900/60 text-agri-400' : 'bg-slate-700 text-slate-400'}`}>{f.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <p className="text-center text-slate-500 py-12">No fields found</p>}
        </div>
      </div>
    </div>
  );
}
