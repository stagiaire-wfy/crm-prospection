/*
  # Ajout des champs pays et secteur d'activité

  1. Modifications
    - Ajout du champ `pays` (text) à la table contacts
      - Valeurs possibles : 'France', 'Israël'
      - Valeur par défaut : 'France'
    - Ajout du champ `secteur_activite` (text) à la table contacts
      - Permet de catégoriser les contacts par métier/industrie
      - Valeur par défaut : ''

  2. Index
    - Ajout d'index sur `pays` pour optimiser les filtres
    - Ajout d'index sur `secteur_activite` pour optimiser les filtres

  3. Notes
    - Ces champs permettent de segmenter les contacts par pays et secteur
    - Facilite le ciblage et les statistiques par marché
*/

-- Ajouter le champ pays
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'pays'
  ) THEN
    ALTER TABLE contacts ADD COLUMN pays text NOT NULL DEFAULT 'France';
  END IF;
END $$;

-- Ajouter le champ secteur_activite
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'secteur_activite'
  ) THEN
    ALTER TABLE contacts ADD COLUMN secteur_activite text DEFAULT '';
  END IF;
END $$;

-- Créer des index pour améliorer les performances des filtres
CREATE INDEX IF NOT EXISTS idx_contacts_pays ON contacts(pays);
CREATE INDEX IF NOT EXISTS idx_contacts_secteur_activite ON contacts(secteur_activite);

-- Créer un index composé pour filtrer par pays et secteur simultanément
CREATE INDEX IF NOT EXISTS idx_contacts_pays_secteur ON contacts(pays, secteur_activite);