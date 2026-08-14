const ACTION_STYLES = {
  APPLY:   { bg: 'bg-green-50/70 dark:bg-agri-900/60', border: 'border-green-300 dark:border-agri-700', text: 'text-green-800 dark:text-agri-400' },
  HARVEST: { bg: 'bg-amber-50/70 dark:bg-earth-50/5',  border: 'border-amber-300 dark:border-earth-600', text: 'text-amber-800 dark:text-earth-400' },
  WAIT:    { bg: 'bg-blue-50/70 dark:bg-blue-900/40', border: 'border-blue-300 dark:border-blue-700', text: 'text-blue-800 dark:text-blue-400'  },
  HOLD:    { bg: 'bg-red-50/70 dark:bg-red-900/30',  border: 'border-red-300 dark:border-red-800',  text: 'text-red-800 dark:text-red-400'   },
  NONE:    { bg: 'bg-slate-50 dark:bg-slate-800/40',border: 'border-slate-300 dark:border-slate-700',text: 'text-slate-700 dark:text-slate-400' },
};

export default function AdvisoryPanel({ advisory, eventEvidence }) {
  if (!advisory) return null;

  const action = advisory.finalAction || 'NONE';
  const style = ACTION_STYLES[action] || ACTION_STYLES.NONE;

  return (
    <div className={`glass-card p-5 border ${style.border} ${style.bg} fade-in`}>
      <div className="flex items-center gap-3 mb-4">
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white text-base">Advisory / सलाह</h3>
          <p className={`text-sm font-bold ${style.text}`}>Final Action: {action}</p>
        </div>
        {advisory.validatorPassed === false && (
          <span className="ml-auto px-2.5 py-1 bg-red-100 dark:bg-red-900/60 text-red-800 dark:text-red-300 text-xs font-semibold rounded-lg border border-red-200 dark:border-red-800">
            Validator Override
          </span>
        )}
      </div>

      <div className="space-y-3 text-sm">
        {/* Proposed action */}
        <div>
          <p className="text-slate-600 dark:text-slate-400 text-xs font-medium mb-1">Proposed / प्रस्तावित</p>
          <p className="text-slate-900 dark:text-white font-semibold">{advisory.proposedAction || 'No proposal'}</p>
        </div>

        {/* Challenger objection */}
        {advisory.challengerObjection && advisory.challengerObjection !== 'No objection' && (
          <div className="bg-amber-50 dark:bg-yellow-900/20 border border-amber-200 dark:border-yellow-800/40 rounded-lg p-3">
            <p className="text-amber-800 dark:text-yellow-400 text-xs font-bold mb-1">Challenger Objection / चुनौती</p>
            <p className="text-slate-800 dark:text-slate-300 text-xs leading-relaxed">{advisory.challengerObjection}</p>
          </div>
        )}

        {/* Decision reason */}
        <div className="bg-white/80 dark:bg-white/5 border border-slate-200 dark:border-transparent rounded-lg p-3">
          <p className="text-slate-600 dark:text-slate-400 text-xs font-medium mb-1">Decision Reason / निर्णय का कारण</p>
          <p className="text-slate-800 dark:text-slate-300 text-xs leading-relaxed">{advisory.decisionReason}</p>
        </div>

        {/* Validator */}
        <div className="flex items-center gap-2 text-xs pt-1">
          <span className={`font-bold ${advisory.validatorPassed !== false ? 'text-green-700 dark:text-agri-400' : 'text-red-700 dark:text-red-400'}`}>
            {advisory.validatorPassed !== false ? '✓ Validator Passed' : '✕ Validator Failed'}
          </span>
          <span className="text-slate-500 dark:text-slate-400">— Deterministic safety code has final authority</span>
        </div>
      </div>
    </div>
  );
}
