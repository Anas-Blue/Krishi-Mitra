/**
 * Advisor — deterministic crop-stage fertilizer and harvest rules.
 * No LLM. No external calls. Pure decision logic.
 * PRD §10: Advisor section.
 */

// Fertilizer rules per crop per stage (kg/acre)
const FERTILIZER_RULES = {
  rice: {
    vegetative: { urea: 25, mop: 0, label: 'Urea 25 kg/acre' },
    flowering:  { urea: 15, mop: 15, label: 'Urea 15 kg/acre + MOP 15 kg/acre' },
  },
  wheat: {
    vegetative: { urea: 30, mop: 0, label: 'Urea 30 kg/acre' },
    flowering:  { urea: 15, mop: 0, label: 'Urea 15 kg/acre' },
  },
  maize: {
    vegetative: { urea: 28, mop: 0, label: 'Urea 28 kg/acre' },
    flowering:  { urea: 14, mop: 0, label: 'Urea 14 kg/acre' },
  },
};

/**
 * Returns proposed action for the current field state.
 * @param {object} field - Field document
 * @param {object} forecastDays - Parsed forecast day array
 * @returns {{ proposedAction, dose, reason, type }}
 */
function advise(field, forecastDays) {
  const crop = field.crop.toLowerCase();
  const stage = field.current.stage;
  const gddPct = field.current.gddPct;

  // Harvest window: GDD progress > 90%
  if (gddPct > 0.90) {
    const dryWindow = findDriestWindow(forecastDays, 3);
    return {
      proposedAction: 'HARVEST',
      dose: null,
      reason: `Crop is ${Math.round(gddPct * 100)}% mature. Harvest in the driest 3-day window: ${dryWindow}.`,
      type: 'HARVEST_WINDOW',
    };
  }

  // Fertilizer window
  const rules = FERTILIZER_RULES[crop]?.[stage];
  const next3DayRain = sumRainfall(forecastDays.slice(0, 3));

  if (rules && next3DayRain < 15) {
    const totalDose = rules.urea + (rules.mop || 0);
    return {
      proposedAction: 'APPLY',
      dose: totalDose,
      reason: `${stage} stage with low rain forecast (${next3DayRain.toFixed(1)}mm over 3 days). Apply ${rules.label}.`,
      type: 'FERTILIZER_WINDOW',
    };
  }

  return {
    proposedAction: 'NONE',
    dose: null,
    reason: 'No fertilizer rule applies for current stage and weather conditions.',
    type: null,
  };
}

function sumRainfall(days) {
  return days.reduce((sum, d) => sum + (d.rain ?? d.precipitation_sum ?? 0), 0);
}

function findDriestWindow(forecastDays, windowSize) {
  if (!forecastDays || forecastDays.length < windowSize) return 'next available window';
  let minRain = Infinity;
  let bestStart = 0;
  for (let i = 0; i <= forecastDays.length - windowSize; i++) {
    const rain = sumRainfall(forecastDays.slice(i, i + windowSize));
    if (rain < minRain) {
      minRain = rain;
      bestStart = i;
    }
  }
  const startDate = forecastDays[bestStart]?.date || 'soon';
  return `starting ${startDate} (expected ${minRain.toFixed(1)}mm)`;
}

module.exports = { advise };
