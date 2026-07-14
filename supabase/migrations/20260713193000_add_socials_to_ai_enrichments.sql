/*
  # Réseaux sociaux et type de téléphone dans le cache d'enrichissement IA

  1. Modifications
    - `ai_enrichments.instagram_url` (text)
    - `ai_enrichments.facebook_url` (text)
    - `ai_enrichments.telephone_type` (text) - "mobile" | "fixe" | ""
*/

ALTER TABLE ai_enrichments ADD COLUMN IF NOT EXISTS instagram_url text DEFAULT '';
ALTER TABLE ai_enrichments ADD COLUMN IF NOT EXISTS facebook_url text DEFAULT '';
ALTER TABLE ai_enrichments ADD COLUMN IF NOT EXISTS telephone_type text DEFAULT '';
