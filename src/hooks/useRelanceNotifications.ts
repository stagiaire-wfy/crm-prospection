import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Contact } from '../types/database';

export type RelanceAlert = {
  id: string;
  contact: Contact;
  etape: number;
  label: string;
  date_relance: string;
  isToday: boolean;
  isPast: boolean;
  statut: 'en_attente' | 'fait' | 'ignore';
};

const ETAPE_LABELS: Record<number, string> = { 1: 'J+2', 2: 'J+5', 3: 'J+7', 4: 'J+15', 5: 'J+30' };

export function useRelanceNotifications() {
  const [alerts, setAlerts] = useState<RelanceAlert[]>([]);
  const [count, setCount] = useState(0);

  const load = useCallback(async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];
    // Fetch relances due today or overdue and still pending
    const { data } = await supabase
      .from('relances')
      .select('*, contacts(*)')
      .eq('statut', 'en_attente')
      .lte('date_relance', todayStr)
      .order('date_relance', { ascending: true });

    if (!data) return;
    const result: RelanceAlert[] = data.map((r: any) => {
      const relDate = new Date(r.date_relance);
      relDate.setHours(0, 0, 0, 0);
      const isToday = relDate.getTime() === today.getTime();
      const isPast = relDate < today;
      return {
        id: r.id,
        contact: r.contacts as Contact,
        etape: r.etape,
        label: ETAPE_LABELS[r.etape] || `Étape ${r.etape}`,
        date_relance: r.date_relance,
        isToday,
        isPast,
        statut: r.statut,
      };
    });
    setAlerts(result);
    setCount(result.length);
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, [load]);

  return { alerts, count, reload: load };
}
