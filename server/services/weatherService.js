/**
 * Open-Meteo weather service.
 * Fetches historical archive from sowing date to today + 16-day forecast.
 * Caches each field's response for 6 hours (in-memory Map).
 */
const axios = require('axios');

const ARCHIVE_URL = 'https://archive-api.open-meteo.com/v1/archive';
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';

// fieldId → { expiresAt, data }
const weatherCache = new Map();
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

const DAILY_VARS = 'temperature_2m_max,temperature_2m_min,precipitation_sum';
const FORECAST_VARS = 'temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max';

function toDateStr(date) {
  return date.toISOString().split('T')[0];
}

async function fetchHistorical(lat, lon, startDate, endDate) {
  const params = {
    latitude: lat,
    longitude: lon,
    start_date: toDateStr(startDate),
    end_date: toDateStr(endDate),
    daily: DAILY_VARS,
    timezone: 'Asia/Kolkata',
  };
  const resp = await axios.get(ARCHIVE_URL, { params, timeout: 15000 });
  return resp.data.daily;
}

async function fetchForecast(lat, lon) {
  const params = {
    latitude: lat,
    longitude: lon,
    forecast_days: 16,
    daily: FORECAST_VARS,
    timezone: 'Asia/Kolkata',
  };
  const resp = await axios.get(FORECAST_URL, { params, timeout: 15000 });
  return resp.data.daily;
}

async function getFieldWeather(fieldId, lat, lon, sowingDate) {
  const cached = weatherCache.get(fieldId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const today = new Date();
  const sowing = new Date(sowingDate);
  const histEnd = today > sowing ? new Date(today - 86400000) : sowing; // yesterday

  let historical = null;
  if (histEnd >= sowing) {
    historical = await fetchHistorical(lat, lon, sowing, histEnd);
  }

  const forecast = await fetchForecast(lat, lon);

  const data = { historical, forecast };
  weatherCache.set(fieldId, { expiresAt: Date.now() + CACHE_TTL_MS, data });
  return data;
}

function clearFieldCache(fieldId) {
  weatherCache.delete(fieldId);
}

module.exports = { getFieldWeather, clearFieldCache };
