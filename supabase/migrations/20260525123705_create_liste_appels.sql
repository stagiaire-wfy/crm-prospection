/*
  # Table liste_appels — Programmation d'appels

  ## Nouvelles tables
  1. `liste_appels`
     - Chaque ligne représente un appel à passer, lié à un contact
     - Champs : contact_id, ordre (position dans la liste), notes_preparation, statut ('en_attente' | 'en_cours' | 'traite')
     - Un appel "traité" est masqué de la liste active mais conservé pour l'historique
     - user_id pour isolation par utilisateur

  ## Sécurité
  - RLS activé, politiques restreintes à auth.uid() = user_id
*/

CREATE TABLE IF NOT EXISTS liste_appels (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id     uuid NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  ordre          integer NOT NULL DEFAULT 0,
  notes_prep     text NOT NULL DEFAULT '',
  statut         text NOT NULL DEFAULT 'en_attente'
                   CHECK (statut IN ('en_attente', 'en_cours', 'traite')),
  created_at     timestamptz DEFAULT now(),
  updated_at     timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_liste_appels_user_statut ON liste_appels (user_id, statut, ordre);

ALTER TABLE liste_appels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own liste_appels"
  ON liste_appels FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own liste_appels"
  ON liste_appels FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own liste_appels"
  ON liste_appels FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own liste_appels"
  ON liste_appels FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
