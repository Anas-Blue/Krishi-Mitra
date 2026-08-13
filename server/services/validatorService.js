/**
 * Validator — final gate before creating an Event.
 * Rejects physically impossible or dangerous recommendations.
 * PRD §10: Validator section.
 */

const VALID_FINAL_ACTIONS = new Set(['APPLY', 'WAIT', 'HOLD', 'HARVEST']);
const YIELD_MIN_T_HA = 0.3;
const YIELD_MAX_T_HA = 12;
const MAX_FERTILIZER_KG_ACRE = 60;

/**
 * @param {object} params
 * @returns {{ passed: boolean, reason: string }}
 */
function validate({
  yieldEstimate,
  dose,
  cumGdd,
  finalAction,
  activeHazard,
}) {
  // Yield range check
  if (
    yieldEstimate !== null &&
    yieldEstimate !== undefined &&
    (yieldEstimate < YIELD_MIN_T_HA || yieldEstimate > YIELD_MAX_T_HA)
  ) {
    return {
      passed: false,
      reason: `Yield estimate ${yieldEstimate} t/ha is outside valid range (${YIELD_MIN_T_HA}–${YIELD_MAX_T_HA} t/ha).`,
    };
  }

  // Fertilizer dose check
  if (dose !== null && dose !== undefined && dose > MAX_FERTILIZER_KG_ACRE) {
    return {
      passed: false,
      reason: `Fertilizer dose ${dose} kg/acre exceeds maximum allowed (${MAX_FERTILIZER_KG_ACRE} kg/acre).`,
    };
  }

  // GDD negativity check
  if (cumGdd !== null && cumGdd !== undefined && cumGdd < 0) {
    return {
      passed: false,
      reason: `Cumulative GDD is negative (${cumGdd}). GDD cannot be negative.`,
    };
  }

  // Valid action check
  if (finalAction && finalAction !== 'NONE' && !VALID_FINAL_ACTIONS.has(finalAction)) {
    return {
      passed: false,
      reason: `Invalid final action: ${finalAction}. Must be one of APPLY, WAIT, HOLD, HARVEST.`,
    };
  }

  // No APPLY or HARVEST during active high-severity hazard
  if (activeHazard && (finalAction === 'APPLY' || finalAction === 'HARVEST')) {
    return {
      passed: false,
      reason: `Cannot ${finalAction} during active high-severity hazard alert. Override to HOLD.`,
    };
  }

  return { passed: true, reason: 'All validation checks passed.' };
}

module.exports = { validate };
