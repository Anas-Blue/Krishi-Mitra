import { useEffect, useState } from 'react';
import { getFields } from '../api/fieldsApi';
import { getEvents, markRead as apiMarkRead } from '../api/eventsApi';
import AlertCard from '../components/AlertCard';

export default function Alerts() {
  const [events, setEvents] = useState([]);
  const [fields, setFields] = useState([]);
  const [selectedField, setSelectedField] = useState('');
  const [loading, setLoading] = useState(true);

  async function loadData() {
    const [evResp, fieldResp] = await Promise.all([
      getEvents(selectedField || undefined),
      getFields(),
    ]);
    setEvents(evResp.data.data.events || []);
    setFields(fieldResp.data.data.fields || []);
  }

  useEffect(() => {
    loadData().catch(console.error).finally(() => setLoading(false));
  }, [selectedField]);

  function handleRead(id) {
    setEvents((prev) => prev.map((e) => e._id === id ? { ...e, read: true } : e));
  }

  const unread = events.filter((e) => !e.read).length;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white font-sans">सूचनाएं / Alerts</h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm font-medium mt-0.5">{unread} unread · {events.length} total</p>
        </div>
        <select
          value={selectedField}
          onChange={(e) => setSelectedField(e.target.value)}
          className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:border-green-600 cursor-pointer shadow-xs"
        >
          <option value="">All fields</option>
          {fields.map((f) => <option key={f._id} value={f._id}>{f.name}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="spinner" /></div>
      ) : events.length === 0 ? (
        <div className="glass-card p-16 text-center">
          <p className="text-slate-700 dark:text-slate-300 font-semibold mb-1">No alerts yet</p>
          <p className="text-slate-500 dark:text-slate-400 text-sm">अभी कोई सूचना नहीं है — खेत की जाँच करें</p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((ev) => (
            <AlertCard key={ev._id} event={ev} onRead={() => handleRead(ev._id)} />
          ))}
        </div>
      )}
    </div>
  );
}
