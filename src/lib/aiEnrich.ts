import { supabase } from './supabase';
import type { Contact } from '../types/database';

export type AiEnrichResult = {
  email: string;
  telephone: string;
  telephone_type: string;
  linkedin_url: string;
  instagram_url: string;
  facebook_url: string;
  siren_siret: string;
  confidence: number;
  sources: string[];
  notes: string;
};

export type CachedEnrichment = AiEnrichResult & { created_at: string };

export function isMobilePhone(value: string): boolean {
  return /^(0[67]|33[67]|9725)/.test((value || '').replace(/\D/g, ''));
}

// L'IA renvoie parfois la chaîne "null" ou "inconnu" au lieu d'un champ vide
function clean(value: unknown): string {
  const s = String(value ?? '').trim();
  return /^(null|undefined|n\/a|inconnu|aucune?)$/i.test(s) ? '' : s;
}

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
      instagram: contact.instagram,
      facebook: contact.facebook,
      siren_siret: contact.siren_siret,
    },
  });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  const r = data.result || {};
  return {
    email: clean(r.email),
    telephone: clean(r.telephone),
    telephone_type: clean(r.telephone_type),
    linkedin_url: clean(r.linkedin_url),
    instagram_url: clean(r.instagram_url),
    facebook_url: clean(r.facebook_url),
    siren_siret: clean(r.siren_siret),
    confidence: Number(r.confidence) || 0,
    sources: Array.isArray(r.sources) ? r.sources.map(clean).filter(Boolean) : [],
    notes: clean(r.notes),
  };
}

export async function getLatestEnrichment(contactId: string): Promise<CachedEnrichment | null> {
  const { data } = await supabase
    .from('ai_enrichments')
    .select('*')
    .eq('contact_id', contactId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  return {
    email: clean(data.email),
    telephone: clean(data.telephone),
    telephone_type: clean(data.telephone_type),
    linkedin_url: clean(data.linkedin_url),
    instagram_url: clean(data.instagram_url),
    facebook_url: clean(data.facebook_url),
    siren_siret: clean(data.siren_siret),
    confidence: Number(data.confidence) || 0,
    sources: Array.isArray(data.sources) ? data.sources.map(clean).filter(Boolean) : [],
    notes: clean(data.notes),
    created_at: data.created_at,
  };
}

export async function saveEnrichment(contactId: string, result: AiEnrichResult): Promise<void> {
  await supabase.from('ai_enrichments').insert({
    contact_id: contactId,
    email: result.email || '',
    telephone: result.telephone || '',
    telephone_type: result.telephone_type || '',
    linkedin_url: result.linkedin_url || '',
    instagram_url: result.instagram_url || '',
    facebook_url: result.facebook_url || '',
    siren_siret: result.siren_siret || '',
    confidence: result.confidence || 0,
    sources: result.sources || [],
    notes: result.notes || '',
  });
}
