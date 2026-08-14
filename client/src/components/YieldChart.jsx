import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

// `unit` is the field's own yield unit — not every crop is tonnes/ha.
const CustomTooltip = ({ active, payload, label, unit = 't/ha' }) => {
  if (active && payload?.length) {
    const decimals = unit === 'nuts/ha' ? 0 : 2;
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-3 rounded-lg shadow-lg text-sm">
        <p className="text-slate-600 dark:text-slate-400 text-xs font-medium">{label}</p>
        <p className="text-green-700 dark:text-agri-400 font-bold text-sm">
          {payload[0]?.value?.toFixed(decimals)} {unit}
        </p>
      </div>
    );
  }
  return null;
};

export default function YieldChart({ history, unit = 't/ha' }) {
  if (!history || history.length < 2) {
    return (
      <div className="glass-card p-4 text-center text-slate-500 dark:text-slate-400 text-sm py-8">
        <p className="font-medium">Yield evolution chart will appear after 2+ checks</p>
        <p className="text-xs mt-1">उपज विकास — कम से कम 2 जाँच के बाद</p>
      </div>
    );
  }

  const data = history.map((h) => ({
    date: new Date(h.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
    yield: h.estimate,
  }));

  const avg = history.reduce((s, h) => s + h.estimate, 0) / history.length;

  return (
    <div className="glass-card p-5">
      <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Yield Evolution / उपज विकास</h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <XAxis dataKey="date" stroke="#94a3b8" tick={{ fill: '#64748b', fontSize: 11 }} />
          <YAxis stroke="#94a3b8" tick={{ fill: '#64748b', fontSize: 11 }} unit={` ${unit}`} width={60} />
          <Tooltip content={<CustomTooltip unit={unit} />} />
          <ReferenceLine y={avg} stroke="#16a34a80" strokeDasharray="4 4" label={{ value: 'avg', fill: '#16a34a', fontSize: 10 }} />
          <Line
            type="monotone"
            dataKey="yield"
            stroke="#16a34a"
            strokeWidth={2.5}
            dot={{ fill: '#16a34a', r: 4 }}
            activeDot={{ r: 6, fill: '#22c55e' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
