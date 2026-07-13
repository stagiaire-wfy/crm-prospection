/*
  # Pointage (Time Tracking) System

  1. New Tables
    - `sessions_travail`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `debut` (timestamptz) — clock-in time
      - `fin` (timestamptz, nullable) — clock-out time
      - `duree_minutes` (integer, nullable) — computed duration in minutes
      - `notes` (text) — optional session notes
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `sessions_travail`
    - Users can only access their own sessions
*/

CREATE TABLE IF NOT EXISTS sessions_travail (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  debut timestamptz NOT NULL DEFAULT now(),
  fin timestamptz,
  duree_minutes integer,
  notes text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE sessions_travail ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own sessions"
  ON sessions_travail FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions"
  ON sessions_travail FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
  ON sessions_travail FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions"
  ON sessions_travail FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_sessions_travail_user_debut ON sessions_travail(user_id, debut);
