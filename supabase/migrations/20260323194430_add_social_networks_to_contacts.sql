/*
  # Ajout des réseaux sociaux aux contacts

  1. Modifications
    - Ajout du champ `instagram` (text) à la table contacts
    - Ajout du champ `facebook` (text) à la table contacts
    - Ajout du champ `linkedin` (text) à la table contacts
    - Ajout du champ `twitter` (text) à la table contacts

  2. Notes
    - Ces champs permettent de stocker les profils de réseaux sociaux
    - Utile quand l'email n'est pas disponible
    - Tous les champs sont optionnels
*/

-- Ajouter le champ instagram
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'instagram'
  ) THEN
    ALTER TABLE contacts ADD COLUMN instagram text DEFAULT '';
  END IF;
END $$;

-- Ajouter le champ facebook
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'facebook'
  ) THEN
    ALTER TABLE contacts ADD COLUMN facebook text DEFAULT '';
  END IF;
END $$;

-- Ajouter le champ linkedin
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'linkedin'
  ) THEN
    ALTER TABLE contacts ADD COLUMN linkedin text DEFAULT '';
  END IF;
END $$;

-- Ajouter le champ twitter
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'twitter'
  ) THEN
    ALTER TABLE contacts ADD COLUMN twitter text DEFAULT '';
  END IF;
END $$;