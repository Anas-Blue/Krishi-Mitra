/**
 * GDD (Growing Degree Days) engine. Pure arithmetic — no I/O, no DB.
 * All calculations follow PRD §8 exactly.
 */

const CROP_PARAMS = {
  rice:  { base: 10, upper: 35, maturityGdd: 2400, waterNeedMm: 1100 },
  wheat: { base: 5,  upper: 30, maturityGdd: 2100, waterNeedMm: 450  },
  maize: { base: 10, upper: 35, maturityGdd: 1700, waterNeedMm: 550  },
};

// Stage thresholds based on GDD % progress (PRD §8)
const STAGE_THRESHOLDS = [
  { max: 0.20, stage: 'seedling'    },
  { max: 0.45, stage: 'vegetative'  },
  { max: 0.65, stage: 'flowering'   },
  { max: 0.90, stage: 'grain_filling' },
  { max: 1.00, stage: 'mature'      },
];

function getCropParams(crop) {
  const params = CROP_PARAMS[crop.toLowerCase()];
  if (!params) throw new Error(`Unknown crop: ${crop}`);
  return params;
}

/**
 * Daily GDD = max(0, min(tmax, upper) - base + min(tmin, upper) - base) / 2
 * Never negative, capped at upper temperature.
 */
function computeDailyGdd(tmax, tmin, base, upper) {
  const cappedMax = Math.min(tmax, upper);
  const cappedMin = Math.min(tmin, upper);
  const gdd = (cappedMax + cappedMin) / 2 - base;
  return Math.max(0, gdd);
}

function accumulateGdd(days, base, upper) {
  return days.reduce((sum, day) => {
    const tmax = day.temperature_2m_max ?? day.tmax ?? 25;
    const tmin = day.temperature_2m_min ?? day.tmin ?? 15;
    return sum + computeDailyGdd(tmax, tmin, base, upper);
  }, 0);
}

function computeStage(gddPct) {
  for (const threshold of STAGE_THRESHOLDS) {
    if (gddPct <= threshold.max) return threshold.stage;
  }
  return 'mature';
}

/**
 * Predict harvest date by consuming remaining GDD from the 16-day forecast.
 * After the forecast window, use the mean of the last 7 forecast days.
 */
function predictHarvestDate(cumGdd, maturityGdd, forecastDays, base, upper) {
  const remainingGdd = Math.max(0, maturityGdd - cumGdd);
  if (remainingGdd <= 0) return new Date();

  let consumed = 0;
  const today = new Date();

  for (let i = 0; i < forecastDays.length; i++) {
    const tmax = forecastDays[i].temperature_2m_max ?? 28;
    const tmin = forecastDays[i].temperature_2m_min ?? 18;
    const dailyGdd = computeDailyGdd(tmax, tmin, base, upper);
    consumed += dailyGdd;
    if (consumed >= remainingGdd) {
      const harvestDate = new Date(today);
      harvestDate.setDate(today.getDate() + i + 1);
      return harvestDate;
    }
  }

  // Beyond 16-day forecast: use mean GDD from last 7 forecast days
  const last7 = forecastDays.slice(-7);
  const meanDailyGdd = last7.reduce((sum, d) => {
    return sum + computeDailyGdd(
      d.temperature_2m_max ?? 28,
      d.temperature_2m_min ?? 18,
      base,
      upper
    );
  }, 0) / (last7.length || 1);

  const daysLeft = meanDailyGdd > 0
    ? Math.ceil((remainingGdd - consumed) / meanDailyGdd)
    : 30;

  const harvestDate = new Date(today);
  harvestDate.setDate(today.getDate() + forecastDays.length + daysLeft);
  return harvestDate;
}

/**
 * Build structured daily arrays from Open-Meteo historical response.
 */
function parseHistoricalDays(historical) {
  if (!historical || !historical.time) return [];
  return historical.time.map((date, i) => ({
    date,
    tmax: historical.temperature_2m_max?.[i] ?? 28,
    tmin: historical.temperature_2m_min?.[i] ?? 18,
    rain: historical.precipitation_sum?.[i] ?? 0,
  }));
}

function parseForecastDays(forecast) {
  if (!forecast || !forecast.time) return [];
  return forecast.time.map((date, i) => ({
    date,
    temperature_2m_max: forecast.temperature_2m_max?.[i] ?? 28,
    temperature_2m_min: forecast.temperature_2m_min?.[i] ?? 18,
    rain: forecast.precipitation_sum?.[i] ?? 0,
    rain_prob: forecast.precipitation_probability_max?.[i] ?? 0,
  }));
}

module.exports = {
  getCropParams,
  computeDailyGdd,
  accumulateGdd,
  computeStage,
  predictHarvestDate,
  parseHistoricalDays,
  parseForecastDays,
  CROP_PARAMS,
};
