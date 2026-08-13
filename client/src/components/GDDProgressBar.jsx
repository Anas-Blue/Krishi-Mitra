const STAGE_LABELS = {
  seedling: 'अंकुरण',
  vegetative: 'वानस्पतिक',
  flowering: 'फूल',
  grain_filling: 'दाना भरना',
  mature: 'परिपक्व',
};

export default function GDDProgressBar({ gddPct, stage, cumGdd, maturityGdd }) {
  const pct = Math.min(Math.round((gddPct || 0) * 100), 100);
  const stageLabel = STAGE_LABELS[stage] || stage;

  return (
    <div className="glass-card p-4">
      <div className="flex justify-between items-center mb-2">
        <div>
          <span className="text-sm font-medium text-white">GDD Progress</span>
          <p className="text-xs text-slate-400">{stageLabel} / {stage}</p>
        </div>
        <div className="text-right">
          <span className="text-2xl font-bold text-agri-400">{pct}%</span>
          {cumGdd != null && (
            <p className="text-xs text-slate-400">{Math.round(cumGdd)} / {maturityGdd || '?'} GDD</p>
          )}
        </div>
      </div>
      <div className="gdd-bar mt-2">
        <div className="gdd-bar-fill" style={{ width: `${pct}%` }} />
      </div>
      {/* Stage milestone markers */}
      <div className="flex justify-between mt-1 text-xs text-slate-500">
        <span>🌱 20%</span>
        <span>🌿 45%</span>
        <span>🌸 65%</span>
        <span>🌾 90%</span>
        <span>✅ 100%</span>
      </div>
    </div>
  );
}
