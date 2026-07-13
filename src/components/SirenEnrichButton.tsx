import { useEffect, useRef, useState } from 'react';
import { Building2, Loader2, MapPin } from 'lucide-react';
import { lookupSiren, searchSiren, type SirenResult } from '../lib/siren';

function normalizeDigits(value: string): string {
  return value.replace(/\D/g, '');
}

type Props = {
  sirenSiret: string;
  entreprise: string;
  onApply: (result: SirenResult) => void;
};

export default function SirenEnrichButton({ sirenSiret, entreprise, onApply }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState<SirenResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  const digits = normalizeDigits(sirenSiret);
  const hasValidSiren = digits.length === 9 || digits.length === 14;
  const canSearchByName = !hasValidSiren && entreprise.trim().length >= 2;
  const disabled = !hasValidSiren && !canSearchByName;

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setShowResults(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const handleClick = async () => {
    setError('');
    setLoading(true);
    try {
      if (hasValidSiren) {
        const result = await lookupSiren(digits);
        onApply(result);
      } else if (canSearchByName) {
        const found = await searchSiren(entreprise.trim());
        if (found.length === 0) {
          setError('Aucune entreprise trouvée');
        } else if (found.length === 1) {
          onApply(found[0]);
        } else {
          setResults(found);
          setShowResults(true);
        }
      }
    } catch (err) {
      setError((err as Error).message || 'Erreur lors de la recherche SIRENE');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={boxRef} className="relative inline-block">
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || loading}
        title={disabled ? "Renseignez le SIREN/SIRET ou le nom de l'entreprise" : undefined}
        className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 text-white rounded-xl text-xs font-semibold hover:bg-slate-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Building2 className="w-3.5 h-3.5" />}
        Enrichir via SIRENE
      </button>

      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}

      {showResults && results.length > 0 && (
        <ul className="absolute z-20 mt-1 w-80 bg-white border border-slate-200 rounded-xl shadow-lg max-h-64 overflow-y-auto right-0">
          {results.map(r => (
            <li key={r.siret}>
              <button
                type="button"
                onClick={() => { onApply(r); setShowResults(false); }}
                className="w-full text-left px-3 py-2.5 text-xs hover:bg-blue-50 border-b border-slate-50 last:border-0"
              >
                <p className="font-semibold text-slate-800">{r.entreprise}</p>
                <p className="text-slate-500 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3 flex-shrink-0" />
                  {[r.adresse, r.code_postal, r.ville].filter(Boolean).join(', ') || 'Adresse inconnue'}
                </p>
                <p className="text-slate-400 mt-0.5 font-mono">{r.siret}</p>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
