import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Landing() {
  const { user, isAdmin } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20">
        <div className="fade-in max-w-3xl">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 leading-tight font-outfit">
            <span className="text-agri-400">Krishi</span>Mitra
          </h1>
          <p className="text-xl text-slate-300 mb-2">AI-Powered Crop Yield Prediction</p>
          <p className="text-lg text-slate-400 mb-8">कृत्रिम बुद्धिमत्ता से फसल उत्पादन अनुमान</p>

          <p className="text-slate-400 max-w-xl mx-auto mb-10 leading-relaxed">
            Monitor your crop from sowing to harvest. Get GDD-based stage tracking, 
            weather-adjusted yield predictions, and AI-verified recommendations — 
            where <strong className="text-white">deterministic code, not AI, makes the final decision</strong>.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {user ? (
              <Link
                to={isAdmin ? '/admin' : '/dashboard'}
                className="px-8 py-3 bg-agri-600 hover:bg-agri-500 text-white rounded-xl font-semibold text-lg transition-all duration-200 agri-glow"
              >
                Go to Dashboard →
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  className="px-8 py-3 bg-agri-600 hover:bg-agri-500 text-white rounded-xl font-semibold text-lg transition-all duration-200 agri-glow"
                >
                  Register as Farmer
                </Link>
                <Link
                  to="/login"
                  className="px-8 py-3 border border-agri-700 text-agri-400 hover:bg-agri-900/30 rounded-xl font-semibold text-lg transition-colors"
                >
                  Login
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 py-16 max-w-5xl mx-auto w-full">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { title: 'GDD-based Tracking', hindi: 'GDD आधारित ट्रैकिंग', desc: 'Growing Degree Days replaces calendar dates for accurate crop stage prediction.' },
            { title: 'Adversarial AI', hindi: 'प्रतिकूल AI', desc: 'DeepSeek Challenger audits every recommendation. Deterministic code verifies and decides.' },
            { title: 'Weather Intelligence', hindi: 'मौसम बुद्धिमत्ता', desc: '16-day forecast from Open-Meteo. Auto-detect heat stress, dry spells, and heavy rain.' },
          ].map((f) => (
            <div key={f.title} className="glass-card p-6 text-center">
              <h3 className="font-semibold text-white mb-1">{f.title}</h3>
              <p className="text-agri-500 text-xs mb-3">{f.hindi}</p>
              <p className="text-slate-400 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Tagline */}
      <section className="text-center py-12 px-4">
        <blockquote className="text-slate-400 italic text-lg max-w-2xl mx-auto">
          "The LLM does not have authority. It identifies risks.<br />
          <strong className="text-agri-400 not-italic">Deterministic code verifies evidence and makes the final decision.</strong>"
        </blockquote>
        <p className="text-slate-600 text-sm mt-4">Smart India Hackathon 2025</p>
      </section>
    </div>
  );
}
