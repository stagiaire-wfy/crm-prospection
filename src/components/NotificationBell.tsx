import { useState, useRef, useEffect } from 'react';
import { Bell, X, ChevronRight, Clock, AlertCircle } from 'lucide-react';
import { useRelanceNotifications } from '../hooks/useRelanceNotifications';
import { supabase } from '../lib/supabase';

type Props = {
  onNavigate: (page: string) => void;
};

export default function NotificationBell({ onNavigate }: Props) {
  const { alerts, count, reload } = useRelanceNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markDone = async (id: string) => {
    await supabase.from('relances').update({ statut: 'fait' }).eq('id', id);
    reload();
  };

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className={`relative p-2.5 rounded-xl transition-colors ${count > 0 ? 'bg-amber-50 hover:bg-amber-100' : 'hover:bg-slate-100'}`}
      >
        <Bell className={`w-5 h-5 ${count > 0 ? 'text-amber-500' : 'text-slate-500'}`} />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center leading-none">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-slate-600" />
              <p className="font-semibold text-slate-900 text-sm">Relances à faire</p>
            </div>
            <button onClick={() => setOpen(false)} className="p-1 hover:bg-slate-100 rounded-lg">
              <X className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>

          {alerts.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <Bell className="w-8 h-8 text-slate-200 mx-auto mb-2" />
              <p className="text-sm text-slate-400 font-medium">Aucune relance en attente</p>
              <p className="text-xs text-slate-300 mt-1">Vous êtes à jour !</p>
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
              {alerts.map(alert => (
                <div key={alert.id} className={`px-4 py-3 flex items-start gap-3 hover:bg-slate-50 transition-colors ${alert.isToday ? 'bg-amber-50/50' : alert.isPast ? 'bg-red-50/30' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5 ${alert.isPast && !alert.isToday ? 'bg-red-400' : 'bg-amber-400'}`}>
                    {alert.contact.prenom?.[0]?.toUpperCase()}{alert.contact.nom?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold text-slate-900 truncate">{alert.contact.prenom} {alert.contact.nom}</p>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold flex-shrink-0 ${alert.isToday ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                        {alert.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      {alert.isToday
                        ? <><Clock className="w-3 h-3 text-amber-500" /><span className="text-xs text-amber-600 font-medium">Aujourd'hui</span></>
                        : <><AlertCircle className="w-3 h-3 text-red-500" /><span className="text-xs text-red-600 font-medium">En retard — {fmtDate(alert.date_relance)}</span></>
                      }
                    </div>
                  </div>
                  <button
                    onClick={() => markDone(alert.id)}
                    className="flex-shrink-0 px-2 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-semibold hover:bg-emerald-200 transition-colors"
                  >
                    Fait
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="px-4 py-3 border-t border-slate-100">
            <button
              onClick={() => { onNavigate('taches'); setOpen(false); }}
              className="w-full flex items-center justify-center gap-2 text-sm text-blue-600 font-semibold hover:text-blue-700 transition-colors"
            >
              Voir toutes les relances
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
