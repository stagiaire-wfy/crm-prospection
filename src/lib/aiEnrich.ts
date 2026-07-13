import { supabase } from './supabase';
import type { Contact } from '../types/database';

export type AiEnrichResult = {
  email: string;
  telephone: string;
  linkedin_url: string;
  siren_siret: string;
  confidence: number;
  sources: string[];
  notes: string;
};

export async function enrichContactWithAi(contact: Contact): Promise<AiEnrichResult> {
  const { data, error } = await supabase.functions.invoke('enrich-ai', {
    body: {
      contactId: contact.id,
      prenom: contact.prenom,
      nom: contact.nom,
      entreprise: contact.entreprise,
      site_web: contact.site_web,
      ville: contact.ville,
      code_postal: contact.code_postal,
      pays: contact.pays,
      email: contact.email,
      telephone: contact.telephone,
      linkedin: contact.linkedin,
      siren_siret: contact.siren_siret,
    },
  });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  return data.result as AiEnrichResult;
}
