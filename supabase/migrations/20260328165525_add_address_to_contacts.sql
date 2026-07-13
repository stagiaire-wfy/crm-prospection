/*
  # Add address fields to contacts table

  1. Changes
    - Add `adresse` (text) - street address
    - Add `ville` (text) - city
    - Add `code_postal` (text) - postal code
    - Add `latitude` (float8) - geocoded latitude for map display
    - Add `longitude` (float8) - geocoded longitude for map display

  2. Notes
    - All fields are optional (nullable)
    - latitude/longitude will be stored after geocoding the address
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'adresse'
  ) THEN
    ALTER TABLE contacts ADD COLUMN adresse text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'ville'
  ) THEN
    ALTER TABLE contacts ADD COLUMN ville text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'code_postal'
  ) THEN
    ALTER TABLE contacts ADD COLUMN code_postal text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'latitude'
  ) THEN
    ALTER TABLE contacts ADD COLUMN latitude float8;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'longitude'
  ) THEN
    ALTER TABLE contacts ADD COLUMN longitude float8;
  END IF;
END $$;
