import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="glass-card p-3 text-sm">
        <p className="text-slate-400 text-xs">{label}</p>
        <p className="text-agri-400 font-semibold">{payload[0]?.value?.toFixed(2)} t/ha</p>
      </div>
    );
  }
  return null;
};

export default function YieldChart({ history }) {
  if (!history || history.length < 2) {
    return (
      <div className="glass-card p-4 text-center text-slate-500 text-sm py-8">
        <p>📊 Yield evolution chart will appear after 2+ checks</p>
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
    <div className="glass-card p-4">
      <h3 className="text-sm font-semibold text-white mb-4">📈 Yield Evolution / उपज विकास</h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <XAxis dataKey="date" stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 11 }} />
          <YAxis stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 11 }} unit=" t/ha" width={60} />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={avg} stroke="#4ade8060" strokeDasharray="4 4" label={{ value: 'avg', fill: '#4ade80', fontSize: 10 }} />
          <Line
            type="monotone"
            dataKey="yield"
            stroke="#22c55e"
            strokeWidth={2}
            dot={{ fill: '#22c55e', r: 4 }}
            activeDot={{ r: 6, fill: '#4ade80' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
