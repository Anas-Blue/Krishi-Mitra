import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-3 rounded-lg shadow-lg text-sm">
        <p className="text-slate-600 dark:text-slate-400 text-xs font-medium">{label}</p>
        <p className="text-blue-600 dark:text-blue-400 font-bold text-sm">{payload[0]?.value?.toFixed(1)} mm</p>
        {payload[1] && <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">Prob: {payload[1]?.value}%</p>}
      </div>
    );
  }
  return null;
};

export default function RainfallChart({ forecastDays }) {
  if (!forecastDays || forecastDays.length === 0) {
    return (
      <div className="glass-card p-4 text-center text-slate-500 dark:text-slate-400 text-sm py-8">
        <p className="font-medium">Rainfall forecast will load after first field check</p>
        <p className="text-xs mt-1">वर्षा पूर्वानुमान — पहली जाँच के बाद</p>
      </div>
    );
  }

  const data = forecastDays.slice(0, 16).map((d) => ({
    date: new Date(d.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
    rain: d.rain ?? 0,
    prob: d.rain_prob ?? 0,
  }));

  return (
    <div className="glass-card p-5">
      <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">16-Day Rainfall Forecast / वर्षा पूर्वानुमान</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} barSize={12}>
          <XAxis dataKey="date" stroke="#94a3b8" tick={{ fill: '#64748b', fontSize: 10 }} interval={2} />
          <YAxis stroke="#94a3b8" tick={{ fill: '#64748b', fontSize: 10 }} unit=" mm" width={50} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="rain" radius={[3, 3, 0, 0]}>
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={entry.rain > 25 ? '#dc2626' : entry.rain > 10 ? '#2563eb' : '#60a5fa'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="flex gap-4 mt-3 text-xs text-slate-600 dark:text-slate-400 font-medium">
        <span><span style={{ color: '#60a5fa' }}>■</span> Light</span>
        <span><span style={{ color: '#2563eb' }}>■</span> Moderate</span>
        <span><span style={{ color: '#dc2626' }}>■</span> Heavy (&gt;25mm)</span>
      </div>
    </div>
  );
}
