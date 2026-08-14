import { Link } from 'react-router-dom';
import { cropLabel } from '../constants/crops';

const STAGE_COLORS = {
  seedling: '#16a34a',
  vegetative: '#15803d',
  flowering: '#ca8a04',
  grain_filling: '#ea580c',
  mature: '#dc2626',
};

const STAGE_COLORS_DARK = {
  seedling: '#4ade80',
  vegetative: '#22c55e',
  flowering: '#facc15',
  grain_filling: '#f97316',
  mature: '#ef4444',
};

export default function FieldCard({ field }) {
  const stage = field.current?.stage || 'seedling';
  const gddPct = Math.round((field.current?.gddPct || 0) * 100);
  const yieldEst = field.current?.yieldEstimate;
  const yieldLow = field.current?.yieldRangeLow;
  const yieldHigh = field.current?.yieldRangeHigh;
  // Not every crop is tonnes/ha — coconut is nuts/ha.
  const unit = field.current?.yieldUnit || 't/ha';
  const decimals = unit === 'nuts/ha' ? 0 : 2;

  return (
    <Link
      to={`/fields/${field._id}`}
      className="glass-card p-5 flex flex-col gap-3 hover:border-agri-500 hover:shadow-md transition-all duration-300 fade-in"
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white text-base font-sans">{field.name}</h3>
          <p className="text-slate-600 dark:text-slate-400 text-xs mt-0.5 font-medium">
            {field.location?.district}, {field.location?.state}
          </p>
        </div>
        <span
          className="text-xs px-2.5 py-1 rounded-full font-semibold border"
          style={{
            backgroundColor: `${STAGE_COLORS[stage]}15`,
            color: STAGE_COLORS[stage],
            borderColor: `${STAGE_COLORS[stage]}35`,
          }}
        >
          {stage.replace('_', ' ')}
        </span>
      </div>

      {/* GDD Progress */}
      <div>
        <div className="flex justify-between text-xs text-slate-700 dark:text-slate-300 font-medium mb-1.5">
          <span>GDD Progress / वृद्धि</span>
          <span className="text-green-700 dark:text-agri-400 font-bold">{gddPct}%</span>
        </div>
        <div className="gdd-bar">
          <div className="gdd-bar-fill" style={{ width: `${Math.min(100, Math.max(0, gddPct))}%` }} />
        </div>
      </div>

      {/* Yield */}
      {yieldEst && (
        <div className="flex items-center justify-between text-sm py-1">
          <span className="text-slate-600 dark:text-slate-400 text-xs font-medium">उपज / Yield</span>
          <span className="text-slate-900 dark:text-white font-bold text-sm">
            {yieldEst.toFixed(decimals)} {unit}
            {yieldLow && yieldHigh && (
              <span className="text-slate-500 dark:text-slate-400 text-xs font-normal ml-1">
                ({yieldLow.toFixed(decimals)}–{yieldHigh.toFixed(decimals)})
              </span>
            )}
          </span>
        </div>
      )}

      {/* Area & crop */}
      <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-white/10 pt-2.5 font-medium">
        <span>{cropLabel(field.crop)} • {field.areaAcre} acres</span>
        <span className={`px-2.5 py-0.5 rounded-full font-semibold ${field.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-agri-900/60 dark:text-agri-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'}`}>
          {field.status}
        </span>
      </div>
    </Link>
  );
}
