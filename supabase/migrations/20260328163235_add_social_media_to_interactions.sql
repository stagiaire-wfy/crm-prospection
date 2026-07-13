/*
  # Ajout des canaux de communication supplémentaires
  
  1. Modifications
    - Mise à jour de la contrainte du type d'interaction pour inclure :
      - Facebook
      - Instagram
      - (en plus des types existants : Appel, Email, WhatsApp, SMS)
  
  2. Notes importantes
    - Cette migration étend les options de tracking des interactions
    - Permet un suivi détaillé des communications sur les réseaux sociaux
*/

-- Supprimer l'ancienne contrainte si elle existe
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'interactions_type_check'
  ) THEN
    ALTER TABLE interactions DROP CONSTRAINT interactions_type_check;
  END IF;
END $$;

-- Ajouter une nouvelle contrainte avec les types étendus
ALTER TABLE interactions 
ADD CONSTRAINT interactions_type_check 
CHECK (type IN ('Appel', 'Email', 'WhatsApp', 'SMS', 'Facebook', 'Instagram'));