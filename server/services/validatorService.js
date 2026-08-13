/**
 * Validator — final gate before creating an Event.
 * Rejects physically impossible or dangerous recommendations.
 * PRD §10: Validator section.
 */

const cropParams = require('../data/cropParams.json');

const VALID_FINAL_ACTIONS = new Set(['APPLY', 'WAIT', 'HOLD', 'HARVEST']);
const MAX_FERTILIZER_KG_ACRE = 60;

// Fallback for a crop with no observed distribution — cereal-ish, deliberately wide.
const DEFAULT_YIELD_MIN = 0.05;
const DEFAULT_YIELD_MAX = 50;

/**
 * Plausible yield bounds for a crop, from its observed 1st/99th percentile in
 * the training data (see ai-service/export_crop_params.py).
 *
 * A single 0.3-12 t/ha gate used to be applied to every crop. That is a cereal
 * range: it rejects sugarcane (~57 t/ha), banana (~18) and coconut (~8,900
 * nuts/ha) as "physically impossible", and is far too loose for cardamom (~0.1).
 */
function yieldBounds(crop) {
  const params = cropParams.crops[String(crop || '').toLowerCase()];
  return {
    min: params?.yieldMin ?? DEFAULT_YIELD_MIN,
    max: params?.yieldMax ?? DEFAULT_YIELD_MAX,
    unit: params?.unit ?? 't/ha',
  };
}

/**
 * @param {object} params
 * @returns {{ passed: boolean, reason: string }}
 */
function validate({
  yieldEstimate,
  crop,
  dose,
  cumGdd,
  finalAction,
  activeHazard,
}) {
  // Yield range check, against this crop's own plausible range
  if (yieldEstimate !== null && yieldEstimate !== undefined) {
    const { min, max, unit } = yieldBounds(crop);
    if (yieldEstimate < min || yieldEstimate > max) {
      return {
        passed: false,
        reason: `Yield estimate ${yieldEstimate} ${unit} is outside the plausible range for ${crop || 'this crop'} (${min}–${max} ${unit}).`,
      };
    }
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
