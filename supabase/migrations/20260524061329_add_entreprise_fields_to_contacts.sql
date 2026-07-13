/*
  # Ajout des champs entreprise sur les contacts

  1. Modifications de la table `contacts`
    - `siren_siret` (text) — numéro SIREN (9 chiffres) ou SIRET (14 chiffres) de l'entreprise
    - `notes_entreprise` (text) — notes libres sur l'entreprise (activité, contexte, historique...)
    - `site_web` (text) — URL du site web de l'entreprise
    - `pagespeed_mobile` (integer, nullable) — score PageSpeed Insights mobile (0-100)
    - `pagespeed_desktop` (integer, nullable) — score PageSpeed Insights desktop (0-100)
    - `pagespeed_checked_at` (timestamptz, nullable) — date du dernier audit PageSpeed

  2. Notes
    - Tous les champs sont optionnels (nullable ou default '')
    - pagespeed scores permettent de qualifier le lead : un site lent est une opportunité commerciale
*/

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'siren_siret') THEN
    ALTER TABLE contacts ADD COLUMN siren_siret text NOT NULL DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'notes_entreprise') THEN
    ALTER TABLE contacts ADD COLUMN notes_entreprise text NOT NULL DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'site_web') THEN
    ALTER TABLE contacts ADD COLUMN site_web text NOT NULL DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'pagespeed_mobile') THEN
    ALTER TABLE contacts ADD COLUMN pagespeed_mobile integer;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'pagespeed_desktop') THEN
    ALTER TABLE contacts ADD COLUMN pagespeed_desktop integer;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'pagespeed_checked_at') THEN
    ALTER TABLE contacts ADD COLUMN pagespeed_checked_at timestamptz;
  END IF;
END $$;
