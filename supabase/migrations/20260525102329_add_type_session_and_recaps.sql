/*
  # Pointage — Catégorisation du temps et récapitulatif journalier

  ## Modifications
  1. `sessions_travail` — ajout de `type_session`
     - Valeur : 'travail' (session de travail classique) ou 'prospection' (appels commerciaux / démarchage)
     - Défaut : 'travail' pour ne pas casser les sessions existantes
  2. Nouvelle table `recaps_journaliers`
     - Stocke, par user et par jour, le total travail effectif + total prospection
     - Permet un affichage rapide des KPIs sans recalculer toutes les sessions
     - RLS : chaque utilisateur ne voit et ne modifie que ses propres lignes

  ## Sécurité
  - RLS activé sur `recaps_journaliers`
  - Politiques SELECT / INSERT / UPDATE / DELETE restreintes à `auth.uid() = user_id`
*/

-- 1. Ajout de la colonne type_session
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sessions_travail' AND column_name = 'type_session'
  ) THEN
    ALTER TABLE sessions_travail
      ADD COLUMN type_session text NOT NULL DEFAULT 'travail'
        CHECK (type_session IN ('travail', 'prospection'));
  END IF;
END $$;

-- 2. Table récapitulatifs journaliers
CREATE TABLE IF NOT EXISTS recaps_journaliers (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  jour          date NOT NULL,
  minutes_travail      integer NOT NULL DEFAULT 0,
  minutes_prospection  integer NOT NULL DEFAULT 0,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now(),
  UNIQUE (user_id, jour)
);

CREATE INDEX IF NOT EXISTS idx_recaps_user_jour ON recaps_journaliers (user_id, jour DESC);

ALTER TABLE recaps_journaliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own recaps"
  ON recaps_journaliers FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recaps"
  ON recaps_journaliers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recaps"
  ON recaps_journaliers FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own recaps"
  ON recaps_journaliers FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
