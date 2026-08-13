import { Link } from 'react-router-dom';
import { markRead } from '../api/eventsApi';

const SEVERITY_STYLES = {
  high:   { dot: 'bg-red-500',    badge: 'badge-high',   label: 'उच्च / High'   },
  medium: { dot: 'bg-yellow-500', badge: 'badge-medium', label: 'मध्यम / Medium' },
  low:    { dot: 'bg-green-500',  badge: 'badge-low',    label: 'कम / Low'      },
};

const EVENT_ICONS = {
  STAGE_CHANGE: '🌱',
  HEAVY_RAIN: '🌧️',
  HEAT_STRESS: '🌡️',
  DRY_SPELL: '☀️',
  FERTILIZER_WINDOW: '🧪',
  HAZARD_ALERT: '⚠️',
  YIELD_SHIFT: '📊',
  HARVEST_WINDOW: '🌾',
};

export default function AlertCard({ event, onRead }) {
  const style = SEVERITY_STYLES[event.severity] || SEVERITY_STYLES.low;
  const icon = EVENT_ICONS[event.type] || '📣';
  const field = event.fieldId;

  async function handleMarkRead(e) {
    e.preventDefault();
    await markRead(event._id);
    onRead?.();
  }

  return (
    <div className={`glass-card p-4 flex gap-3 fade-in ${!event.read ? 'border-agri-700/60' : 'opacity-60'}`}>
      <div className="text-2xl pt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <h4 className="font-semibold text-white text-sm">{event.title}</h4>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${style.badge}`}>
            {style.label}
          </span>
        </div>
        <p className="text-slate-400 text-xs mt-1 leading-relaxed">{event.message}</p>
        {field && (
          <Link to={`/fields/${field._id || field}`} className="text-agri-400 text-xs mt-1 inline-block hover:underline">
            {field.name || 'View field →'}
          </Link>
        )}
        <div className="flex items-center justify-between mt-2">
          <span className="text-slate-500 text-xs">
            {new Date(event.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
          </span>
          {!event.read && (
            <button onClick={handleMarkRead} className="text-xs text-agri-400 hover:text-agri-300 transition-colors">
              Mark read ✓
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
