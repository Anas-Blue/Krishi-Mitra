import { useEffect, useState } from 'react';
import { getAdminFarmers } from '../api/adminApi';

export default function AdminFarmers() {
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    getAdminFarmers()
      .then((r) => setFarmers(r.data.data.farmers || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = farmers.filter((f) =>
    f.name?.toLowerCase().includes(search.toLowerCase()) ||
    f.phone?.includes(search) ||
    f.district?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="flex justify-center py-20"><div className="spinner" /></div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white font-sans">Farmers ({farmers.length})</h1>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, phone, district..."
          className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm w-72 focus:outline-none focus:border-green-600 font-medium shadow-xs"
        />
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50">
                <th className="text-left px-4 py-3 font-semibold">Farmer</th>
                <th className="text-left px-4 py-3 font-semibold">Phone</th>
                <th className="text-left px-4 py-3 font-semibold">District</th>
                <th className="text-left px-4 py-3 font-semibold">State</th>
                <th className="text-left px-4 py-3 font-semibold">Fields</th>
                <th className="text-left px-4 py-3 font-semibold">Language</th>
                <th className="text-left px-4 py-3 font-semibold">Joined</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((f) => (
                <tr key={f._id} className="border-b border-slate-100 dark:border-white/5 hover:bg-slate-50/80 dark:hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">{f.name}</td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300 font-mono">{f.phone}</td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300 font-medium">{f.district || '—'}</td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300 font-medium">{f.state || '—'}</td>
                  <td className="px-4 py-3">
                    <span className="bg-green-100 text-green-800 dark:bg-agri-900/60 dark:text-agri-400 px-2.5 py-0.5 rounded-full text-xs font-bold">
                      {f.fieldCount}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400 uppercase text-xs font-semibold">{f.language}</td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs font-medium">{new Date(f.createdAt).toLocaleDateString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <p className="text-center text-slate-500 dark:text-slate-400 py-12 font-medium">No farmers found</p>}
        </div>
      </div>
    </div>
  );
}
