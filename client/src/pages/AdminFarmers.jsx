import { useEffect, useState } from 'react';
import { getAdminFarmers } from '../api/adminApi';

export default function AdminFarmers() {
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    getAdminFarmers()
      .then((r) => setFarmers(r.data.data.farmers))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = farmers.filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase()) ||
    f.phone.includes(search) ||
    f.district?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="flex justify-center py-20"><div className="spinner" /></div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <h1 className="text-2xl font-bold text-white font-sans">Farmers ({farmers.length})</h1>
        <input
          type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, phone, district..."
          className="bg-white/5 border border-white/10 text-white rounded-lg px-4 py-2 text-sm w-64 focus:outline-none focus:border-agri-500"
        />
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-slate-400">
                <th className="text-left px-4 py-3">Farmer</th>
                <th className="text-left px-4 py-3">Phone</th>
                <th className="text-left px-4 py-3">District</th>
                <th className="text-left px-4 py-3">State</th>
                <th className="text-left px-4 py-3">Fields</th>
                <th className="text-left px-4 py-3">Language</th>
                <th className="text-left px-4 py-3">Joined</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((f) => (
                <tr key={f._id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3 font-medium text-white">{f.name}</td>
                  <td className="px-4 py-3 text-slate-300 font-mono">{f.phone}</td>
                  <td className="px-4 py-3 text-slate-300">{f.district || '—'}</td>
                  <td className="px-4 py-3 text-slate-300">{f.state || '—'}</td>
                  <td className="px-4 py-3">
                    <span className="bg-agri-900/60 text-agri-400 px-2 py-0.5 rounded-full text-xs">{f.fieldCount}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 uppercase text-xs">{f.language}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{new Date(f.createdAt).toLocaleDateString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <p className="text-center text-slate-500 py-12">No farmers found</p>}
        </div>
      </div>
    </div>
  );
}
