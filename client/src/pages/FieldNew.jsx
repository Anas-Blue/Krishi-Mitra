import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createField, getCropCatalog } from '../api/fieldsApi';
import { cropLabel } from '../constants/crops';

// Shown as large buttons; the rest of the catalogue lives in the dropdown below.
const QUICK_PICKS = ['rice', 'wheat', 'maize', 'cotton(lint)', 'sugarcane', 'potato'];

export default function FieldNew() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [crops, setCrops] = useState([]);

  useEffect(() => {
    getCropCatalog()
      .then((resp) => setCrops(resp.data.data.crops))
      .catch(() => {
        // Offline or server down: fall back to the quick picks so the form
        // still works rather than presenting an empty crop list.
        setCrops(QUICK_PICKS.map((value) => ({ value, label: cropLabel(value) })));
      });
  }, []);

  const [form, setForm] = useState({
    name: '', crop: '', variety: '',
    sowingDate: '', areaAcre: '',
    location: { district: '', state: '', lat: '', lon: '' },
    soil: { nitrogen: '', phosphorus: '', potassium: '', ph: '', testedOn: '' },
  });

  const update = (key, val) => setForm((f) => ({ ...f, [key]: val }));
  const updateLoc = (key, val) => setForm((f) => ({ ...f, location: { ...f.location, [key]: val } }));
  const updateSoil = (key, val) => setForm((f) => ({ ...f, soil: { ...f.soil, [key]: val } }));

  async function handleSubmit() {
    setLoading(true);
    setError('');
    try {
      const payload = {
        ...form,
        areaAcre: Number(form.areaAcre),
        location: {
          ...form.location,
          lat: Number(form.location.lat),
          lon: Number(form.location.lon),
        },
        soil: {
          nitrogen: Number(form.soil.nitrogen) || undefined,
          phosphorus: Number(form.soil.phosphorus) || undefined,
          potassium: Number(form.soil.potassium) || undefined,
          ph: Number(form.soil.ph) || undefined,
          testedOn: form.soil.testedOn || undefined,
        },
      };
      const resp = await createField(payload);
      navigate(`/fields/${resp.data.data.field._id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create field');
    } finally {
      setLoading(false);
    }
  }

  const inputClass = "w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-agri-500 transition-colors";

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white font-sans">नया खेत जोड़ें / Add New Field</h1>
        <div className="flex gap-2 mt-4">
          {['Crop', 'Location', 'Soil'].map((label, i) => (
            <div key={label} className={`flex-1 h-1.5 rounded-full transition-colors ${step > i ? 'bg-agri-500' : step === i + 1 ? 'bg-agri-700' : 'bg-white/10'}`} />
          ))}
        </div>
        <p className="text-slate-400 text-sm mt-2">Step {step} of 3</p>
      </div>

      {error && <div className="bg-red-900/40 border border-red-800 text-red-300 px-4 py-3 rounded-lg text-sm mb-4">{error}</div>}

      {/* Step 1: Crop */}
      {step === 1 && (
        <div className="glass-card p-6 space-y-5">
          <h2 className="font-semibold text-white">फसल की जानकारी / Crop Details</h2>
          <div>
            <label className="block text-sm text-slate-300 mb-1">खेत का नाम / Field Name</label>
            <input id="field-name" type="text" value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="e.g. North Field" className={inputClass} />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-3">फसल / Crop</label>
            <div className="grid grid-cols-3 gap-3">
              {QUICK_PICKS.map((value) => (
                <button key={value} type="button" onClick={() => update('crop', value)}
                  className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${form.crop === value ? 'border-agri-500 bg-agri-900/40 text-agri-400' : 'border-white/10 text-slate-400 hover:border-white/30'}`}>
                  <span className="text-xs font-medium">{cropLabel(value)}</span>
                </button>
              ))}
            </div>
            <label htmlFor="crop-select" className="block text-sm text-slate-300 mt-4 mb-1">
              या कोई और फसल चुनें / Or choose another crop
              {crops.length > 0 && <span className="text-slate-500"> ({crops.length} available)</span>}
            </label>
            <select
              id="crop-select"
              value={QUICK_PICKS.includes(form.crop) ? '' : form.crop}
              onChange={(e) => update('crop', e.target.value)}
              className={inputClass}
            >
              <option value="">— select —</option>
              {crops.map((c) => (
                <option key={c.value} value={c.value} className="bg-slate-900">
                  {cropLabel(c.value)}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-300 mb-1">किस्म / Variety</label>
              <input type="text" value={form.variety} onChange={(e) => update('variety', e.target.value)} placeholder="e.g. Swarna, HD-2967" className={inputClass} />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">बुवाई तिथि / Sowing Date</label>
              <input id="sowing-date" type="date" value={form.sowingDate} onChange={(e) => update('sowingDate', e.target.value)} className={inputClass} />
            </div>
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">क्षेत्र (एकड़) / Area (acres)</label>
            <input id="area-acre" type="number" step="0.1" min="0.1" value={form.areaAcre} onChange={(e) => update('areaAcre', e.target.value)} placeholder="e.g. 2.5" className={inputClass} />
          </div>
          <button
            onClick={() => setStep(2)}
            disabled={!form.name || !form.crop || !form.sowingDate || !form.areaAcre}
            className="w-full py-3 bg-agri-600 hover:bg-agri-500 disabled:opacity-40 text-white rounded-lg font-semibold transition-colors"
          >
            Next: Location →
          </button>
        </div>
      )}

      {/* Step 2: Location */}
      {step === 2 && (
        <div className="glass-card p-6 space-y-5">
          <h2 className="font-semibold text-white">स्थान / Location</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-300 mb-1">जिला / District</label>
              <input id="loc-district" type="text" value={form.location.district} onChange={(e) => updateLoc('district', e.target.value)} placeholder="Barabanki" className={inputClass} />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">राज्य / State</label>
              <input id="loc-state" type="text" value={form.location.state} onChange={(e) => updateLoc('state', e.target.value)} placeholder="Uttar Pradesh" className={inputClass} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-300 mb-1">अक्षांश / Latitude</label>
              <input id="loc-lat" type="number" step="0.0001" value={form.location.lat} onChange={(e) => updateLoc('lat', e.target.value)} placeholder="26.9255" className={inputClass} />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">देशांतर / Longitude</label>
              <input id="loc-lon" type="number" step="0.0001" value={form.location.lon} onChange={(e) => updateLoc('lon', e.target.value)} placeholder="81.2045" className={inputClass} />
            </div>
          </div>
          <p className="text-xs text-slate-500">Find lat/lon on Google Maps: right-click → What's here?</p>
          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="flex-1 py-3 border border-white/10 text-slate-400 rounded-lg hover:bg-white/5 transition-colors">← Back</button>
            <button
              onClick={() => setStep(3)}
              disabled={!form.location.district || !form.location.state || !form.location.lat || !form.location.lon}
              className="flex-1 py-3 bg-agri-600 hover:bg-agri-500 disabled:opacity-40 text-white rounded-lg font-semibold transition-colors"
            >Next: Soil →</button>
          </div>
        </div>
      )}

      {/* Step 3: Soil (optional) */}
      {step === 3 && (
        <div className="glass-card p-6 space-y-5">
          <div>
            <h2 className="font-semibold text-white">मिट्टी परीक्षण / Soil Test</h2>
            <p className="text-slate-500 text-xs mt-1">Optional — skip if no soil test data available</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              ['nitrogen', 'नाइट्रोजन N (kg/ha)', '120'],
              ['phosphorus', 'फॉस्फोरस P (kg/ha)', '45'],
              ['potassium', 'पोटेशियम K (kg/ha)', '200'],
              ['ph', 'pH', '6.8'],
            ].map(([key, label, placeholder]) => (
              <div key={key}>
                <label className="block text-sm text-slate-300 mb-1">{label}</label>
                <input type="number" step="0.1" value={form.soil[key]} onChange={(e) => updateSoil(key, e.target.value)} placeholder={placeholder} className={inputClass} />
              </div>
            ))}
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">परीक्षण तिथि / Test Date</label>
            <input type="date" value={form.soil.testedOn} onChange={(e) => updateSoil('testedOn', e.target.value)} className={inputClass} />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(2)} className="flex-1 py-3 border border-white/10 text-slate-400 rounded-lg hover:bg-white/5 transition-colors">← Back</button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 py-3 bg-agri-600 hover:bg-agri-500 disabled:opacity-50 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
            >
              {loading ? <><div className="spinner w-5 h-5" /> Creating & checking...</> : 'Create Field'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
