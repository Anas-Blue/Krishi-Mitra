import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getField, checkField, harvestField, getFieldWeather } from '../api/fieldsApi';
import { getEvents } from '../api/eventsApi';
import GDDProgressBar from '../components/GDDProgressBar';
import YieldChart from '../components/YieldChart';
import RainfallChart from '../components/RainfallChart';
import AdvisoryPanel from '../components/AdvisoryPanel';
import AlertCard from '../components/AlertCard';
import { CROP_PARAMS_MATURITY } from '../utils/cropConstants';


export default function FieldDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [field, setField] = useState(null);
  const [events, setEvents] = useState([]);
  const [forecastDays, setForecastDays] = useState([]);
  const [latestAdvisory, setLatestAdvisory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [harvesting, setHarvesting] = useState(false);

  async function loadField() {
    const [fieldResp, eventsResp] = await Promise.all([
      getField(id),
      getEvents(id),
    ]);
    setField(fieldResp.data.data.field);
    const evs = eventsResp.data.data.events;
    setEvents(evs);
    const advisory = evs.find((e) => e.advisory?.finalAction && e.advisory.finalAction !== 'NONE');
    setLatestAdvisory(advisory?.advisory || null);
  }

  async function loadWeather() {
    try {
      const wr = await getFieldWeather(id);
      const forecast = wr.data.data.weather?.forecast;
      if (forecast?.time) {
        setForecastDays(forecast.time.map((d, i) => ({
          date: d,
          rain: forecast.precipitation_sum?.[i] ?? 0,
          rain_prob: forecast.precipitation_probability_max?.[i] ?? 0,
        })));
      }
    } catch (_) {}
  }

  useEffect(() => {
    Promise.all([loadField(), loadWeather()])
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  async function handleCheck() {
    setChecking(true);
    try {
      await checkField(id);
      await loadField();
      await loadWeather();
    } catch (err) {
      alert(err.response?.data?.error || 'Check failed');
    } finally {
      setChecking(false);
    }
  }

  async function handleHarvest() {
    const actual = prompt('Enter actual yield (t/ha) if known, or press OK to skip:');
    setHarvesting(true);
    try {
      await harvestField(id, actual ? Number(actual) : null);
      navigate('/dashboard');
    } catch (err) {
      alert(err.response?.data?.error || 'Harvest failed');
    } finally {
      setHarvesting(false);
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="spinner" /></div>;
  if (!field) return <div className="text-center text-slate-400 py-20">Field not found</div>;

  const c = field.current;
  // Recover the crop's maturity target from the server's own numbers so the
  // client never has to keep its own per-crop table in sync. The static map is
  // only a fallback for a field that has not been checked yet.
  const maturityGdd = c?.gddPct > 0
    ? Math.round(c.cumGdd / c.gddPct)
    : (CROP_PARAMS_MATURITY[field.crop] || 2000);

  const yieldUnit = c?.yieldUnit || 't/ha';
  const yieldDecimals = yieldUnit === 'nuts/ha' ? 0 : 2;
  const CONFIDENCE_LABEL = {
    high: null, // a confident prediction needs no caveat
    medium: 'approximate — limited local data',
    low: 'rough estimate — no data for this crop in your state',
    very_low: 'very rough — crop not in the training data',
  };
  const confidenceNote = CONFIDENCE_LABEL[c?.yieldConfidence];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 fade-in">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white font-outfit">{field.name}</h1>
            <p className="text-slate-400 text-sm">{field.location.district}, {field.location.state} • {field.areaAcre} acres • <span className="capitalize">{field.crop}</span></p>
            {field.variety && <p className="text-slate-500 text-xs">Variety: {field.variety}</p>}
          </div>
        </div>
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={handleCheck}
            disabled={checking || field.status !== 'active'}
            className="px-4 py-2 bg-agri-700 hover:bg-agri-600 disabled:opacity-40 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            {checking ? <><div className="spinner w-4 h-4" /> Checking...</> : 'Run Check / जाँच करें'}
          </button>
          {field.status === 'active' && (
            <button
              onClick={handleHarvest}
              disabled={harvesting}
              className="px-4 py-2 bg-earth-600 hover:bg-earth-500 disabled:opacity-40 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Mark Harvested
            </button>
          )}
        </div>
      </div>

      {/* Main grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* GDD Progress */}
          <GDDProgressBar gddPct={c.gddPct} stage={c.stage} cumGdd={c.cumGdd} maturityGdd={maturityGdd} />

          {/* Key stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="glass-card p-4">
              <p className="text-slate-400 text-xs mb-1">Harvest Estimate / कटाई अनुमान</p>
              <p className="text-white font-semibold">
                {c.predictedHarvestDate
                  ? new Date(c.predictedHarvestDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
                  : '—'}
              </p>
            </div>
            <div className="glass-card p-4">
              <p className="text-slate-400 text-xs mb-1">Yield Estimate / उपज अनुमान</p>
              <p className="text-white font-semibold">
                {c.yieldEstimate?.toFixed(yieldDecimals) || '—'} {yieldUnit}
              </p>
              {c.yieldRangeLow && c.yieldRangeHigh && (
                <p className="text-slate-500 text-xs">
                  {c.yieldRangeLow.toFixed(yieldDecimals)} – {c.yieldRangeHigh.toFixed(yieldDecimals)} {yieldUnit}
                  <span className="ml-1 opacity-70">(80% likely range)</span>
                </p>
              )}
              {confidenceNote && (
                <p className="text-amber-400/80 text-xs mt-1">⚠ {confidenceNote}</p>
              )}
            </div>
            <div className="glass-card p-4">
              <p className="text-slate-400 text-xs mb-1">Stress Factor</p>
              <p className={`font-semibold ${(c.stressFactor || 1) < 0.8 ? 'text-red-400' : 'text-agri-400'}`}>
                {c.stressFactor?.toFixed(3) || '—'}
              </p>
            </div>
            <div className="glass-card p-4">
              <p className="text-slate-400 text-xs mb-1">Last Checked</p>
              <p className="text-white text-sm">{c.lastCheckedAt ? new Date(c.lastCheckedAt).toLocaleString('en-IN') : '—'}</p>
            </div>
          </div>

          <YieldChart history={field.yieldHistory} unit={yieldUnit} />
          <RainfallChart forecastDays={forecastDays} />
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {latestAdvisory && <AdvisoryPanel advisory={latestAdvisory} />}

          {/* Event timeline */}
          <div className="glass-card p-4">
            <h3 className="text-sm font-semibold text-white mb-3">Event Timeline</h3>
            {events.length === 0 ? (
              <p className="text-slate-500 text-xs text-center py-4">No events yet. Run a check.</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {events.slice(0, 15).map((ev) => (
                  <div key={ev._id} className="flex gap-2 text-xs py-2 border-b border-white/5">
                    <span className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${ev.severity === 'high' ? 'bg-red-500' : ev.severity === 'medium' ? 'bg-yellow-500' : 'bg-green-500'}`} />
                    <div>
                      <p className="text-slate-300">{ev.title}</p>
                      <p className="text-slate-500">{new Date(ev.createdAt).toLocaleDateString('en-IN')}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Soil info */}
          {field.soil && (Object.values(field.soil).some(Boolean)) && (
            <div className="glass-card p-4">
              <h3 className="text-sm font-semibold text-white mb-3">Soil / मिट्टी</h3>
              <div className="space-y-1 text-xs">
                {field.soil.nitrogen && <div className="flex justify-between"><span className="text-slate-400">N</span><span className="text-white">{field.soil.nitrogen} kg/ha</span></div>}
                {field.soil.phosphorus && <div className="flex justify-between"><span className="text-slate-400">P</span><span className="text-white">{field.soil.phosphorus} kg/ha</span></div>}
                {field.soil.potassium && <div className="flex justify-between"><span className="text-slate-400">K</span><span className="text-white">{field.soil.potassium} kg/ha</span></div>}
                {field.soil.ph && <div className="flex justify-between"><span className="text-slate-400">pH</span><span className="text-white">{field.soil.ph}</span></div>}
                {field.soil.testedOn && <div className="flex justify-between"><span className="text-slate-400">Tested</span><span className="text-white">{new Date(field.soil.testedOn).toLocaleDateString('en-IN')}</span></div>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
