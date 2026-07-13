import { supabase } from './supabase';

export type SirenResult = {
  siren: string;
  siret: string;
  entreprise: string | null;
  naf_code: string | null;
  secteur_suggestion: string | null;
  adresse: string;
  code_postal: string;
  ville: string;
  effectif_label: string | null;
  date_creation: string | null;
  actif: boolean;
};

export async function lookupSiren(sirenOrSiret: string): Promise<SirenResult> {
  const { data, error } = await supabase.functions.invoke('enrich-siren', {
    body: { mode: 'lookup', siren_siret: sirenOrSiret },
  });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  return data.result as SirenResult;
}

export async function searchSiren(query: string): Promise<SirenResult[]> {
  const { data, error } = await supabase.functions.invoke('enrich-siren', {
    body: { mode: 'search', query },
  });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  return (data.results as SirenResult[]) || [];
}
