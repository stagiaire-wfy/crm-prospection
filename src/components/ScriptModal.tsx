import { useEffect, useState } from 'react';
import { X, Phone } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { ScriptPhoning } from '../types/database';

type ScriptModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function ScriptModal({ isOpen, onClose }: ScriptModalProps) {
  const [script, setScript] = useState<ScriptPhoning | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadActiveScript();
    }
  }, [isOpen]);

  const loadActiveScript = async () => {
    try {
      const { data, error } = await supabase
        .from('scripts_phoning')
        .select('*')
        .eq('actif', true)
        .maybeSingle();

      if (error) throw error;
      setScript(data);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4 flex justify-between items-center text-white">
          <div className="flex items-center gap-3">
            <Phone className="w-6 h-6" />
            <div>
              <h2 className="text-2xl font-bold">Script de Phoning</h2>
              {script && <p className="text-sm text-green-100">{script.titre}</p>}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-slate-500">Chargement du script...</div>
            </div>
          ) : script ? (
            <div className="prose max-w-none">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-6">
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-slate-800">
                  {script.contenu}
                </pre>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <Phone className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 mb-2">Aucun script actif</p>
              <p className="text-sm text-slate-400">
                Créez et activez un script dans la page Templates
              </p>
            </div>
          )}
        </div>

        <div className="border-t border-slate-200 px-6 py-4 bg-slate-50">
          <div className="flex justify-between items-center">
            <p className="text-sm text-slate-600">
              Conseil : Gardez ce script ouvert pendant vos appels
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors font-medium"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
