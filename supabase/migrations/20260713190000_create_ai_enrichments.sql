/*
  # Cache des enrichissements IA

  1. Nouvelle table
    - `ai_enrichments`
      - `id` (uuid, primary key)
      - `contact_id` (uuid, FK contacts, cascade)
      - `email` (text)
      - `telephone` (text)
      - `linkedin_url` (text)
      - `siren_siret` (text)
      - `confidence` (numeric)
      - `sources` (jsonb, tableau d'URLs)
      - `notes` (text)
      - `created_at` (timestamptz)

  2. Sécurité
    - RLS activé, accès complet aux utilisateurs authentifiés (CRM mono-équipe)

  3. Objectif
    - Mémoriser le dernier résultat d'enrichissement par contact pour ne pas
      rappeler l'agent IA (payant) à chaque ouverture du modal.
*/

CREATE TABLE IF NOT EXISTS ai_enrichments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  email text DEFAULT '',
  telephone text DEFAULT '',
  linkedin_url text DEFAULT '',
  siren_siret text DEFAULT '',
  confidence numeric DEFAULT 0,
  sources jsonb DEFAULT '[]'::jsonb,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_enrichments_contact_created
  ON ai_enrichments (contact_id, created_at DESC);

ALTER TABLE ai_enrichments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read ai enrichments"
  ON ai_enrichments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert ai enrichments"
  ON ai_enrichments FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete ai enrichments"
  ON ai_enrichments FOR DELETE
  TO authenticated
  USING (true);
