/**
 * GDD (Growing Degree Days) engine. Pure arithmetic — no I/O, no DB.
 * All calculations follow PRD §8 exactly.
 */

// Agronomic constants for every crop the yield model knows, generated from
// ai-service/crop_meta.py via `python export_crop_params.py`. Loading it rather
// than hardcoding keeps the GDD thresholds and the model's stress thresholds
// from drifting apart.
const cropParamsData = require('../data/cropParams.json');

const CROP_PARAMS = cropParamsData.crops;
const FAMILY_DEFAULTS = cropParamsData.familyDefaults;
const CROP_ALIASES = cropParamsData.aliases;

// Keyword -> family, mirroring crop_meta.get_spec, for crops outside the table.
const FAMILY_KEYWORDS = [
  ['pulse', 'pulse'], ['gram', 'pulse'], ['bean', 'pulse'], ['dal', 'pulse'],
  ['millet', 'millet'], ['seed', 'oilseed'], ['oil', 'oilseed'],
  ['nut', 'plantation'], ['fruit', 'plantation'],
  ['chilli', 'spice'], ['spice', 'spice'], ['cotton', 'fibre'],
  ['cane', 'sugar'], ['potato', 'tuber'],
];

function canonicalCrop(crop) {
  const key = String(crop || '').trim().toLowerCase().replace(/\s+/g, ' ');
  if (CROP_PARAMS[key]) return key;
  if (CROP_ALIASES[key]) return CROP_ALIASES[key];

  const squashed = key.replace(/[\s\-_]/g, '');
  const match = Object.keys(CROP_PARAMS).find(
    (c) => c.replace(/[\s\-_]/g, '') === squashed
  );
  if (match) return match;
  const aliasMatch = Object.keys(CROP_ALIASES).find(
    (a) => a.replace(/[\s\-_]/g, '') === squashed
  );
  return aliasMatch ? CROP_ALIASES[aliasMatch] : key;
}

// Stage thresholds based on GDD % progress (PRD §8)
const STAGE_THRESHOLDS = [
  { max: 0.20, stage: 'seedling'    },
  { max: 0.45, stage: 'vegetative'  },
  { max: 0.65, stage: 'flowering'   },
  { max: 0.90, stage: 'grain_filling' },
  { max: 1.00, stage: 'mature'      },
];

/**
 * Resolve GDD parameters for any crop.
 *
 * Never throws. This used to reject anything but rice/wheat/maize, which failed
 * the whole field check before the yield model was ever consulted — a farmer
 * growing cotton got an error, not a degraded answer. Unknown crops now resolve
 * through the alias map, then a family guess, and are flagged via `resolved`
 * and `family` so callers can tell an exact match from an approximation.
 */
function getCropParams(crop) {
  const key = canonicalCrop(crop);
  const exact = CROP_PARAMS[key];
  if (exact) return { ...exact, crop: key, resolved: 'exact' };

  const hit = FAMILY_KEYWORDS.find(([keyword]) => key.includes(keyword));
  const family = hit ? hit[1] : 'other';
  return { ...FAMILY_DEFAULTS[family], crop: key, family, resolved: 'family_default' };
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

/**
 * Derive the growing season from the sowing month, for the yield model.
 * Indian cropping calendar: Kharif is monsoon-sown (Jun-Sep), Rabi is
 * winter-sown (Oct-Dec), Summer/Zaid covers the Jan-May short season.
 * Perennials are always "Whole Year" regardless of when they were recorded.
 */
function deriveSeason(sowingDate, crop) {
  const params = getCropParams(crop);
  if (params.perennial) return 'Whole Year';

  const date = sowingDate instanceof Date ? sowingDate : new Date(sowingDate);
  if (Number.isNaN(date.getTime())) return 'Kharif';

  const month = date.getMonth() + 1; // 1-12
  if (month >= 6 && month <= 9) return 'Kharif';
  if (month >= 10 && month <= 12) return 'Rabi';
  if (month >= 1 && month <= 2) return 'Rabi';
  return 'Summer'; // Mar-May
}

module.exports = {
  getCropParams,
  canonicalCrop,
  deriveSeason,
  computeDailyGdd,
  accumulateGdd,
  computeStage,
  predictHarvestDate,
  parseHistoricalDays,
  parseForecastDays,
  CROP_PARAMS,
  FAMILY_DEFAULTS,
};
