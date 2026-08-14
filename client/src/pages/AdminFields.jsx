import { useEffect, useState } from 'react';
import { getAdminFields } from '../api/adminApi';

const STAGE_COLORS = {
  seedling: '#16a34a',
  vegetative: '#15803d',
  flowering: '#ca8a04',
  grain_filling: '#ea580c',
  mature: '#dc2626',
};

export default function AdminFields() {
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    getAdminFields()
      .then((r) => setFields(r.data.data.fields || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = fields.filter((f) =>
    f.name?.toLowerCase().includes(search.toLowerCase()) ||
    f.location?.district?.toLowerCase().includes(search.toLowerCase()) ||
    f.crop?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="flex justify-center py-20"><div className="spinner" /></div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white font-sans">All Fields ({fields.length})</h1>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, district, crop..."
          className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm w-72 focus:outline-none focus:border-green-600 font-medium shadow-xs"
        />
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50">
                <th className="text-left px-4 py-3 font-semibold">Field</th>
                <th className="text-left px-4 py-3 font-semibold">Farmer</th>
                <th className="text-left px-4 py-3 font-semibold">Crop</th>
                <th className="text-left px-4 py-3 font-semibold">Stage</th>
                <th className="text-left px-4 py-3 font-semibold">GDD %</th>
                <th className="text-left px-4 py-3 font-semibold">Yield</th>
                <th className="text-left px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((f) => (
                <tr key={f._id} className="border-b border-slate-100 dark:border-white/5 hover:bg-slate-50/80 dark:hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-bold text-slate-900 dark:text-white">{f.name}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{f.location?.district}, {f.location?.state}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                    <span className="font-medium">{f.userId?.name || '—'}</span><br />
                    <span className="text-xs text-slate-500 dark:text-slate-400">{f.userId?.phone}</span>
                  </td>
                  <td className="px-4 py-3 capitalize text-slate-800 dark:text-slate-200 font-medium">{f.crop}</td>
                  <td className="px-4 py-3">
                    <span
                      className="text-xs px-2.5 py-0.5 rounded-full font-semibold border"
                      style={{
                        backgroundColor: `${STAGE_COLORS[f.current?.stage]}15`,
                        color: STAGE_COLORS[f.current?.stage],
                        borderColor: `${STAGE_COLORS[f.current?.stage]}35`,
                      }}
                    >
                      {f.current?.stage || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-green-700 dark:text-agri-400 font-bold">
                    {f.current?.gddPct ? Math.round(f.current.gddPct * 100) + '%' : '—'}
                  </td>
                  <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                    {f.current?.yieldEstimate != null ? `${f.current.yieldEstimate.toFixed(f.current.yieldUnit === 'nuts/ha' ? 0 : 2)} ${f.current.yieldUnit || 't/ha'}` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${f.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-agri-900/60 dark:text-agri-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'}`}>
                      {f.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <p className="text-center text-slate-500 dark:text-slate-400 py-12 font-medium">No fields found</p>}
        </div>
      </div>
    </div>
  );
}
