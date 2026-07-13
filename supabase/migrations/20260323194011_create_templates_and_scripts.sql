/*
  # Création des tables pour templates de communication et scripts

  1. Nouvelles Tables
    - `templates`
      - `id` (uuid, primary key)
      - `titre` (text) - Nom du template
      - `type` (text) - Email, WhatsApp, SMS
      - `contenu` (text) - Contenu du message
      - `variables` (text array) - Variables disponibles (nom, entreprise, etc.)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `scripts_phoning`
      - `id` (uuid, primary key)
      - `titre` (text) - Nom du script
      - `contenu` (text) - Contenu du script
      - `actif` (boolean) - Script actif ou non
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Sécurité
    - Enable RLS sur toutes les tables
    - Politiques pour lecture et écriture (accès public pour démo)

  3. Index
    - Index sur le type de template pour filtrage rapide
    - Index sur actif pour scripts
*/

-- Table templates
CREATE TABLE IF NOT EXISTS templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titre text NOT NULL,
  type text NOT NULL,
  contenu text NOT NULL DEFAULT '',
  variables text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index pour templates
CREATE INDEX IF NOT EXISTS idx_templates_type ON templates(type);

-- Table scripts_phoning
CREATE TABLE IF NOT EXISTS scripts_phoning (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titre text NOT NULL,
  contenu text NOT NULL DEFAULT '',
  actif boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index pour scripts
CREATE INDEX IF NOT EXISTS idx_scripts_actif ON scripts_phoning(actif);

-- Trigger pour templates
DROP TRIGGER IF EXISTS update_templates_updated_at ON templates;
CREATE TRIGGER update_templates_updated_at
  BEFORE UPDATE ON templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour scripts_phoning
DROP TRIGGER IF EXISTS update_scripts_updated_at ON scripts_phoning;
CREATE TRIGGER update_scripts_updated_at
  BEFORE UPDATE ON scripts_phoning
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE scripts_phoning ENABLE ROW LEVEL SECURITY;

-- Politiques RLS (accès public pour démo)
CREATE POLICY "Accès public aux templates"
  ON templates FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Accès public aux scripts"
  ON scripts_phoning FOR ALL
  USING (true)
  WITH CHECK (true);

-- Insérer quelques templates par défaut
INSERT INTO templates (titre, type, contenu, variables) VALUES
  ('Premier contact - Email', 'Email', 'Bonjour {prenom},

Je me permets de vous contacter concernant {sujet}.

Seriez-vous disponible pour un échange téléphonique cette semaine ?

Cordialement,', ARRAY['prenom', 'nom', 'entreprise', 'sujet']),
  
  ('Relance - WhatsApp', 'WhatsApp', 'Bonjour {prenom},

Je reviens vers vous suite à notre dernier échange.

Avez-vous eu l''occasion d''y réfléchir ?

Bien à vous', ARRAY['prenom', 'nom', 'entreprise']),
  
  ('Confirmation RDV - SMS', 'SMS', 'Bonjour {prenom}, rappel de notre RDV prévu le {date}. À bientôt !', ARRAY['prenom', 'date'])
ON CONFLICT DO NOTHING;

-- Insérer un script de phoning par défaut
INSERT INTO scripts_phoning (titre, contenu, actif) VALUES
  ('Script d''appel standard', 'INTRODUCTION
--------------
Bonjour, [prénom] ?
Je suis [votre nom] de [votre entreprise].

Je vous appelle car nous accompagnons des entreprises comme [entreprise du prospect] dans [votre domaine].

Avez-vous quelques minutes ?

ACCROCHE
---------
Nous avons récemment aidé [exemple client] à [résultat obtenu].

QUESTIONS DE QUALIFICATION
---------------------------
1. Actuellement, comment gérez-vous [problématique] ?
2. Quels sont vos principaux défis sur ce sujet ?
3. Avez-vous déjà envisagé une solution pour améliorer cela ?

PROPOSITION DE VALEUR
---------------------
Notre solution permet de :
• [Bénéfice 1]
• [Bénéfice 2]
• [Bénéfice 3]

PRISE DE RENDEZ-VOUS
---------------------
Seriez-vous disponible pour un échange de 30 minutes cette semaine ?
Je vous propose [jour] à [heure] ou [jour] à [heure].

OBJECTIONS COURANTES
--------------------
"Je n''ai pas le temps"
→ Je comprends. C''est justement pour vous faire gagner du temps que je vous appelle. 15 minutes suffisent.

"Envoyez-moi un email"
→ Bien sûr, pour personnaliser mon envoi, puis-je vous poser 2-3 questions rapides ?

"Ce n''est pas le bon moment"
→ Je comprends. Quand serait le meilleur moment pour vous recontacter ?

CONCLUSION
----------
Merci pour votre temps. Je vous envoie un récapitulatif par email.
À très bientôt !', true)
ON CONFLICT DO NOTHING;