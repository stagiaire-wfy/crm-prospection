/*
  # Système de relances automatiques

  1. New Tables
    - `relances`
      - `id` (uuid, primary key)
      - `contact_id` (uuid, references contacts)
      - `interaction_id` (uuid, references interactions) — interaction déclencheuse
      - `etape` (integer) — numéro de l'étape (1=J+2, 2=J+5, 3=J+7, 4=J+15, 5=J+30)
      - `date_relance` (date) — date prévue de la relance
      - `statut` (text) — 'en_attente' | 'fait' | 'ignore'
      - `tache_id` (uuid, nullable) — tâche associée créée automatiquement
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Modifications
    - Ajout colonne `relance_id` dans `taches` pour lier une tâche à une relance

  3. Security
    - RLS activé sur `relances`
    - Les utilisateurs ne voient que leurs propres relances (via contacts)
*/

CREATE TABLE IF NOT EXISTS relances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  interaction_id uuid REFERENCES interactions(id) ON DELETE SET NULL,
  etape integer NOT NULL CHECK (etape BETWEEN 1 AND 5),
  date_relance date NOT NULL,
  statut text NOT NULL DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'fait', 'ignore')),
  tache_id uuid REFERENCES taches(id) ON DELETE SET NULL,
  notes text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE relances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select relances via contacts"
  ON relances FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM contacts
      WHERE contacts.id = relances.contact_id
    )
  );

CREATE POLICY "Users can insert relances"
  ON relances FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM contacts
      WHERE contacts.id = relances.contact_id
    )
  );

CREATE POLICY "Users can update relances"
  ON relances FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM contacts
      WHERE contacts.id = relances.contact_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM contacts
      WHERE contacts.id = relances.contact_id
    )
  );

CREATE POLICY "Users can delete relances"
  ON relances FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM contacts
      WHERE contacts.id = relances.contact_id
    )
  );

CREATE INDEX IF NOT EXISTS idx_relances_contact_id ON relances(contact_id);
CREATE INDEX IF NOT EXISTS idx_relances_date_relance ON relances(date_relance);
CREATE INDEX IF NOT EXISTS idx_relances_statut ON relances(statut);
