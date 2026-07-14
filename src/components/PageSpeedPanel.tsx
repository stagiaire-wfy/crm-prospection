import { useState } from 'react';
import { Smartphone, Monitor, RefreshCw, Loader2, ExternalLink, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { runPageSpeed, normalizeUrl } from '../lib/pagespeed';
import type { Contact, PageSpeedDetails } from '../types/database';

const GOOD = '#0cce6b';
const AVERAGE = '#ffa400';
const POOR = '#ff4e42';
const EMPTY = '#94a3b8';

function scoreColor(score: number | null): string {
  if (score === null) return EMPTY;
  if (score >= 90) return GOOD;
  if (score >= 50) return AVERAGE;
  return POOR;
}

function Gauge({ score, label }: { score: number | null; label: string }) {
  const color = scoreColor(score);
  const r = 24;
  const c = 2 * Math.PI * r;
  const frac = (score ?? 0) / 100;
  return (
    <div className="flex flex-col items-center gap-1.5 w-16">
      <div className="relative w-14 h-14 rounded-full" style={{ background: `${color}1a` }}>
        <svg viewBox="0 0 56 56" className="w-14 h-14 -rotate-90">
          <circle cx="28" cy="28" r={r} fill="none" stroke={color} strokeOpacity="0.25" strokeWidth="4" />
          {score !== null && (
            <circle cx="28" cy="28" r={r} fill="none" stroke={color} strokeWidth="4" strokeDasharray={`${frac * c} ${c}`} strokeLinecap="round" />
          )}
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-sm font-bold" style={{ color }}>
          {score ?? '–'}
        </span>
      </div>
      <span className="text-[10px] text-slate-500 text-center leading-tight">{label}</span>
    </div>
  );
}

function AgenticGauge({ passed, total }: { passed: number | null; total: number | null }) {
  const hasData = passed !== null && total !== null && total > 0;
  const color = !hasData ? EMPTY : passed === total ? GOOD : passed === 0 ? POOR : AVERAGE;
  const r = 24;
  const c = 2 * Math.PI * r;
  const frac = hasData ? passed! / total! : 0;
  return (
    <div className="flex flex-col items-center gap-1.5 w-16">
      <div className="relative w-14 h-14 rounded-full" style={{ background: `${color}1a` }}>
        <svg viewBox="0 0 56 56" className="w-14 h-14 -rotate-90">
          <circle cx="28" cy="28" r={r} fill="none" stroke={color} strokeOpacity="0.25" strokeWidth="4" />
          {hasData && (
            <circle cx="28" cy="28" r={r} fill="none" stroke={color} strokeWidth="4" strokeDasharray={`${frac * c} ${c}`} strokeLinecap="round" />
          )}
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-xs font-bold" style={{ color }}>
          {hasData ? `${passed}/${total}` : '–'}
        </span>
      </div>
      <span className="text-[10px] text-slate-500 text-center leading-tight">Navigation agentique</span>
    </div>
  );
}

type Props = {
  contact: Contact;
  onUpdated: () => void;
};

export default function PageSpeedPanel({ contact, onUpdated }: Props) {
  const [strategy, setStrategy] = useState<'mobile' | 'desktop'>('mobile');
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');

  if (!contact.site_web) return null;

  const details: PageSpeedDetails = contact.pagespeed_details || {};
  const scores = details[strategy];

  const analyze = async () => {
    if (running) return;
    setRunning(true);
    setError('');
    try {
      const [mobile, desktop] = await Promise.all([
        runPageSpeed(contact.site_web, 'mobile'),
        runPageSpeed(contact.site_web, 'desktop'),
      ]);
      const checked_at = new Date().toISOString();
      await supabase.from('contacts').update({
        pagespeed_details: { mobile, desktop, checked_at },
        pagespeed_mobile: mobile.performance,
        pagespeed_desktop: desktop.performance,
        pagespeed_checked_at: checked_at,
      }).eq('id', contact.id);
      onUpdated();
    } catch (err) {
      setError((err as Error).message || "Échec de l'analyse PageSpeed");
    } finally {
      setRunning(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-slate-500">PageSpeed Insights</p>
        <div className="flex items-center gap-1">
          <div className="flex bg-slate-100 rounded-lg p-0.5">
            {([['mobile', Smartphone, 'Mobile'], ['desktop', Monitor, 'Ordinateur']] as const).map(([key, Icon, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setStrategy(key)}
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold transition-colors ${
                  strategy === key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Icon className="w-3 h-3" /> {label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={analyze}
            disabled={running}
            title="Analyser mobile + ordinateur"
            className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white rounded-md text-[10px] font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60"
          >
            {running ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
            {running ? 'Analyse...' : scores ? 'Actualiser' : 'Analyser'}
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 px-3 py-2 mb-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" /> {error}
        </div>
      )}

      {scores ? (
        <>
          <div className="flex flex-wrap justify-between gap-y-3 py-2">
            <Gauge score={scores.performance} label="Performances" />
            <Gauge score={scores.accessibility} label="Accessibilité" />
            <Gauge score={scores.best_practices} label="Bonnes pratiques" />
            <Gauge score={scores.seo} label="SEO" />
            <AgenticGauge passed={scores.agentic_passed} total={scores.agentic_total} />
          </div>
          <div className="flex items-center justify-between mt-1">
            {details.checked_at && (
              <p className="text-[10px] text-slate-400">
                Analysé le {new Date(details.checked_at).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
            <a
              href={`https://pagespeed.web.dev/analysis?url=${encodeURIComponent(normalizeUrl(contact.site_web))}`}
              target="_blank" rel="noopener noreferrer"
              className="text-[10px] text-blue-600 hover:text-blue-800 flex items-center gap-0.5"
            >
              Ouvrir dans PSI <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
        </>
      ) : !running && (
        <p className="text-xs text-slate-400 py-2">
          Aucune analyse enregistrée — cliquez sur « Analyser » pour obtenir les notes mobile et ordinateur.
        </p>
      )}
    </div>
  );
}
