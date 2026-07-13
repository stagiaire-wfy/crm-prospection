/*
  # Table contact_documents — pièces jointes PDF par contact

  1. Nouvelle table `contact_documents`
    - `id` (uuid, pk)
    - `contact_id` (uuid, FK → contacts)
    - `nom_fichier` (text) — nom original du fichier
    - `storage_path` (text) — chemin dans le bucket Supabase Storage
    - `taille_octets` (bigint) — taille en octets
    - `created_at` (timestamptz)

  2. Sécurité
    - RLS activé
    - Policies : lecture/écriture/suppression pour l'utilisateur authentifié uniquement

  3. Storage
    - Bucket `contact-documents` (privé) créé via INSERT dans storage.buckets si absent
*/

CREATE TABLE IF NOT EXISTS contact_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  nom_fichier text NOT NULL DEFAULT '',
  storage_path text NOT NULL DEFAULT '',
  taille_octets bigint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE contact_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read documents"
  ON contact_documents FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert documents"
  ON contact_documents FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete documents"
  ON contact_documents FOR DELETE
  TO authenticated
  USING (true);

-- Storage bucket (idempotent)
INSERT INTO storage.buckets (id, name, public)
VALUES ('contact-documents', 'contact-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies
CREATE POLICY "Authenticated can upload contact docs"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'contact-documents');

CREATE POLICY "Authenticated can read contact docs"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'contact-documents');

CREATE POLICY "Authenticated can delete contact docs"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'contact-documents');
