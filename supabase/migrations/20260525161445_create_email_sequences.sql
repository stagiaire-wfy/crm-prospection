/*
  # Create email sequences system

  1. New Tables
    - `email_sequences` - Defines reusable email sequence templates
      - `id` (uuid, primary key)
      - `titre` (text) - Sequence name
      - `description` (text) - Brief description
      - `etapes` (jsonb) - Array of steps: [{delay_days, template_id, subject}]
      - `actif` (boolean) - Whether sequence is active
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `email_sequence_enrollments` - Tracks contacts enrolled in sequences
      - `id` (uuid, primary key)
      - `sequence_id` (uuid) - References email_sequences
      - `contact_id` (uuid) - References contacts
      - `etape_courante` (integer) - Current step index (0-based)
      - `statut` (text) - 'active', 'completed', 'cancelled'
      - `prochaine_execution` (timestamptz) - When next email should be sent
      - `derniere_execution` (timestamptz) - When last email was sent
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Policies for authenticated users
*/

CREATE TABLE IF NOT EXISTS email_sequences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titre text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  etapes jsonb NOT NULL DEFAULT '[]'::jsonb,
  actif boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE email_sequences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view sequences"
  ON email_sequences FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert sequences"
  ON email_sequences FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update sequences"
  ON email_sequences FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete sequences"
  ON email_sequences FOR DELETE
  TO authenticated
  USING (true);

CREATE TABLE IF NOT EXISTS email_sequence_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id uuid NOT NULL REFERENCES email_sequences(id) ON DELETE CASCADE,
  contact_id uuid NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  etape_courante integer NOT NULL DEFAULT 0,
  statut text NOT NULL DEFAULT 'active',
  prochaine_execution timestamptz,
  derniere_execution timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE email_sequence_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view enrollments"
  ON email_sequence_enrollments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert enrollments"
  ON email_sequence_enrollments FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update enrollments"
  ON email_sequence_enrollments FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete enrollments"
  ON email_sequence_enrollments FOR DELETE
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_enrollments_sequence ON email_sequence_enrollments(sequence_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_contact ON email_sequence_enrollments(contact_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_next_exec ON email_sequence_enrollments(prochaine_execution) WHERE statut = 'active';
