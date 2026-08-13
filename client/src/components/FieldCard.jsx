import { Link } from 'react-router-dom';
import { cropLabel } from '../constants/crops';

const STAGE_COLORS = {
  seedling: '#4ade80',
  vegetative: '#22c55e',
  flowering: '#facc15',
  grain_filling: '#f97316',
  mature: '#ef4444',
};

const STAGE_LABELS = {
  seedling: 'अंकुरण / Seedling',
  vegetative: 'वानस्पतिक / Vegetative',
  flowering: 'फूल / Flowering',
  grain_filling: 'दाना भरना / Grain Filling',
  mature: 'परिपक्व / Mature',
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
      className="glass-card p-5 flex flex-col gap-3 hover:border-agri-600/50 hover:agri-glow transition-all duration-300 fade-in"
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div>
              <h3 className="font-semibold text-white text-base">{field.name}</h3>
              <p className="text-slate-400 text-xs">{field.location?.district}, {field.location?.state}</p>
            </div>
          </div>
        </div>
        <span
          className="text-xs px-2 py-1 rounded-full font-medium"
          style={{ backgroundColor: `${STAGE_COLORS[stage]}20`, color: STAGE_COLORS[stage] }}
        >
          {stage}
        </span>
      </div>

      {/* GDD Progress */}
      <div>
        <div className="flex justify-between text-xs text-slate-400 mb-1">
          <span>GDD Progress / वृद्धि</span>
          <span className="text-agri-400 font-medium">{gddPct}%</span>
        </div>
        <div className="gdd-bar">
          <div className="gdd-bar-fill" style={{ width: `${gddPct}%` }} />
        </div>
      </div>

      {/* Yield */}
      {yieldEst && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">उपज / Yield</span>
          <span className="text-white font-medium">
            {yieldEst.toFixed(decimals)} {unit}
            {yieldLow && yieldHigh && (
              <span className="text-slate-400 text-xs ml-1">({yieldLow.toFixed(decimals)}–{yieldHigh.toFixed(decimals)})</span>
            )}
          </span>
        </div>
      )}

      {/* Area & crop */}
      <div className="flex items-center justify-between text-xs text-slate-500 border-t border-white/10 pt-2">
        <span>{cropLabel(field.crop)} • {field.areaAcre} acres</span>
        <span className={`px-2 py-0.5 rounded-full ${field.status === 'active' ? 'bg-agri-900/60 text-agri-400' : 'bg-slate-700 text-slate-400'}`}>
          {field.status}
        </span>
      </div>
    </Link>
  );
}
