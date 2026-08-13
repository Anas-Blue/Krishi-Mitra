const ACTION_STYLES = {
  APPLY:   { bg: 'bg-agri-900/60', border: 'border-agri-700', text: 'text-agri-400', icon: '✅' },
  HARVEST: { bg: 'bg-earth-50/5',  border: 'border-earth-600', text: 'text-earth-400', icon: '🌾' },
  WAIT:    { bg: 'bg-blue-900/40', border: 'border-blue-700', text: 'text-blue-400',  icon: '⏳' },
  HOLD:    { bg: 'bg-red-900/30',  border: 'border-red-800',  text: 'text-red-400',   icon: '🛑' },
  NONE:    { bg: 'bg-slate-800/40',border: 'border-slate-700',text: 'text-slate-400', icon: '➖' },
};

export default function AdvisoryPanel({ advisory, eventEvidence }) {
  if (!advisory) return null;

  const action = advisory.finalAction || 'NONE';
  const style = ACTION_STYLES[action] || ACTION_STYLES.NONE;

  return (
    <div className={`glass-card p-5 border ${style.border} ${style.bg} fade-in`}>
      <div className="flex items-center gap-3 mb-4">
        <span className="text-3xl">{style.icon}</span>
        <div>
          <h3 className="font-bold text-white text-base">Advisory / सलाह</h3>
          <p className={`text-sm font-semibold ${style.text}`}>Final Action: {action}</p>
        </div>
        {advisory.validatorPassed === false && (
          <span className="ml-auto px-2 py-1 bg-red-900/60 text-red-300 text-xs rounded-lg">⚠️ Validator Override</span>
        )}
      </div>

      <div className="space-y-3 text-sm">
        {/* Proposed action */}
        <div>
          <p className="text-slate-400 text-xs mb-1">📋 Proposed / प्रस्तावित</p>
          <p className="text-white">{advisory.proposedAction || 'No proposal'}</p>
        </div>

        {/* Challenger objection */}
        {advisory.challengerObjection && advisory.challengerObjection !== 'No objection' && (
          <div className="bg-yellow-900/20 border border-yellow-800/40 rounded-lg p-3">
            <p className="text-yellow-400 text-xs mb-1">🤖 Challenger Objection / चुनौती</p>
            <p className="text-slate-300 text-xs">{advisory.challengerObjection}</p>
          </div>
        )}

        {/* Decision reason */}
        <div className="bg-white/5 rounded-lg p-3">
          <p className="text-slate-400 text-xs mb-1">⚖️ Decision Reason / निर्णय का कारण</p>
          <p className="text-slate-300 text-xs">{advisory.decisionReason}</p>
        </div>

        {/* Validator */}
        <div className="flex items-center gap-2 text-xs">
          <span className={advisory.validatorPassed !== false ? 'text-agri-400' : 'text-red-400'}>
            {advisory.validatorPassed !== false ? '✅ Validator Passed' : '❌ Validator Failed'}
          </span>
          <span className="text-slate-500">— Deterministic safety code has final authority</span>
        </div>
      </div>
    </div>
  );
}
