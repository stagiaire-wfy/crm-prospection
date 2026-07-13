/*
  # Création du schéma CRM complet

  1. Nouvelles Tables
    - `contacts`
      - `id` (uuid, primary key)
      - `prenom` (text)
      - `nom` (text)
      - `email` (text)
      - `telephone` (text)
      - `entreprise` (text)
      - `tags` (text array)
      - `statut` (text) - Nouveau, En cours, Converti, Perdu
      - `derniere_interaction` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `interactions`
      - `id` (uuid, primary key)
      - `contact_id` (uuid, foreign key)
      - `type` (text) - Appel, Email, WhatsApp, SMS
      - `date_heure` (timestamptz)
      - `duree` (integer) - en minutes pour les appels
      - `resultat` (text) - Pas de réponse, Répondu, Intéressé, Non intéressé, Relance
      - `notes` (text)
      - `created_at` (timestamptz)
    
    - `taches`
      - `id` (uuid, primary key)
      - `contact_id` (uuid, foreign key, nullable)
      - `titre` (text)
      - `description` (text)
      - `date_echeance` (timestamptz)
      - `statut` (text) - En attente, Terminé
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `objectifs`
      - `id` (uuid, primary key)
      - `date` (date, unique)
      - `appels_objectif` (integer)
      - `messages_objectif` (integer)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Sécurité
    - Enable RLS sur toutes les tables
    - Politiques pour lecture et écriture (accès public pour démo)

  3. Fonctions
    - Trigger pour mettre à jour derniere_interaction automatiquement
    - Trigger pour mettre à jour updated_at
*/

-- Table contacts
CREATE TABLE IF NOT EXISTS contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prenom text NOT NULL DEFAULT '',
  nom text NOT NULL DEFAULT '',
  email text DEFAULT '',
  telephone text DEFAULT '',
  entreprise text DEFAULT '',
  tags text[] DEFAULT '{}',
  statut text NOT NULL DEFAULT 'Nouveau',
  derniere_interaction timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table interactions
CREATE TABLE IF NOT EXISTS interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  type text NOT NULL,
  date_heure timestamptz DEFAULT now(),
  duree integer DEFAULT 0,
  resultat text DEFAULT '',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_interactions_contact_id ON interactions(contact_id);
CREATE INDEX IF NOT EXISTS idx_interactions_date_heure ON interactions(date_heure DESC);
CREATE INDEX IF NOT EXISTS idx_interactions_type ON interactions(type);

-- Table taches
CREATE TABLE IF NOT EXISTS taches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid REFERENCES contacts(id) ON DELETE SET NULL,
  titre text NOT NULL,
  description text DEFAULT '',
  date_echeance timestamptz,
  statut text NOT NULL DEFAULT 'En attente',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index pour les tâches
CREATE INDEX IF NOT EXISTS idx_taches_contact_id ON taches(contact_id);
CREATE INDEX IF NOT EXISTS idx_taches_statut ON taches(statut);
CREATE INDEX IF NOT EXISTS idx_taches_date_echeance ON taches(date_echeance);

-- Table objectifs
CREATE TABLE IF NOT EXISTS objectifs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL UNIQUE,
  appels_objectif integer NOT NULL DEFAULT 0,
  messages_objectif integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour contacts
DROP TRIGGER IF EXISTS update_contacts_updated_at ON contacts;
CREATE TRIGGER update_contacts_updated_at
  BEFORE UPDATE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour taches
DROP TRIGGER IF EXISTS update_taches_updated_at ON taches;
CREATE TRIGGER update_taches_updated_at
  BEFORE UPDATE ON taches
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour objectifs
DROP TRIGGER IF EXISTS update_objectifs_updated_at ON objectifs;
CREATE TRIGGER update_objectifs_updated_at
  BEFORE UPDATE ON objectifs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour mettre à jour derniere_interaction dans contacts
CREATE OR REPLACE FUNCTION update_contact_derniere_interaction()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE contacts
  SET derniere_interaction = NEW.date_heure
  WHERE id = NEW.contact_id
    AND (derniere_interaction IS NULL OR derniere_interaction < NEW.date_heure);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour derniere_interaction
DROP TRIGGER IF EXISTS update_derniere_interaction ON interactions;
CREATE TRIGGER update_derniere_interaction
  AFTER INSERT ON interactions
  FOR EACH ROW
  EXECUTE FUNCTION update_contact_derniere_interaction();

-- Enable RLS
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE taches ENABLE ROW LEVEL SECURITY;
ALTER TABLE objectifs ENABLE ROW LEVEL SECURITY;

-- Politiques RLS (accès public pour démo)
CREATE POLICY "Accès public aux contacts"
  ON contacts FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Accès public aux interactions"
  ON interactions FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Accès public aux tâches"
  ON taches FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Accès public aux objectifs"
  ON objectifs FOR ALL
  USING (true)
  WITH CHECK (true);