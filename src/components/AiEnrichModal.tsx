import { useEffect, useState } from 'react';
import { X, Loader2, Sparkles, AlertTriangle, ExternalLink, Check, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { enrichContactWithAi, getLatestEnrichment, saveEnrichment, isMobilePhone, type AiEnrichResult } from '../lib/aiEnrich';
import type { Contact } from '../types/database';

type FieldKey = 'email' | 'telephone' | 'linkedin_url' | 'instagram_url' | 'facebook_url' | 'siren_siret';

const ALL_FIELDS: FieldKey[] = ['email', 'telephone', 'linkedin_url', 'instagram_url', 'facebook_url', 'siren_siret'];

const FIELD_LABELS: Record<FieldKey, string> = {
  email: 'Email',
  telephone: 'Téléphone',
  linkedin_url: 'LinkedIn',
  instagram_url: 'Instagram',
  facebook_url: 'Facebook',
  siren_siret: 'SIREN / SIRET',
};

function currentValue(contact: Contact, key: FieldKey): string {
  if (key === 'linkedin_url') return contact.linkedin || '';
  if (key === 'instagram_url') return contact.instagram || '';
  if (key === 'facebook_url') return contact.facebook || '';
  return contact[key] || '';
}

type Props = {
  contact: Contact;
  onClose: () => void;
  onApplied: () => void;
};

export default function AiEnrichModal({ contact, onClose, onApplied }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [result, setResult] = useState<AiEnrichResult | null>(null);
  const [cachedAt, setCachedAt] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<FieldKey>>(new Set());
  const [saving, setSaving] = useState(false);

  const applyResult = (r: AiEnrichResult) => {
    setResult(r);
    const initial = new Set<FieldKey>();
    ALL_FIELDS.forEach(key => {
      const found = key === 'siren_siret' ? (r.siren_siret || '').replace(/\D/g, '') : (r[key] || '').trim();
      const current = currentValue(contact, key);
      if (!found) return;
      if (!current) {
        initial.add(key);
      } else if (key === 'telephone' && isMobilePhone(found) && !isMobilePhone(current)) {
        // Un portable trouvé remplace par défaut un fixe existant
        initial.add(key);
      }
    });
    setSelected(initial);
  };

  const runEnrichment = async (force = false) => {
    setLoading(true);
    setError('');
    setResult(null);
    setCachedAt(null);
    try {
      if (!force) {
        const cached = await getLatestEnrichment(contact.id);
        if (cached) {
          applyResult(cached);
          setCachedAt(cached.created_at);
          setLoading(false);
          return;
        }
      }
      const r = await enrichContactWithAi(contact);
      await saveEnrichment(contact.id, r);
      applyResult(r);
    } catch (err) {
      setError((err as Error).message || "Échec de l'enrichissement IA");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runEnrichment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = (key: FieldKey) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const handleApply = async () => {
    if (!result || selected.size === 0) return;
    setSaving(true);
    const update: Record<string, string> = {};
    if (selected.has('email') && result.email) update.email = result.email;
    if (selected.has('telephone') && result.telephone) update.telephone = result.telephone;
    if (selected.has('linkedin_url') && result.linkedin_url) update.linkedin = result.linkedin_url;
    if (selected.has('instagram_url') && result.instagram_url) update.instagram = result.instagram_url;
    if (selected.has('facebook_url') && result.facebook_url) update.facebook = result.facebook_url;
    if (selected.has('siren_siret') && result.siren_siret) update.siren_siret = result.siren_siret.replace(/\D/g, '');
    await supabase.from('contacts').update(update).eq('id', contact.id);
    setSaving(false);
    onApplied();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex justify-between items-center rounded-t-2xl">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600" /> Enrichir via IA
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6">
          {loading && (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              <p className="text-sm text-slate-500 text-center">
                Recherche en cours (site web, Google, LinkedIn)...<br />
                <span className="text-xs text-slate-400">Peut prendre 10 à 20 secondes</span>
              </p>
            </div>
          )}

          {!loading && error && (
            <div className="space-y-4">
              <div className="flex items-start gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" /> {error}
              </div>
              <button onClick={() => runEnrichment(true)} className="w-full px-4 py-2 bg-slate-800 text-white rounded-xl text-sm font-semibold hover:bg-slate-900 transition-colors">
                Réessayer
              </button>
            </div>
          )}

          {!loading && !error && result && (
            <div className="space-y-4">
              {cachedAt && (
                <div className="flex items-center justify-between gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl">
                  <p className="text-xs text-slate-500">
                    Résultat mémorisé du {new Date(cachedAt).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <button
                    onClick={() => runEnrichment(true)}
                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-semibold flex-shrink-0"
                  >
                    <RefreshCw className="w-3 h-3" /> Relancer l'analyse
                  </button>
                </div>
              )}
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500">Fiabilité estimée par l'IA</p>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  result.confidence >= 0.7 ? 'bg-emerald-100 text-emerald-700' :
                  result.confidence >= 0.4 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                }`}>
                  {Math.round(result.confidence * 100)}%
                </span>
              </div>

              {result.notes && (
                <div className="flex items-start gap-2 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" /> {result.notes}
                </div>
              )}

              <div className="space-y-2.5">
                {ALL_FIELDS.map(key => {
                  const found = key === 'siren_siret' ? result.siren_siret : result[key];
                  const current = currentValue(contact, key);
                  const hasNew = !!found && found.trim() !== current.trim();
                  const isPhone = key === 'telephone';
                  const foundIsMobile = isPhone && !!found && isMobilePhone(found);
                  const keepExistingMobile = isPhone && hasNew && !foundIsMobile && isMobilePhone(current);
                  return (
                    <label
                      key={key}
                      className={`flex items-start gap-3 p-3 rounded-xl border transition-colors ${
                        !hasNew ? 'border-slate-100 bg-slate-50/60 opacity-60' :
                        selected.has(key) ? 'border-blue-300 bg-blue-50' : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        disabled={!hasNew}
                        checked={selected.has(key)}
                        onChange={() => toggle(key)}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                          {FIELD_LABELS[key]}
                          {isPhone && hasNew && (
                            <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold normal-case ${
                              foundIsMobile ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                            }`}>
                              {foundIsMobile ? 'Portable' : 'Fixe'}
                            </span>
                          )}
                        </p>
                        {hasNew ? (
                          <>
                            <p className="text-sm text-slate-900 break-all">{found}</p>
                            {current && (
                              <p className={`text-xs break-all ${keepExistingMobile ? 'text-emerald-600 font-medium' : 'text-slate-400 line-through'}`}>
                                {keepExistingMobile ? `Portable actuel conservé : ${current}` : current}
                              </p>
                            )}
                          </>
                        ) : (
                          <p className="text-sm text-slate-400">Rien de nouveau trouvé</p>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>

              {result.sources.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Sources</p>
                  <ul className="space-y-1">
                    {result.sources.map((url, i) => (
                      <li key={i}>
                        <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1 truncate">
                          <ExternalLink className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{url}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button onClick={onClose} className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm hover:bg-slate-50 transition-colors">
                  Annuler
                </button>
                <button
                  onClick={handleApply}
                  disabled={selected.size === 0 || saving}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-40 flex items-center justify-center gap-1.5"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Appliquer ({selected.size})
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
