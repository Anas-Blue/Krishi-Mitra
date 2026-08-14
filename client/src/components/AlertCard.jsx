import { Link } from 'react-router-dom';
import { markRead } from '../api/eventsApi';

const SEVERITY_STYLES = {
  high:   { dot: 'bg-red-500',    badge: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/60 dark:text-red-300 dark:border-red-800/80',   label: 'उच्च / High'   },
  medium: { dot: 'bg-yellow-500', badge: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/60 dark:text-amber-300 dark:border-amber-800/80', label: 'मध्यम / Medium' },
  low:    { dot: 'bg-green-500',  badge: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/60 dark:text-green-300 dark:border-green-800/80',    label: 'कम / Low'      },
};

export default function AlertCard({ event, onRead }) {
  const style = SEVERITY_STYLES[event.severity] || SEVERITY_STYLES.low;
  const field = event.fieldId;

  async function handleMarkRead(e) {
    e.preventDefault();
    await markRead(event._id);
    onRead?.();
  }

  return (
    <div className={`glass-card p-4 flex gap-3 fade-in ${!event.read ? 'border-green-500/40 dark:border-agri-700/60 shadow-sm' : 'opacity-70'}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <h4 className="font-bold text-slate-900 dark:text-white text-sm">{event.title}</h4>
          <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${style.badge}`}>
            {style.label}
          </span>
        </div>
        <p className="text-slate-700 dark:text-slate-300 text-xs mt-1.5 leading-relaxed font-normal">{event.message}</p>
        {field && (
          <Link to={`/fields/${field._id || field}`} className="text-green-700 dark:text-agri-400 text-xs mt-1.5 inline-block font-semibold hover:underline">
            {field.name || 'View field →'}
          </Link>
        )}
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100 dark:border-white/5">
          <span className="text-slate-500 dark:text-slate-400 text-[11px] font-medium">
            {new Date(event.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
          </span>
          {!event.read && (
            <button onClick={handleMarkRead} className="text-xs font-semibold text-green-700 dark:text-agri-400 hover:text-green-800 dark:hover:text-agri-300 transition-colors cursor-pointer">
              Mark read ✓
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
