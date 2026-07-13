/*
  # Create app_settings table for AI/OpenRouter config and sequence sending parameters
*/

CREATE TABLE IF NOT EXISTS app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  cle text NOT NULL,
  valeur text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, cle)
);

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own settings"
  ON app_settings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
  ON app_settings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON app_settings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own settings"
  ON app_settings FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add sending config columns to email_sequences
ALTER TABLE email_sequences
  ADD COLUMN IF NOT EXISTS delai_base_minutes integer NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS alea_pourcentage integer NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS rewrite_ia boolean NOT NULL DEFAULT true;
